import uuid
from django.db import models  # Standard Django database fields
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from django.contrib.gis.db import models as gis_models  # GeoDjango for map coordinates
from django.contrib.gis.geos import Point
from django.core.validators import MinValueValidator, MaxValueValidator
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    class UserType(models.TextChoices):
        RIDER = 'rider', 'Rider'
        DRIVER = 'driver', 'Driver'
        BOTH = 'both', 'Both'

    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        VERIFIED = 'verified', 'Verified'
        REJECTED = 'rejected', 'Rejected'

    # Primary Fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=15, unique=True, db_index=True)

    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)

    # User type and status
    user_type = models.CharField(max_length=10, choices=UserType.choices, default=UserType.RIDER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)

    # Verification status
    kyc_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    # Biometric authentication
    biometric_enabled = models.BooleanField(default=False)
    biometric_public_key = models.TextField(blank=True, null=True)

    # Location for drivers (Uses gis_models instead of models)
    current_location = gis_models.PointField(
        geography=True,
        blank=True,
        null=True,
        srid=4326
    )
    last_location_update = models.DateTimeField(blank=True, null=True)

    # Ratings
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=5.00,
        validators=[MinValueValidator(1), MaxValueValidator(5.00)]
    )
    total_ratings = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone_number', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['user_type', 'is_online']),
            models.Index(fields=['kyc_status']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
   
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
   
    def is_driver(self):
        return self.user_type in [self.UserType.DRIVER, self.UserType.BOTH]
   
    @property
    def is_verified(self):
        return self.kyc_status == self.VerificationStatus.VERIFIED and self.email_verified and self.phone_verified
   
    def update_location(self, latitude: float, longitude: float):
        """Update Driver's current location"""
        self.current_location = Point(longitude, latitude, srid=4326)
        self.last_location_update = timezone.now()
        self.save(update_fields=['current_location', 'last_location_update'])

    def update_rating(self, new_rating: float):
        """Update user's average rating using a running average"""
        if self.total_ratings == 0:
            self.average_rating = new_rating
            self.total_ratings = 1  # FIXED: single = sign
        else:
            total_rating_score = self.average_rating * self.total_ratings
            total_rating_score += new_rating
            self.total_ratings += 1
            self.average_rating = total_rating_score / self.total_ratings
        self.save(update_fields=['average_rating', 'total_ratings'])


class BiometricData(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='biometric_credentials')
    credential_id = models.TextField(unique=True)
    public_key = models.TextField()
    device_name = models.CharField(max_length=100, blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    sign_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'biometric_credentials'
        indexes = [
            models.Index(fields=['credential_id']),
            models.Index(fields=['user']),
        ]


class RefreshToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token_hash = models.CharField(max_length=64, unique=True)
    device_info = models.JSONField(default=dict)
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'refresh_tokens'
        indexes = [
            models.Index(fields=['user', 'is_revoked']),
            models.Index(fields=['token_hash']),
            models.Index(fields=['expires_at']),
        ]
