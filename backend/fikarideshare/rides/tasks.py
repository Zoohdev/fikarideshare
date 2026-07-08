from celery import shared_task
from django.utils import timezone
from channels.layers import get_channel_layer
from datetime import timedelta
from asgiref.sync import async_to_sync
from .models import Ride
from .services.ride import RideService
from users.models import User

# Seconds a targeted driver has to accept (via DriverAcceptRideView) before
# check_driver_response gives up on them and re-matches to the next-nearest
# driver. Previously nothing re-checked this at all - find_and_assign_driver
# sent exactly one websocket ping and returned, so a driver who never acted
# on it (backgrounded app, missed push, ignored it) left the ride stuck in
# SEARCHING forever. Roughly matches the accept window Uber/Lyft use.
DRIVER_RESPONSE_TIMEOUT_SECONDS = 20


@shared_task(bind=True, max_retries=5, default_retry_delay=30)
def find_and_assign_driver(self, ride_id: str, exclude_drivers: list = None):
    """
    Find and ping the nearest available driver for a ride.

    Schedules check_driver_response DRIVER_RESPONSE_TIMEOUT_SECONDS later -
    if the ride is still unassigned by then, that driver is added to
    exclude_drivers and this task re-runs against the next-nearest one.
    """
    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        return

    if ride.status != Ride.Status.SEARCHING:
        return

    service = RideService()
    driver = service.find_available_driver(ride=ride, exclude_drivers=exclude_drivers or [])

    if driver:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{driver.id}",
            {
                "type": "new_ride_request",
                "data": {
                    "ride_id": str(ride.id),
                    "pickup_address": ride.pickup_address,
                    "dropoff_address": ride.dropoff_address,
                    "fare": float(ride.final_fare or ride.estimated_fare or 0),
                    "pickup_lat": ride.pickup_location.y,
                    "pickup_lng": ride.pickup_location.x,
                    "dropoff_lat": ride.dropoff_location.y,
                    "dropoff_lng": ride.dropoff_location.x,
                    "distance_meters": ride.estimated_distance_meters,
                },
            },
        )
        check_driver_response.apply_async(
            args=[ride_id, str(driver.id), list(exclude_drivers or [])],
            countdown=DRIVER_RESPONSE_TIMEOUT_SECONDS,
        )
        return

    # No driver free right now — retry instead of dying silently.
    if self.request.retries >= self.max_retries:
        from notifications.services import create_notification
        create_notification(
            user=ride.rider,
            notification_type='no_drivers_available',
            title='Still looking for a driver',
            body='No drivers are available near you right now.',
            data={'ride_id': str(ride.id)},
        )
        return

    raise self.retry(countdown=self.default_retry_delay)


@shared_task
def check_driver_response(ride_id: str, driver_id: str, previously_excluded: list = None):
    """
    Fires DRIVER_RESPONSE_TIMEOUT_SECONDS after a ride request was pushed to
    a specific driver. If the ride is still SEARCHING with no driver
    attached, that driver never acted on the push (accepting goes through
    DriverAcceptRideView, which flips status/driver atomically) - add them
    to the exclude list and re-run matching against the next-nearest
    driver instead of leaving the ride stuck.
    """
    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        return

    if ride.status != Ride.Status.SEARCHING or ride.driver_id:
        return  # accepted (by this or another driver) or no longer searching

    exclude_drivers = list(previously_excluded or [])
    if driver_id not in exclude_drivers:
        exclude_drivers.append(driver_id)

    find_and_assign_driver.delay(ride_id, exclude_drivers=exclude_drivers)


@shared_task
def process_scheduled_rides():
    """
    Process scheduled rides that are coming up.
   
    Run every minute via Celery beat.
    """
    # Find rides scheduled for the next 15 minutes
    now = timezone.now()
    upcoming = now + timedelta(minutes=15)
   
    # Scheduling is independent of ride_type (standard/shared) - identify
    # scheduled rides by scheduled_pickup_time being set, not by ride_type
    # (which no longer gets overwritten to 'scheduled' - see
    # RideService.create_ride).
    rides = Ride.objects.filter(
        status=Ride.Status.REQUESTED,
        scheduled_pickup_time__isnull=False,
        scheduled_pickup_time__gte=now,
        scheduled_pickup_time__lte=upcoming,
    )
   
    for ride in rides:
        # Start searching for driver
        ride.status = Ride.Status.SEARCHING
        ride.save()
        find_and_assign_driver.delay(str(ride.id))

