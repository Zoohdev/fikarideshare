from celery import shared_task
from django.utils import timezone
from channels.layers import get_channel_layer
from datetime import timedelta
from asgiref.sync import async_to_sync
from .models import Ride
from .services.ride import RideService
from users.models import User


@shared_task(bind=True, max_retries=5, default_retry_delay=30)
def find_and_assign_driver(self, ride_id: str):
    """
    Find and assign a driver to a ride.
   
    This task runs asynchronously after a ride is created.
    It will retry up to 5 times with 30 second delays.
    """
    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        return
   
    # Check if ride is still waiting for driver
    if ride.status != Ride.Status.SEARCHING:
        return
   
    service = RideService()
   
    # Get list of drivers who declined this ride
    # declined_drivers = list(
    #     ride.driver_requests.filter(
    #         status='declined'
    #     ).values_list('driver_id', flat=True)
    # )
   
    # Find available driver
    # driver = service.find_available_driver(
    #     ride=ride,
    #     exclude_drivers=[str(d) for d in declined_drivers]
    # )
    # # ADD THIS INSTEAD:
    driver = service.find_available_driver(ride=ride, exclude_drivers=[])
    print("Found driver:",driver)
    if driver:
        print("ENTERED DRIVER BLOCK")
        # Keep ride state as searching, but ping the target driver directly via WebSockets
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
                }
            }
        )
        print(f"SENDING TO GROUP: user_{driver.id}")
        print({
            "type": "new_ride_request",
            "data": {
                "ride_id": str(ride.id)
            }
})


@shared_task
def send_ride_request_to_driver(ride_id: str, driver_id: str):
    """
    Send a ride request notification to a driver.
   
    The driver has 30 seconds to accept or the request
    goes to the next available driver.
    """
    from users.models import User
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
   
    try:
        ride = Ride.objects.get(id=ride_id)
        driver = User.objects.get(id=driver_id)
    except (Ride.DoesNotExist, User.DoesNotExist):
        return
   
    # Send WebSocket notification to driver
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{driver_id}',
        {
            'type': 'ride_request',
            'ride_id': str(ride.id),
            'pickup_address': ride.pickup_address,
            'dropoff_address': ride.dropoff_address,
            'estimated_fare': float(ride.estimated_fare),
            'distance_meters': ride.estimated_distance_meters,
            'expires_at': (
                timezone.now() + timedelta(seconds=30)
            ).isoformat(),
        }
    )
   
    print(f"DEBUG: Attempting to send to user_{driver_id}")
   
    # Schedule timeout check
    check_driver_response.apply_async(
        args=[ride_id, driver_id],
        countdown=35  # Check 5 seconds after expiry
    )


# @shared_task
# def check_driver_response(ride_id: str, driver_id: str):
#     """
#     Check if driver responded to ride request.
   
#     If not, mark as declined and find next driver.
#     """
#     try:
#         ride = Ride.objects.get(id=ride_id)
#     except Ride.DoesNotExist:
#         return
   
#     # If ride is still searching, driver didn't accept
#     if ride.status == Ride.Status.SEARCHING and str(ride.driver_id) != driver_id:
#         # Re-trigger driver search
#         find_and_assign_driver.delay(ride_id)

# tasks.py (Modified)
@shared_task
def check_driver_response(ride_id: str, driver_id: str):
    """
    Check if driver responded to ride request.
    If not, mark as declined to avoid matching loops, then find next driver.
    """
    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        return
   
    # If ride is still searching, driver didn't accept in time
    if ride.status == Ride.Status.SEARCHING and (not ride.driver or str(ride.driver_id) != driver_id):
        # Save timeout as a declined request to prevent matching this driver again
        # Adjust related_name/model reference to match your Ride/DriverRequest structure
        ride.driver_requests.update_or_create(
            driver_id=driver_id,
            defaults={'status': 'declined'}
        )
        # Re-trigger driver search to find the next nearest driver
        find_and_assign_driver.delay(ride_id)


@shared_task
def process_scheduled_rides():
    """
    Process scheduled rides that are coming up.
   
    Run every minute via Celery beat.
    """
    # Find rides scheduled for the next 15 minutes
    now = timezone.now()
    upcoming = now + timedelta(minutes=15)
   
    rides = Ride.objects.filter(
        ride_type=Ride.RideType.SCHEDULED,
        status=Ride.Status.REQUESTED,
        scheduled_pickup_time__gte=now,
        scheduled_pickup_time__lte=upcoming,
    )
   
    for ride in rides:
        # Start searching for driver
        ride.status = Ride.Status.SEARCHING
        ride.save()
        find_and_assign_driver.delay(str(ride.id))

