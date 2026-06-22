import uuid
from decimal import Decimal
from django.contrib.gis.db import models
from django.conf import settings
from django.contrib.gis.geos import Point, LineString
from datetime import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Ride(models.Model):
    """
    Core ride model representing a trip from pickup to destination.
    Supports shared rides with multiple participants.
    """
   
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        SEARCHING = 'searching', 'Searching for Driver'
        INVITED = 'invited'
        ACCEPTED = 'accepted'
        WAITING_PICKUP = 'waiting_pickup'
        DECLINED = 'declined',
        PICKED_UP = 'picked_up'
        DRIVER_ASSIGNED = 'driver_assigned', 'Driver Assigned'
        DRIVER_ARRIVING = 'driver_arriving', 'Driver Arriving'
        ARRIVED = 'arrived', 'Driver Arrived'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
   
    class RideType(models.TextChoices):
        STANDARD = 'standard', 'Standard (Single Rider)'
        SHARED = 'shared', 'Shared Ride'
        SCHEDULED = 'scheduled', 'Scheduled Ride'
   
    class CancellationReason(models.TextChoices):
        RIDER_CANCELLED = 'rider_cancelled', 'Cancelled by Rider'
        DRIVER_CANCELLED = 'driver_cancelled', 'Cancelled by Driver'
        NO_DRIVERS = 'no_drivers', 'No Drivers Available'
        PAYMENT_FAILED = 'payment_failed', 'Payment Failed'
        SYSTEM = 'system', 'System Cancellation'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
   
    # Participants
    rider = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='rides_as_rider'
    )
    driver = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='rides_as_driver',
        null=True,
        blank=True
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.PROTECT,
        related_name='rides',
        null=True,
        blank=True
    )
   
    # Ride type and status
    ride_type = models.CharField(
        max_length=20,
        choices=RideType.choices,
        default=RideType.STANDARD
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED
    )
   
    # Locations (using PostGIS geography for accurate calculations)
    pickup_location = models.PointField(geography=True, srid=4326)
    pickup_address = models.TextField()
    dropoff_location = models.PointField(geography=True, srid=4326)
    dropoff_address = models.TextField()
   
    # Route information (populated after driver assigned)
    route_polyline = models.LineStringField(
        geography=True,
        srid=4326,
        null=True,
        blank=True
    )
    estimated_distance_meters = models.PositiveIntegerField(null=True, blank=True)
    estimated_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    actual_distance_meters = models.PositiveIntegerField(null=True, blank=True)
    actual_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    verification_code = models.CharField(max_length=4, null=True, blank=True)
    
    # Pricing
    vehicle_type_requested = models.CharField(
        max_length=20,
        choices=[
            ('economy', 'Economy'),
            ('comfort', 'Comfort'),
            ('premium', 'Premium'),
            ('xl', 'XL'),
        ],
        default='economy'
    )
    estimated_fare = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    final_fare = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    surge_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('1.00')), MaxValueValidator(Decimal('5.00'))]
    )
   
    # Payment reference
    payment = models.OneToOneField(
        'payments.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ride'
    )
   
    # Scheduling (for scheduled rides)
    scheduled_pickup_time = models.DateTimeField(null=True, blank=True)
   
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    driver_assigned_at = models.DateTimeField(null=True, blank=True)
    driver_arrived_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
   
    # Cancellation info
    cancellation_reason = models.CharField(
        max_length=225,
        choices=CancellationReason.choices,
        blank=True
    )
    cancellation_note = models.TextField(blank=True)
    cancellation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
   
    # Additional data
    passenger_count = models.PositiveIntegerField(default=1)
    available_seats = models.PositiveIntegerField(
    default=3)
    pool_open = models.BooleanField(
    default=True
)
    notes = models.TextField(blank=True)  # Special instructions
   
    class Meta:
        db_table = 'rides'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['rider', 'status']),
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['status', 'requested_at']),
            models.Index(fields=['scheduled_pickup_time']),
        ]
   
    def __str__(self):
        return f'Ride {self.id} - {self.status}'
   
    def save(self, *args, **kwargs):
        if not self.verification_code:
            import random
            self.verification_code = str(random.randint(1000, 9999))
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status in [
            self.Status.REQUESTED,
            self.Status.SEARCHING,
            self.Status.DRIVER_ASSIGNED,
            self.Status.DRIVER_ARRIVING,
            self.Status.ARRIVED,
            self.Status.IN_PROGRESS,
        ]
   
    @property
    def can_cancel(self):
        """Check if ride can still be cancelled."""
        return self.status in [
            self.Status.REQUESTED,
            self.Status.SEARCHING,
            self.Status.DRIVER_ASSIGNED,
            self.Status.DRIVER_ARRIVING,
            self.Status.ARRIVED,
        ]


class RideParticipant(models.Model):
    """
    Participants in a shared ride (fare splitting).
    Each participant has their own pickup/dropoff and fare portion.
    """
   
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        PENDING ='pending','Pending'
        SEARCHING = 'searching', 'Searching for Driver'
        INVITED = 'invited'
        ACCEPTED = 'accepted'
        WAITING_PICKUP = 'waiting_pickup'
        DECLINED = 'declined',
        PICKED_UP = 'picked_up'
        DRIVER_ASSIGNED = 'driver_assigned', 'Driver Assigned'
        DRIVER_ARRIVING = 'driver_arriving', 'Driver Arriving'
        ARRIVED = 'arrived', 'Driver Arrived'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey(
        Ride,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='ride_participations'
    )
   
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INVITED
    )
    is_organizer = models.BooleanField(default=False)  # The person who created the ride
   
    # Participant's specific locations (can differ from main ride)
    pickup_location = models.PointField(geography=True, srid=4326)
    pickup_address = models.TextField()
    dropoff_location = models.PointField(geography=True, srid=4326)
    dropoff_address = models.TextField()
    estimated_distance_meters = models.PositiveIntegerField(null=True, blank=True)
    estimated_fare_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pickup_code = models.CharField(max_length=6, blank=True, null=True)
    # Fare split
    fare_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True,  # 👈 Allows database to accept empty values
        blank=True  # 👈 Allows Django forms/serializers to accept empty values
    )
    fare_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
   
    # Payment
    payment = models.ForeignKey(
        'payments.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ride_participations'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )
   
    # Timestamps
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    dropped_off_at = models.DateTimeField(null=True, blank=True)
    pickup_code = models.CharField(
        max_length=4,
        null=True,
        blank=True
    )
    joined_at = models.DateTimeField(
        auto_now_add=True
    )
   
    class Meta:
        db_table = 'ride_participants'
        unique_together = ['ride', 'user']
        indexes = [
            models.Index(fields=['ride', 'status']),
            models.Index(fields=['user', 'status']),
        ]
   
    def __str__(self):
        return f'{self.user.email} - {self.ride}'
    
    def save(self, *args, **kwargs):
        if not self.pickup_code:
            import random
            self.pickup_code = str(random.randint(1000, 9999))
        super().save(*args, **kwargs)


class RideLocation(models.Model):
    """
    Stores location updates during a ride for tracking and route reconstruction.
    High-frequency updates during IN_PROGRESS status.
    """
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey(
        Ride,
        on_delete=models.CASCADE,
        related_name='location_updates'
    )
   
    location = models.PointField(geography=True, srid=4326)
    accuracy_meters = models.FloatField(null=True, blank=True)
    speed_mps = models.FloatField(null=True, blank=True)  # meters per second
    heading = models.FloatField(null=True, blank=True)  # degrees from north
   
    recorded_at = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)
   
    class Meta:
        db_table = 'ride_locations'
        ordering = ['recorded_at']
        indexes = [
            models.Index(fields=['ride', 'recorded_at']),
        ]
   
    def __str__(self):
        return f'Location for Ride {self.ride_id} at {self.recorded_at}'

class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ride_chat_messages'
        ordering = ['timestamp']

class EmergencySOS(models.Model):
    """
    Tracks active crisis events triggered by drivers or passengers.
    """
    class TriggeredBy(models.TextChoices):
        DRIVER = 'driver', 'Driver'
        RIDER = 'rider', 'Rider'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey('rides.Ride', on_delete=models.PROTECT, related_name='sos_alerts')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    reporter_type = models.CharField(max_length=10, choices=TriggeredBy.choices)
    
    # Crisis State Tracking
    is_active = models.BooleanField(default=True)
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Audio Evidence Storage Directory Reference
    audio_recording_vault = models.FileField(upload_to='sos_evidence_audios/', blank=True, null=True)

    class Meta:
        db_table = 'emergency_sos_alerts'


def default_expiry():
    return timezone.now() + timedelta(days=1)

class RideShareLink(models.Model):
    ride = models.OneToOneField(
        Ride,
        on_delete=models.CASCADE,
        related_name="share_link"
    )

    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True
    )

    expires_at = models.DateTimeField(
    default=default_expiry
    )

    view_count = models.IntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )

    created_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="created_share_links",
    null=True,
    blank=True,
)

    def __str__(self):
        return str(self.token)
