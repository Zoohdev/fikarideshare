from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.contrib.gis.geos import Point
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from users.models import User
from vehicles.models import Vehicle
from ..models import Ride, RideParticipant
from .location import GoogleMapsService, DriverLocationService
from .pricing import PricingService


class RideService:
    """
    Core service for ride management.
   
    Handles:
    - Ride creation and fare estimation
    - Driver matching and assignment
    - Ride status transitions
    - Shared ride management
    """
   
    def __init__(self):
        self.maps = GoogleMapsService()
        self.location_service = DriverLocationService()
        self.pricing = PricingService()
        self.channel_layer = get_channel_layer()
   
    def estimate_fare(
        self,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_lat: float,
        dropoff_lng: float,
        vehicle_type: str = 'economy'
    ) -> Dict:
        """
        Calculate fare estimate for a ride.
       
        Returns:
            Dict with fare breakdown and route info
        """
        # Get route information
        directions = self.maps.get_directions(
            origin=(pickup_lat, pickup_lng),
            destination=(dropoff_lat, dropoff_lng)
        )
       
        if not directions:
            return {'error': 'Unable to calculate route'}
       
        # Calculate fare
        fare = self.pricing.calculate_fare(
            distance_meters=directions['distance_meters'],
            duration_seconds=directions['duration_in_traffic_seconds'],
            vehicle_type=vehicle_type
        )
       
        # Get pickup/dropoff addresses
        pickup_address = self.maps.reverse_geocode(pickup_lat, pickup_lng)
        dropoff_address = self.maps.reverse_geocode(dropoff_lat, dropoff_lng)
       
        return {
            'estimated_fare': fare['total'],
            'fare_breakdown': fare,
            'distance_meters': directions['distance_meters'],
            'duration_seconds': directions['duration_in_traffic_seconds'],
            'polyline': directions['polyline'],
            'pickup_address': pickup_address,
            'dropoff_address': dropoff_address,
            'surge_multiplier': fare.get('surge_multiplier', 1.0),
        }
   
    @transaction.atomic
    def create_ride(
        self,
        rider: User,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_lat: float,
        dropoff_lng: float,
        vehicle_type: str = 'economy',
        passenger_count: int = 1,
        notes: str = '',
        scheduled_time: timezone.datetime = None
    ) -> Tuple[bool, Dict]:
        """
        Create a new ride request.
       
        Returns:
            Tuple of (success, ride_data or error)
        """
        # Check if rider has an active ride
        active_ride = Ride.objects.filter(
            rider=rider,
            status__in=[
                Ride.Status.REQUESTED,
                Ride.Status.SEARCHING,
                Ride.Status.DRIVER_ASSIGNED,
                Ride.Status.DRIVER_ARRIVING,
                Ride.Status.ARRIVED,
                Ride.Status.IN_PROGRESS,
            ]
        ).first()
       
        if active_ride:
            return False, {'error': 'You already have an active ride'}
       
        # Get fare estimate
        estimate = self.estimate_fare(
            pickup_lat, pickup_lng,
            dropoff_lat, dropoff_lng,
            vehicle_type
        )
       
        if 'error' in estimate:
            return False, estimate
       
        # Create ride
        ride = Ride.objects.create(
            rider=rider,
            ride_type=(
                Ride.RideType.SCHEDULED if scheduled_time
                else Ride.RideType.STANDARD
            ),
            status=Ride.Status.REQUESTED,
            pickup_location=Point(pickup_lng, pickup_lat, srid=4326),
            pickup_address=estimate['pickup_address'],
            dropoff_location=Point(dropoff_lng, dropoff_lat, srid=4326),
            dropoff_address=estimate['dropoff_address'],
            vehicle_type_requested=vehicle_type,
            estimated_fare=estimate['estimated_fare'],
            estimated_distance_meters=estimate['distance_meters'],
            estimated_duration_seconds=estimate['duration_seconds'],
            surge_multiplier=estimate['surge_multiplier'],
            passenger_count=passenger_count,
            notes=notes,
            scheduled_pickup_time=scheduled_time,
        )
       
        # If not scheduled, start searching for driver
        if not scheduled_time:
            ride.status = Ride.Status.SEARCHING
            ride.save()
           
            # Trigger driver search asynchronously
            from ..tasks import find_and_assign_driver
            find_and_assign_driver.delay(str(ride.id))
       
        return True, {
            'ride_id': str(ride.id),
            'status': ride.status,
            'estimated_fare': float(ride.estimated_fare),
            'pickup_address': ride.pickup_address,
            'dropoff_address': ride.dropoff_address,
            'estimated_duration': estimate['duration_seconds'],
            'polyline': estimate['polyline'],
        }
   
    def find_available_driver(
        self,
        ride: Ride,
        exclude_drivers: List[str] = None
    ) -> Optional[User]:
        """
        Find the best available driver for a ride.
       
        Selection criteria:
        1. Distance to pickup (primary)
        2. Driver rating
        3. Vehicle type match
        """
        exclude_drivers = exclude_drivers or []
       
        nearby_drivers = self.location_service.find_nearby_drivers(
            latitude=ride.pickup_location.y,
            longitude=ride.pickup_location.x,
            radius_km=15,
            vehicle_type=ride.vehicle_type_requested,
            limit=10
        )
       
        for driver_info in nearby_drivers:
            driver_id = driver_info['driver_id']
           
            if driver_id in exclude_drivers:
                continue
           
            # Check driver doesn't have active ride
            has_active_ride = Ride.objects.filter(
                driver_id=driver_id,
                status__in=[
                    Ride.Status.DRIVER_ASSIGNED,
                    Ride.Status.DRIVER_ARRIVING,
                    Ride.Status.ARRIVED,
                    Ride.Status.IN_PROGRESS,
                ]
            ).exists()
           
            if has_active_ride:
                continue
           
            try:
                return User.objects.get(id=driver_id)
            except User.DoesNotExist:
                continue
       
        return None
   
    @transaction.atomic
    def assign_driver(
        self,
        ride: Ride,
        driver: User
    ) -> Tuple[bool, Dict]:
        """
        Assign a driver to a ride.
        """
        # Get driver's primary vehicle
        vehicle = driver.vehicles.filter(
            is_primary=True,
            is_active=True,
            dekra_status='approved'
        ).first()
       
        if not vehicle:
            return False, {'error': 'Driver has no available vehicle'}
       
        # Calculate ETA
        eta_info = self.location_service.get_driver_eta(
            driver=driver,
            destination_lat=ride.pickup_location.y,
            destination_lng=ride.pickup_location.x
        )
       
        # Update ride
        ride.driver = driver
        ride.vehicle = vehicle
        ride.status = Ride.Status.DRIVER_ASSIGNED
        ride.driver_assigned_at = timezone.now()
        ride.save()
       
        # Notify rider via WebSocket
        self._broadcast_ride_update(ride, {
            'driver': {
                'id': str(driver.id),
                'name': driver.full_name,
                'rating': float(driver.average_rating),
                'phone': driver.phone_number,
                'photo': driver.profile_photo.url if driver.profile_photo else None,
            },
            'vehicle': {
                'make': vehicle.make,
                'model': vehicle.model,
                'color': vehicle.color,
                'license_plate': vehicle.license_plate,
            },
            'eta_seconds': eta_info['eta_seconds'] if eta_info else None,
        })
       
        return True, {
            'ride_id': str(ride.id),
            'status': ride.status,
            'driver_id': str(driver.id),
        }
   
    def update_ride_status(
        self,
        ride: Ride,
        new_status: str,
        actor: User,
        data: Dict = None
    ) -> Tuple[bool, Dict]:
        """
        Update ride status with validation.
        """
        data = data or {}
       
        # Validate transition
        valid_transitions = {
            Ride.Status.REQUESTED: [Ride.Status.SEARCHING, Ride.Status.CANCELLED],
            Ride.Status.SEARCHING: [Ride.Status.DRIVER_ASSIGNED, Ride.Status.CANCELLED],
            Ride.Status.DRIVER_ASSIGNED: [Ride.Status.DRIVER_ARRIVING, Ride.Status.CANCELLED],
            Ride.Status.DRIVER_ARRIVING: [Ride.Status.ARRIVED, Ride.Status.CANCELLED],
            Ride.Status.ARRIVED: [Ride.Status.IN_PROGRESS, Ride.Status.CANCELLED],
            Ride.Status.IN_PROGRESS: [Ride.Status.COMPLETED],
        }
       
        if new_status not in valid_transitions.get(ride.status, []):
            return False, {
                'error': f'Invalid transition from {ride.status} to {new_status}'
            }
       
        # Update status and timestamps
        ride.status = new_status
       
        if new_status == Ride.Status.DRIVER_ARRIVING:
            pass  # No additional update needed
        elif new_status == Ride.Status.ARRIVED:
            ride.driver_arrived_at = timezone.now()
        elif new_status == Ride.Status.IN_PROGRESS:
            ride.started_at = timezone.now()
        elif new_status == Ride.Status.COMPLETED:
            ride.completed_at = timezone.now()
            # Calculate final fare based on actual distance/time
            self._calculate_final_fare(ride)
        elif new_status == Ride.Status.CANCELLED:
            ride.cancelled_at = timezone.now()
            ride.cancellation_reason = data.get(
                'reason',
                Ride.CancellationReason.RIDER_CANCELLED if actor == ride.rider
                else Ride.CancellationReason.DRIVER_CANCELLED
            )
            ride.cancellation_note = data.get('note', '')
       
        ride.save()
       
        # Broadcast update
        self._broadcast_ride_update(ride, data)
       
        return True, {
            'ride_id': str(ride.id),
            'status': ride.status,
        }
   
    def _calculate_final_fare(self, ride: Ride):
        """
        Calculate final fare based on actual ride data.
        """
        # Get actual distance from recorded locations
        from django.contrib.gis.db.models.functions import Length
       
        locations = ride.location_updates.order_by('recorded_at')
       
        if locations.count() >= 2:
            # Calculate actual distance from location points
            from django.contrib.gis.geos import LineString
           
            points = [loc.location for loc in locations]
            route = LineString(points)
           
            ride.actual_distance_meters = int(route.length)  # Approximate
       
        # Calculate actual duration
        if ride.started_at and ride.completed_at:
            ride.actual_duration_seconds = int(
                (ride.completed_at - ride.started_at).total_seconds()
            )
       
        # Calculate final fare
        fare = self.pricing.calculate_fare(
            distance_meters=ride.actual_distance_meters or ride.estimated_distance_meters,
            duration_seconds=ride.actual_duration_seconds or ride.estimated_duration_seconds,
            vehicle_type=ride.vehicle_type_requested,
            surge_multiplier=float(ride.surge_multiplier)
        )
       
        ride.final_fare = fare['total']
        ride.save()
   
    def _broadcast_ride_update(self, ride: Ride, extra_data: Dict = None):
        """
        Broadcast ride status update via WebSocket.
        """
        data = {
            'ride_id': str(ride.id),
            'status': ride.status,
            'timestamp': timezone.now().isoformat(),
            **(extra_data or {})
        }
       
        # Send to rider
        async_to_sync(self.channel_layer.group_send)(
            f'user_{ride.rider_id}',
            {
                'type': 'ride_status',
                **data
            }
        )
       
        # Send to driver if assigned
        if ride.driver_id:
            async_to_sync(self.channel_layer.group_send)(
                f'user_{ride.driver_id}',
                {
                    'type': 'ride_status',
                    **data
                }
            )
       
        # Send to ride group (for participants)
        async_to_sync(self.channel_layer.group_send)(
            f'ride_{ride.id}',
            {
                'type': 'ride_status',
                **data
            }
        )

