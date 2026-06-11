import uuid
from decimal import Decimal
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point, LineString
from django.core.validators import MinValueValidator, MaxValueValidator


class Ride(models.Model):
    """
    Core ride model representing a trip from pickup to destination.
    Supports shared rides with multiple participants.
    """
   
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        SEARCHING = 'searching', 'Searching for Driver'
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
        max_length=20,
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
        INVITED = 'invited', 'Invited'
        ACCEPTED = 'accepted', 'Accepted'
        DECLINED = 'declined', 'Declined'
        PICKED_UP = 'picked_up', 'Picked Up'
        DROPPED_OFF = 'dropped_off', 'Dropped Off'
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
   
    # Fare split
    fare_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))]
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
   
    class Meta:
        db_table = 'ride_participants'
        unique_together = ['ride', 'user']
        indexes = [
            models.Index(fields=['ride', 'status']),
            models.Index(fields=['user', 'status']),
        ]
   
    def __str__(self):
        return f'{self.user.email} - {self.ride}'


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

