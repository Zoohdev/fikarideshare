import uuid
from django.db import models


class KYCVerification(models.Model):
    """
    KYC verification records for users.
    Integrates with identity verification providers (Onfido, Jumio, etc.).
    """
   
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        AWAITING_REVIEW = 'awaiting_review', 'Awaiting Manual Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'
   
    class DocumentType(models.TextChoices):
        PASSPORT = 'passport', 'Passport'
        DRIVING_LICENSE = 'driving_license', 'Driving License'
        NATIONAL_ID = 'national_id', 'National ID Card'
        RESIDENCE_PERMIT = 'residence_permit', 'Residence Permit'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='kyc_verifications'
    )
   
    # Verification status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
   
    # Document information
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices
    )
    document_country = models.CharField(max_length=2)  # ISO country code
   
    # Provider integration
    provider = models.CharField(max_length=50, default='onfido')
    provider_applicant_id = models.CharField(max_length=100, blank=True)
    provider_check_id = models.CharField(max_length=100, blank=True)
   
    # Verification results
    result = models.JSONField(default=dict)  # Full provider response
   
    # Individual check results
    document_check_passed = models.BooleanField(null=True)
    facial_similarity_passed = models.BooleanField(null=True)
    liveness_check_passed = models.BooleanField(null=True)
   
    # Rejection/failure info
    rejection_reasons = models.JSONField(default=list)
   
    # Expiry (for driving licenses, etc.)
    document_expiry_date = models.DateField(null=True, blank=True)
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
   
    class Meta:
        db_table = 'kyc_verifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['provider_check_id']),
        ]
   
    def __str__(self):
        return f'{self.user.email} - KYC {self.status}'


class KYCDocument(models.Model):
    """
    Uploaded documents for KYC verification.
    Images are processed by the verification provider.
    """
   
    class DocumentSide(models.TextChoices):
        FRONT = 'front', 'Front'
        BACK = 'back', 'Back'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    verification = models.ForeignKey(
        KYCVerification,
        on_delete=models.CASCADE,
        related_name='documents'
    )
   
    document_side = models.CharField(
        max_length=10,
        choices=DocumentSide.choices
    )
   
    # Secure file storage (encrypted at rest)
    file = models.ImageField(upload_to='kyc/documents/')
   
    # Provider reference
    provider_document_id = models.CharField(max_length=100, blank=True)
   
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
   
    class Meta:
        db_table = 'kyc_documents'


class DriverLicense(models.Model):
    """
    Verified driver's license information.
    Separate from general KYC as it has specific requirements.
    """
   
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Verification'
        VERIFIED = 'verified', 'Verified'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='driver_license'
    )
   
    # License details
    license_number = models.CharField(max_length=50)
    issuing_country = models.CharField(max_length=2)
    issuing_state = models.CharField(max_length=100, blank=True)
   
    # Categories/classes the license covers
    license_classes = models.JSONField(default=list)  # e.g., ["B", "C1"]
   
    # Validity
    issue_date = models.DateField()
    expiry_date = models.DateField()
   
    # Verification
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    verification = models.ForeignKey(
        KYCVerification,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='driver_license_record'
    )
   
    # Document images
    front_image = models.ImageField(upload_to='licenses/front/')
    back_image = models.ImageField(upload_to='licenses/back/', null=True, blank=True)
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
   
    class Meta:
        db_table = 'driver_licenses'
   
    def __str__(self):
        return f'{self.user.email} - License {self.license_number}'
   
    @property
    def is_valid(self):
        from django.utils import timezone
        return (
            self.status == self.Status.VERIFIED and
            self.expiry_date > timezone.now().date()
        )


