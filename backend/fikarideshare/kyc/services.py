import requests
from typing import Dict, Optional, Tuple
from django.conf import settings
from django.utils import timezone

from .models import KYCVerification, KYCDocument


class OnfidoService:
    """
    Service class for Onfido KYC verification integration.
   
    Onfido provides identity verification through:
    1. Document verification (passport, ID, driving license)
    2. Facial similarity check (selfie vs document photo)
    3. Liveness detection (to prevent spoofing)
    """
   
    BASE_URL = '[api.onfido.com](https://api.onfido.com/v3.6)'
   
    def __init__(self):
        self.api_token = settings.ONFIDO_API_TOKEN
        self.headers = {
            'Authorization': f'Token token={self.api_token}',
            'Content-Type': 'application/json',
        }
   
    def create_applicant(self, user) -> Tuple[bool, Dict]:
        """
        Create an applicant in Onfido.
       
        This is the first step in the verification process.
        The applicant ID is used for all subsequent API calls.
        """
        payload = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
       
        # Add optional fields if available
        if user.date_of_birth:
            payload['dob'] = user.date_of_birth.isoformat()
       
        response = requests.post(
            f'{self.BASE_URL}/applicants',
            json=payload,
            headers=self.headers
        )
       
        if response.status_code == 201:
            return True, response.json()
        else:
            return False, {'error': response.json()}
   
    def generate_sdk_token(self, applicant_id: str) -> Tuple[bool, str]:
        """
        Generate an SDK token for the mobile app.
       
        The SDK token allows the mobile app to interact with Onfido
        directly for document capture and selfie recording.
        """
        payload = {
            'applicant_id': applicant_id,
            'application_id': 'com.rideshare.app',  # Your app's bundle ID
        }
       
        response = requests.post(
            f'{self.BASE_URL}/sdk_token',
            json=payload,
            headers=self.headers
        )
       
        if response.status_code == 200:
            return True, response.json().get('token')
        else:
            return False, response.json().get('error', 'Failed to generate token')
   
    def upload_document(
        self,
        applicant_id: str,
        document_type: str,
        file_path: str,
        side: str = 'front'
    ) -> Tuple[bool, Dict]:
        """
        Upload a document for verification.
       
        Args:
            applicant_id: Onfido applicant ID
            document_type: Type of document (passport, driving_licence, national_identity_card)
            file_path: Path to the document image
            side: Document side (front or back)
        """
        files = {
            'file': open(file_path, 'rb'),
        }
        data = {
            'applicant_id': applicant_id,
            'type': document_type,
            'side': side,
        }
       
        # Remove Content-Type header for multipart upload
        headers = {k: v for k, v in self.headers.items() if k != 'Content-Type'}
       
        response = requests.post(
            f'{self.BASE_URL}/documents',
            files=files,
            data=data,
            headers=headers
        )
       
        if response.status_code == 201:
            return True, response.json()
        else:
            return False, {'error': response.json()}
   
    def upload_live_photo(
        self,
        applicant_id: str,
        file_path: str
    ) -> Tuple[bool, Dict]:
        """
        Upload a live photo (selfie) for facial similarity check.
        """
        files = {
            'file': open(file_path, 'rb'),
        }
        data = {
            'applicant_id': applicant_id,
        }
       
        headers = {k: v for k, v in self.headers.items() if k != 'Content-Type'}
       
        response = requests.post(
            f'{self.BASE_URL}/live_photos',
            files=files,
            data=data,
            headers=headers
        )
       
        if response.status_code == 201:
            return True, response.json()
        else:
            return False, {'error': response.json()}
   
    def create_check(
        self,
        applicant_id: str,
        document_ids: list = None,
        check_types: list = None
    ) -> Tuple[bool, Dict]:
        """
        Create a verification check.
       
        This initiates the actual verification process.
        Results are delivered via webhook or polling.
       
        Args:
            applicant_id: Onfido applicant ID
            document_ids: List of uploaded document IDs
            check_types: Types of checks to perform
        """
        if check_types is None:
            check_types = ['document', 'facial_similarity_photo']
       
        payload = {
            'applicant_id': applicant_id,
            'report_names': check_types,
        }
       
        if document_ids:
            payload['document_ids'] = document_ids
       
        response = requests.post(
            f'{self.BASE_URL}/checks',
            json=payload,
            headers=self.headers
        )
       
        if response.status_code == 201:
            return True, response.json()
        else:
            return False, {'error': response.json()}
   
    def get_check_result(self, check_id: str) -> Tuple[bool, Dict]:
        """
        Retrieve the results of a verification check.
        """
        response = requests.get(
            f'{self.BASE_URL}/checks/{check_id}',
            headers=self.headers
        )
       
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, {'error': response.json()}
   
    def get_report(self, report_id: str) -> Tuple[bool, Dict]:
        """
        Get detailed report results.
        """
        response = requests.get(
            f'{self.BASE_URL}/reports/{report_id}',
            headers=self.headers
        )
       
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, {'error': response.json()}


class KYCManager:
    """
    High-level manager for KYC verification workflow.
    """
   
    def __init__(self):
        self.onfido = OnfidoService()
   
    def initiate_verification(self, user, document_type: str) -> Tuple[bool, Dict]:
        """
        Start the KYC verification process.
       
        Returns SDK token for mobile app to capture documents.
        """
        # Create or get existing applicant
        verification = KYCVerification.objects.filter(
            user=user,
            status__in=[
                KYCVerification.Status.PENDING,
                KYCVerification.Status.IN_PROGRESS
            ]
        ).first()
       
        if verification and verification.provider_applicant_id:
            applicant_id = verification.provider_applicant_id
        else:
            # Create new applicant
            success, result = self.onfido.create_applicant(user)
            if not success:
                return False, result
           
            applicant_id = result['id']
           
            # Create verification record
            verification = KYCVerification.objects.create(
                user=user,
                document_type=document_type,
                status=KYCVerification.Status.PENDING,
                provider='onfido',
                provider_applicant_id=applicant_id,
            )
       
        # Generate SDK token for mobile app
        success, token_result = self.onfido.generate_sdk_token(applicant_id)
        if not success:
            return False, {'error': token_result}
       
        # Update user's KYC status
        user.kyc_status = 'in_progress'
        user.save(update_fields=['kyc_status'])
       
        return True, {
            'verification_id': str(verification.id),
            'sdk_token': token_result,
            'applicant_id': applicant_id,
        }
   
    def submit_for_review(self, verification_id: str) -> Tuple[bool, Dict]:
        """
        Submit uploaded documents for verification check.
       
        Called after mobile app finishes document capture.
        """
        try:
            verification = KYCVerification.objects.get(id=verification_id)
        except KYCVerification.DoesNotExist:
            return False, {'error': 'Verification not found'}
       
        # Create the check
        success, result = self.onfido.create_check(
            applicant_id=verification.provider_applicant_id,
            check_types=['document', 'facial_similarity_photo']
        )
       
        if not success:
            return False, result
       
        # Update verification record
        verification.provider_check_id = result['id']
        verification.status = KYCVerification.Status.IN_PROGRESS
        verification.save()
       
        return True, {
            'check_id': result['id'],
            'status': result['status'],
        }
   
    def process_webhook(self, payload: Dict) -> bool:
        """
        Process webhook from Onfido with verification results.
        """
        resource_type = payload.get('payload', {}).get('resource_type')
        action = payload.get('payload', {}).get('action')
       
        if resource_type == 'check' and action == 'check.completed':
            check_id = payload['payload']['object']['id']
            return self._process_check_result(check_id)
       
        return True
   
    def _process_check_result(self, check_id: str) -> bool:
        """
        Process completed check results.
        """
        try:
            verification = KYCVerification.objects.get(
                provider_check_id=check_id
            )
        except KYCVerification.DoesNotExist:
            return False
       
        # Get check results
        success, result = self.onfido.get_check_result(check_id)
        if not success:
            return False
       
        # Store full result
        verification.result = result
       
        # Process individual reports
        reports = result.get('report_ids', [])
        all_clear = True
        rejection_reasons = []
       
        for report_id in reports:
            success, report = self.onfido.get_report(report_id)
            if success:
                report_name = report.get('name')
                report_result = report.get('result')
               
                if report_name == 'document':
                    verification.document_check_passed = report_result == 'clear'
                    if report_result != 'clear':
                        all_clear = False
                        breakdown = report.get('breakdown', {})
                        for key, value in breakdown.items():
                            if value.get('result') != 'clear':
                                rejection_reasons.append(f'Document: {key}')
               
                elif report_name == 'facial_similarity_photo':
                    verification.facial_similarity_passed = report_result == 'clear'
                    if report_result != 'clear':
                        all_clear = False
                        rejection_reasons.append('Facial similarity check failed')
       
        # Update verification status
        if all_clear:
            verification.status = KYCVerification.Status.APPROVED
            verification.user.kyc_status = 'verified'
        else:
            verification.status = KYCVerification.Status.REJECTED
            verification.rejection_reasons = rejection_reasons
            verification.user.kyc_status = 'rejected'
       
        verification.completed_at = timezone.now()
        verification.save()
        verification.user.save(update_fields=['kyc_status'])
       
        return True

