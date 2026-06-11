import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Vehicle(models.Model):
    """
    Vehicle information for drivers.
    Includes DEKRA roadworthiness verification status.
    """
   
    class VehicleType(models.TextChoices):
        ECONOMY = 'economy', 'Economy'
        COMFORT = 'comfort', 'Comfort'
        PREMIUM = 'premium', 'Premium'
        XL = 'xl', 'XL (6+ seats)'
        ELECTRIC = 'electric', 'Electric'
   
    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending Verification'
        IN_PROGRESS = 'in_progress', 'Verification In Progress'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Verification Expired'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='vehicles'
    )
   
    # Vehicle details
    make = models.CharField(max_length=100)  # e.g., Toyota
    model = models.CharField(max_length=100)  # e.g., Camry
    year = models.PositiveIntegerField(
        validators=[MinValueValidator(1990), MaxValueValidator(2030)]
    )
    color = models.CharField(max_length=50)
    license_plate = models.CharField(max_length=20, unique=True, db_index=True)
   
    # Vehicle classification
    vehicle_type = models.CharField(
        max_length=20,
        choices=VehicleType.choices,
        default=VehicleType.ECONOMY
    )
    seats = models.PositiveIntegerField(
        default=4,
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )
   
    # Documents
    registration_document = models.ImageField(
        upload_to='vehicles/registration/',
        null=True,
        blank=True
    )
    insurance_document = models.ImageField(
        upload_to='vehicles/insurance/',
        null=True,
        blank=True
    )
    insurance_expiry = models.DateField(null=True, blank=True)
   
    # DEKRA verification
    dekra_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    dekra_verification_id = models.CharField(max_length=100, blank=True)
    dekra_certificate_url = models.URLField(blank=True)
    dekra_verified_at = models.DateTimeField(null=True, blank=True)
    dekra_expires_at = models.DateField(null=True, blank=True)
    dekra_rejection_reason = models.TextField(blank=True)
   
    # Vehicle photos (multiple angles)
    photo_front = models.ImageField(upload_to='vehicles/photos/', null=True, blank=True)
    photo_back = models.ImageField(upload_to='vehicles/photos/', null=True, blank=True)
    photo_side = models.ImageField(upload_to='vehicles/photos/', null=True, blank=True)
    photo_interior = models.ImageField(upload_to='vehicles/photos/', null=True, blank=True)
   
    # Status
    is_active = models.BooleanField(default=True)
    is_primary = models.BooleanField(default=False)  # Primary vehicle for the driver
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    class Meta:
        db_table = 'vehicles'
        indexes = [
            models.Index(fields=['driver', 'is_active']),
            models.Index(fields=['license_plate']),
            models.Index(fields=['dekra_status']),
        ]
        constraints = [
            # Ensure only one primary vehicle per driver
            models.UniqueConstraint(
                fields=['driver'],
                condition=models.Q(is_primary=True),
                name='unique_primary_vehicle_per_driver'
            )
        ]
   
    def __str__(self):
        return f'{self.year} {self.make} {self.model} ({self.license_plate})'
   
    @property
    def is_roadworthy(self):
        """Check if vehicle has valid DEKRA certification."""
        from django.utils import timezone
        return (
            self.dekra_status == self.VerificationStatus.APPROVED and
            self.dekra_expires_at and
            self.dekra_expires_at > timezone.now().date()
        )
   
    @property
    def needs_reverification(self):
        """Check if DEKRA verification is expiring soon (within 30 days)."""
        from django.utils import timezone
        from datetime import timedelta
       
        if not self.dekra_expires_at:
            return True
       
        warning_date = timezone.now().date() + timedelta(days=30)
        return self.dekra_expires_at <= warning_date


class VehicleInspection(models.Model):
    """
    Records of DEKRA inspection requests and results.
    Maintains history of all inspections for a vehicle.
    """
   
    class InspectionType(models.TextChoices):
        INITIAL = 'initial', 'Initial Inspection'
        RENEWAL = 'renewal', 'Renewal Inspection'
        REINSPECTION = 'reinspection', 'Re-inspection (after failure)'
   
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        SCHEDULED = 'scheduled', 'Scheduled'
        IN_PROGRESS = 'in_progress', 'In Progress'
        PASSED = 'passed', 'Passed'
        FAILED = 'failed', 'Failed'
        CANCELLED = 'cancelled', 'Cancelled'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='inspections'
    )
   
    # Inspection details
    inspection_type = models.CharField(
        max_length=20,
        choices=InspectionType.choices
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED
    )
   
    # DEKRA reference
    dekra_request_id = models.CharField(max_length=100, unique=True)
    dekra_inspection_id = models.CharField(max_length=100, blank=True)
   
    # Scheduling
    scheduled_date = models.DateField(null=True, blank=True)
    inspection_location = models.TextField(blank=True)
   
    # Results
    inspected_at = models.DateTimeField(null=True, blank=True)
    passed = models.BooleanField(null=True)
    inspection_report = models.JSONField(default=dict)  # Detailed results
    failure_reasons = models.JSONField(default=list)  # List of issues found
   
    # Certificate (if passed)
    certificate_number = models.CharField(max_length=100, blank=True)
    certificate_valid_until = models.DateField(null=True, blank=True)
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    class Meta:
        db_table = 'vehicle_inspections'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vehicle', 'status']),
            models.Index(fields=['dekra_request_id']),
        ]
   
    def __str__(self):
        return f'{self.vehicle} - {self.inspection_type} ({self.status})'


