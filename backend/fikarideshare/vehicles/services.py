import requests
from typing import Dict, Tuple, Optional
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import Vehicle, VehicleInspection


class DEKRAService:
    """
    Service for integrating with DEKRA vehicle inspection API.
   
    DEKRA provides roadworthiness verification for vehicles,
    ensuring they meet safety standards for ride-sharing.
   
    Note: This is a simulated API integration. Actual DEKRA API
    endpoints and authentication may differ.
    """
   
    def __init__(self):
        self.api_key = settings.DEKRA_API_KEY
        self.base_url = settings.DEKRA_API_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }
   
    def request_inspection(
        self,
        vehicle: Vehicle,
        inspection_type: str = 'initial'
    ) -> Tuple[bool, Dict]:
        """
        Request a new vehicle inspection from DEKRA.
       
        Args:
            vehicle: Vehicle model instance
            inspection_type: Type of inspection (initial, renewal, reinspection)
       
        Returns:
            Tuple of (success, result_dict)
        """
        payload = {
            'vehicle': {
                'make': vehicle.make,
                'model': vehicle.model,
                'year': vehicle.year,
                'license_plate': vehicle.license_plate,
                'color': vehicle.color,
                'vehicle_type': vehicle.vehicle_type,
            },
            'owner': {
                'name': vehicle.driver.full_name,
                'email': vehicle.driver.email,
                'phone': vehicle.driver.phone_number,
            },
            'inspection_type': inspection_type,
            'callback_url': f'{settings.BASE_URL}/api/vehicles/dekra/webhook/',
        }
       
        try:
            response = requests.post(
                f'{self.base_url}/inspections/request',
                json=payload,
                headers=self.headers,
                timeout=30
            )
           
            if response.status_code in [200, 201]:
                return True, response.json()
            else:
                return False, {
                    'error': response.json().get('message', 'Request failed'),
                    'status_code': response.status_code
                }
        except requests.RequestException as e:
            return False, {'error': str(e)}
   
    def get_inspection_status(self, inspection_id: str) -> Tuple[bool, Dict]:
        """
        Get the current status of an inspection.
        """
        try:
            response = requests.get(
                f'{self.base_url}/inspections/{inspection_id}',
                headers=self.headers,
                timeout=30
            )
           
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, {'error': 'Inspection not found'}
        except requests.RequestException as e:
            return False, {'error': str(e)}
   
    def get_certificate(self, certificate_id: str) -> Tuple[bool, Dict]:
        """
        Retrieve the inspection certificate.
        """
        try:
            response = requests.get(
                f'{self.base_url}/certificates/{certificate_id}',
                headers=self.headers,
                timeout=30
            )
           
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, {'error': 'Certificate not found'}
        except requests.RequestException as e:
            return False, {'error': str(e)}
   
    def get_available_locations(
        self,
        latitude: float,
        longitude: float,
        radius_km: int = 50
    ) -> Tuple[bool, list]:
        """
        Get available DEKRA inspection locations near coordinates.
        """
        try:
            response = requests.get(
                f'{self.base_url}/locations',
                params={
                    'lat': latitude,
                    'lng': longitude,
                    'radius': radius_km,
                },
                headers=self.headers,
                timeout=30
            )
           
            if response.status_code == 200:
                return True, response.json().get('locations', [])
            else:
                return False, []
        except requests.RequestException as e:
            return False, []


class VehicleManager:
    """
    High-level manager for vehicle operations.
    """
   
    def __init__(self):
        self.dekra = DEKRAService()
   
    def register_vehicle(self, driver, vehicle_data: Dict) -> Tuple[bool, Vehicle]:
        """
        Register a new vehicle for a driver.
        """
        # Check if license plate already exists
        if Vehicle.objects.filter(
            license_plate=vehicle_data['license_plate']
        ).exists():
            return False, None
       
        vehicle = Vehicle.objects.create(
            driver=driver,
            **vehicle_data
        )
       
        # Set as primary if driver has no other vehicles
        if not driver.vehicles.exclude(id=vehicle.id).exists():
            vehicle.is_primary = True
            vehicle.save()
       
        return True, vehicle
   
    def request_inspection(
        self,
        vehicle: Vehicle,
        inspection_type: str = 'initial'
    ) -> Tuple[bool, Dict]:
        """
        Request DEKRA inspection for a vehicle.
        """
        # Check for existing pending inspection
        existing = VehicleInspection.objects.filter(
            vehicle=vehicle,
            status__in=[
                VehicleInspection.Status.REQUESTED,
                VehicleInspection.Status.SCHEDULED,
                VehicleInspection.Status.IN_PROGRESS,
            ]
        ).exists()
       
        if existing:
            return False, {'error': 'An inspection is already pending'}
       
        # Request inspection from DEKRA
        success, result = self.dekra.request_inspection(vehicle, inspection_type)
       
        if not success:
            return False, result
       
        # Create inspection record
        inspection = VehicleInspection.objects.create(
            vehicle=vehicle,
            inspection_type=inspection_type,
            status=VehicleInspection.Status.REQUESTED,
            dekra_request_id=result.get('request_id'),
        )
       
        # Update vehicle status
        vehicle.dekra_status = Vehicle.VerificationStatus.IN_PROGRESS
        vehicle.dekra_verification_id = result.get('request_id')
        vehicle.save()
       
        return True, {
            'inspection_id': str(inspection.id),
            'dekra_request_id': result.get('request_id'),
            'status': 'requested',
        }
   
    def process_webhook(self, payload: Dict) -> bool:
        """
        Process DEKRA webhook with inspection results.
        """
        event_type = payload.get('event')
        data = payload.get('data', {})
       
        if event_type == 'inspection.scheduled':
            return self._handle_scheduled(data)
        elif event_type == 'inspection.completed':
            return self._handle_completed(data)
        elif event_type == 'inspection.failed':
            return self._handle_failed(data)
       
        return True
   
    def _handle_scheduled(self, data: Dict) -> bool:
        """Handle inspection scheduled event."""
        try:
            inspection = VehicleInspection.objects.get(
                dekra_request_id=data['request_id']
            )
            inspection.status = VehicleInspection.Status.SCHEDULED
            inspection.dekra_inspection_id = data.get('inspection_id')
            inspection.scheduled_date = data.get('scheduled_date')
            inspection.inspection_location = data.get('location', '')
            inspection.save()
            return True
        except VehicleInspection.DoesNotExist:
            return False
   
    def _handle_completed(self, data: Dict) -> bool:
        """Handle inspection completed event."""
        try:
            inspection = VehicleInspection.objects.get(
                dekra_request_id=data['request_id']
            )
        except VehicleInspection.DoesNotExist:
            return False
       
        passed = data.get('result') == 'pass'
       
        inspection.status = (
            VehicleInspection.Status.PASSED if passed
            else VehicleInspection.Status.FAILED
        )
        inspection.passed = passed
        inspection.inspected_at = timezone.now()
        inspection.inspection_report = data.get('report', {})
       
        if passed:
            inspection.certificate_number = data.get('certificate_number')
            inspection.certificate_valid_until = data.get('valid_until')
           
            # Update vehicle
            vehicle = inspection.vehicle
            vehicle.dekra_status = Vehicle.VerificationStatus.APPROVED
            vehicle.dekra_verified_at = timezone.now()
            vehicle.dekra_expires_at = data.get('valid_until')
            vehicle.dekra_certificate_url = data.get('certificate_url', '')
            vehicle.save()
        else:
            inspection.failure_reasons = data.get('failure_reasons', [])
           
            vehicle = inspection.vehicle
            vehicle.dekra_status = Vehicle.VerificationStatus.REJECTED
            vehicle.dekra_rejection_reason = '\n'.join(
                data.get('failure_reasons', [])
            )
            vehicle.save()
       
        inspection.save()
        return True
   
    def _handle_failed(self, data: Dict) -> bool:
        """Handle inspection request failure event."""
        try:
            inspection = VehicleInspection.objects.get(
                dekra_request_id=data['request_id']
            )
            inspection.status = VehicleInspection.Status.FAILED
            inspection.failure_reasons = [data.get('reason', 'Unknown error')]
            inspection.save()
           
            inspection.vehicle.dekra_status = Vehicle.VerificationStatus.REJECTED
            inspection.vehicle.save()
           
            return True
        except VehicleInspection.DoesNotExist:
            return False

