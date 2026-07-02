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
    Asynchronous runner designed to isolate drivers and broadcast notifications.
    Includes fallback retry blocks when the engine registers an empty pool.
    """
    print(f"\n[CELERY WORKER EXECUTION] Initiating task wrapper for Ride ID: {ride_id}")
    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        print(f"[CELERY ERROR] Processing halted. Ride instance '{ride_id}' could not be located in database.")
        return
   
    # Ensure matching runs only when the request status is active
    print(f"[CELERY WORKER STATE] Current database status for Ride {ride_id} is: '{ride.status}'")
    if ride.status != Ride.Status.SEARCHING:
        print(f"[CELERY TERMINATION] Ride state is no longer 'searching'. Skipping duplicate pass.")
        return
   
    service = RideService()
   
    # Trigger matching cycle
    driver = service.find_available_driver(ride=ride, exclude_drivers=[])
    print(f"[CELERY SELECTION VERIFICATION] Engine returned raw output object: {driver}")
    
    if driver:
        print(f"[CELERY ACTION SUCCESS] Moving to direct WebSocket ping block for driver user ID: {driver.id}")
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{driver.id}",
                {
                    "type": "new_ride_request",
                    "data": {
                        "ride_id": str(ride.id),
                        "pickup_address": getattr(ride, 'pickup_address', ''),
                        "destination_address": getattr(ride, 'destination_address', ''),
                        "fare": str(getattr(ride, 'fare', '0.00'))
                    }
                }
            )
            print(f"[CELERY COMMUNICATION] Event payload dispatched smoothly into channel group: 'user_{driver.id}'")
        except Exception as websocket_err:
            print(f"[CELERY CORE EXCEPTION] Failed to broadcast over channel layers: {str(websocket_err)}")
    else:
        print("\n" + "!"*60)
        print(f"[CELERY REVALUATION HOOK] Match algorithm found no candidate at timestamp: {timezone.now()}")
        print(f"-> Current Retry State: Loop Count {self.request.retries} out of max permitted {self.max_retries}")
        
        if self.request.retries < self.max_retries:
            print(f"-> Action Chosen: Queuing async backoff retry. Re-evaluating in 30 seconds.")
            print("!"*60 + "\n")
            raise self.retry()
        else:
            print(f"-> Action Chosen: Exhausted all retry limits. Modifying database payload status to CANCELLED.")
            print("!"*60 + "\n")
            ride.status = Ride.Status.CANCELLED
            ride.save(update_fields=['status'])
            
            # Sync update back to the rider interface
            service._broadcast_ride_update(ride, {"event": "no_driver_found"})


# @shared_task(bind=True, max_retries=5, default_retry_delay=30)
# def find_and_assign_driver(self, ride_id: str):
#     """
#     Find and assign a driver to a ride.
   
#     This task runs asynchronously after a ride is created.
#     It will retry up to 5 times with 30 second delays.
#     """
#     try:
#         ride = Ride.objects.get(id=ride_id)
#     except Ride.DoesNotExist:
#         return
   
#     # Check if ride is still waiting for driver
#     if ride.status != Ride.Status.SEARCHING:
#         return
   
#     service = RideService()
   
#     # Get list of drivers who declined this ride
#     # declined_drivers = list(
#     #     ride.driver_requests.filter(
#     #         status='declined'
#     #     ).values_list('driver_id', flat=True)
#     # )
   
#     # Find available driver
#     # driver = service.find_available_driver(
#     #     ride=ride,
#     #     exclude_drivers=[str(d) for d in declined_drivers]
#     # )
#     # # ADD THIS INSTEAD:
#     driver = service.find_available_driver(ride=ride, exclude_drivers=[])
#     print("Found driver:",driver)
#     if driver:
#         print("ENTERED DRIVER BLOCK")
#         # Keep ride state as searching, but ping the target driver directly via WebSockets
#         channel_layer = get_channel_layer()
#         async_to_sync(channel_layer.group_send)(
#             f"user_{driver.id}",
#             {
#                 "type": "new_ride_request",
#                 "data": {
#                     "ride_id": str(ride.id),
#                     "pickup_address": ride.pickup_address,
#                     "dropoff_address": ride.dropoff_address,
#                     "fare": float(ride.final_fare or ride.estimated_fare or 0),
#                     "pickup_lat": ride.pickup_location.y,
#                     "pickup_lng": ride.pickup_location.x,
#                     "dropoff_lat": ride.dropoff_location.y,
#                     "dropoff_lng": ride.dropoff_location.x,
#                     "distance_meters": ride.estimated_distance_meters,
#                 }
#             }
#         )
#         print(f"SENDING TO GROUP: user_{driver.id}")
#         print({
#             "type": "new_ride_request",
#             "data": {
#                 "ride_id": str(ride.id)
#             }
# })


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

