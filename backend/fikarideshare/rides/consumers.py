print("CONSUMER FILE LOADED")
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

from users.models import User
from .models import Ride, RideLocation
from .services.location import DriverLocationService
from geopy.distance import geodesic
from django.db import models
from django.contrib.gis.geos import Point

class LocationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time location tracking.
   
    Handles:
    - Driver location updates
    - Ride tracking
    - Real-time ETA updates
    """
    

    async def connect(self):
        # self.user = self.scope.get('user')
        # print(f"DEBUG: Connection attempt from user: {self.user}")
        # if not self.user or self.user.is_anonymous:
        #     print("DEBUG: Connection rejected: User not authenticated")
        #     await self.close()
        #     return
       
        # # Join user-specific channel
        # self.user_group = f'user_{self.user.id}'
        # await self.channel_layer.group_add(
        #     self.user_group,
        #     self.channel_name
        # )
       
        # await self.accept()
       
        # # Mark user as online
        # await self.set_user_online(True)
        print("CONNECT START")
        try:
            self.user = self.scope.get("user")
            print("USER:", self.user)
            if not self.user or self.user.is_anonymous:
                query_string = self.scope.get(
                    "query_string",
                    b""
                ).decode()
                print("QUERY STRING:", query_string)
                if "public_tracking=true" in query_string:
                    print("PUBLIC TRACKING SOCKET")
                    self.user = None

                elif "user_id" in query_string:
                    print("USER_ID SOCKET")
                    from users.models import User
                    try:
                        user_id = query_string.split("user_id=")[1].split("&")[0]
                        self.user = await database_sync_to_async(User.objects.get)(id=user_id)
                    except Exception:
                        print("USER FETCH ERROR:", e)
                        await self.close()
                        return
                else:
                    print("NO USER AND NO PUBLIC TRACKING")
                    await self.close()
                    return
                    
            print("STEP 1")
            print("CONNECT START")
            print("USER:", self.user)

            if self.user:

                self.user_group = (
                    f"user_{self.user.id}"
                )
                print("JOINING GROUP:", f"user_{self.user.id}")

                print("STEP 2")

                await self.channel_layer.group_add(
                    self.user_group,
                    self.channel_name
                )

                print(
                    f"CONNECTED USER GROUP: {self.user_group}"
                )

                print("STEP 3")

            await self.accept()
            print("SOCKET ACCEPTED")
            print("STEP 4")

        except Exception as e:
            import traceback
            print("CONNECT ERROR:", e)
            traceback.print_exc()
   
    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):

            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )

        if hasattr(self, "ride_group"):

            await self.channel_layer.group_discard(
                self.ride_group,
                self.channel_name
            )

        print(
            "DISCONNECT CODE:",
            close_code
        )
   
    async def receive(self, text_data):
        """Handle incoming WebSocket messages cleanly with total error catch."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
           
            if message_type == 'location_update':
                await self.handle_location_update(data)
            elif message_type == 'join_ride':
                await self.handle_join_ride(data)
            elif message_type == 'leave_ride':
                await self.handle_leave_ride(data)
            elif message_type == 'driver_accept_ride':
                await self.handle_driver_accept_ride(data)
            elif message_type == 'driver_update_status':
                await self.handle_driver_update_status(data)
            elif message_type == "rider_location_update":
                await self.handle_rider_location(data)
                
            elif message_type == "chat_message":
                # Let your specialized handler handle saving and room broadcast
                await self.handle_chat_message(data)
                
            elif message_type == "location_broadcast":
                await self.handle_location_broadcast(data)
            elif message_type == "verify_pickup_pin":
                await self.handle_verify_pickup_pin(data)
                
            # Changed to 'elif' to avoid double-checking if another type hit
            elif message_type == "driver_location_update":
                ride_id = data.get('ride_id')
                ride = await self.get_ride_by_id(ride_id)

                eta_data = None

                if ride:
                    eta_data = await self.calculate_eta(
                        ride,
                        float(data.get("latitude")),
                        float(data.get("longitude"))
                    )
                    await self.channel_layer.group_send(
                        f"ride_{ride_id}",
                        {
                            "type": "driver_location",
                            "driver_id": str(self.user.id),
                            "latitude": data.get("latitude"),
                            "longitude": data.get("longitude"),
                            "heading": data.get("heading", 0),
                            "speed": data.get("speed", 0),
                            "eta_minutes":eta_data["eta_minutes"] if eta_data else None,    

                            "timestamp": timezone.now().isoformat()
                        }
                    )
                    await self.save_driver_location(
                        ride_id,
                        data.get("latitude"),
                        data.get("longitude"),
                        data.get("heading", 0)
                    )
                    await self.channel_layer.group_send(
                        f"tracking_{ride_id}",
                        {
                            "type": "driver_location_message",
                             "latitude": data.get("latitude"),
                             "longitude": data.get("longitude"),
                             "heading": data.get("heading", 0),
                        }
                    )
            
            elif message_type == "new_ride_request":
                # If this comes from the backend to the frontend, 
                # ensure this is handled by a method name matching the type
                await self.new_ride_request(data) 
            elif data["type"] == "join_public_tracking":

                await self.join_public_tracking(
                    data["ride_id"]
                )

            else:
                await self.send_error(f"No handler for message type {message_type}")
                
        # except Exception as e:
        #     print(f"Error in receive: {e}")
        #     await self.send_error('An internal server error occurred.')
     
        except json.JSONDecodeError as je:
            await self.send_error('Invalid JSON payload string.')
            print(f"!!! JSON DECODE ERROR IN CONSUMER: {str(je)}")
            await self.close(code=1011)
            
        # except Exception as e:
        #     # Catching generic exceptions ensures your application remains secure and measurable
        #     print(f"!!! CRASH IN CONSUMER RECEIVE LOGIC: {str(e)}")
        #     import traceback
        #     traceback.print_exc() 
        #     await self.send_error('An internal server error occurred processing your request.')
        #     await self.close(code=1011)

    async def handle_rider_location(self,data):

        ride_id = data.get("ride_id")

        await self.channel_layer.group_send(
            f"ride_{ride_id}",
            {
                "type":"rider_location",
                "latitude":data["latitude"],
                "longitude":data["longitude"],
                "timestamp":timezone.now().isoformat()
            }
        )
    
    async def driver_location_message(self,event):
        await self.send(
            text_data=json.dumps({
                "type":"driver_location",

                "latitude":
                    event["latitude"],

                "longitude":
                    event["longitude"],

                "heading":
                    event.get(
                        "heading",
                        0
                    )
            })
        )
    
    async def join_public_tracking(self,ride_id):
        await self.channel_layer.group_add(
            f"tracking_{ride_id}",
            self.channel_name
        )

    

    # ------------------------------------------------------------------------
    async def handle_driver_accept_ride(self, data):
        ride_id = data.get('ride_id')
        if not ride_id:
            await self.send_error('Missing ride_id')
            return
            
        success, result = await self.execute_accept_ride(ride_id)
        if not success:
            await self.send_error(result.get('error', 'Unable to accept ride.'))
            return
            
        # Automatically subscribe driver instance to group room updates
        self.ride_group = f'ride_{ride_id}'
        await self.channel_layer.group_add(self.ride_group, self.channel_name)
        print(
                "JOINED RIDE GROUP:",
                self.ride_group
            )
        await self.send(text_data=json.dumps({'type': 'accept_success', 'ride_id': ride_id}))

    # Ensure this is your ONLY ride request method handler in consumers.py
    # In consumers.py
    async def new_ride_request(self, event):
        print("NEW_RIDE_REQUEST EVENT RECEIVED:", event)

        print("===================================")
        print("NEW RIDE REQUEST RECEIVED")
        print(event)
        print("===================================")

        payload_data = event.get("data", event)
        ride_id = payload_data.get("ride_id") or payload_data.get("id")

        # If the payload from Celery is missing the address, hydrate it from the database
        if "pickup_address" not in payload_data and ride_id:
            from .models import Ride
            try:
                ride = await database_sync_to_async(Ride.objects.get)(id=ride_id)
                payload_data.update({
                    "pickup": {"lat": ride.pickup_location.y, "lng": ride.pickup_location.x},
                    "dropoff": {"lat": ride.dropoff_location.y, "lng": ride.dropoff_location.x},
                    "fare": str(ride.estimated_fare),
                    "pickup_address": ride.pickup_address,
                    "dropoff_address": ride.dropoff_address,
                    "distance_meters": ride.estimated_distance_meters,
                })
            except Exception as e:
                print(f"Error fetching ride: {e}")

        await self.send(text_data=json.dumps({
            "type": "new_ride_request",
            "data": {
                "ride_id": ride_id,
                "pickup": payload_data.get("pickup") or {
                    "lat": payload_data.get("pickup_lat"), 
                    "lng": payload_data.get("pickup_lng")
                },
                "dropoff": payload_data.get("dropoff") or {
                    "lat": payload_data.get("dropoff_lat"), 
                    "lng": payload_data.get("dropoff_lng")
                },
                "fare": str(payload_data.get("fare") or payload_data.get("estimated_fare", "0.00")),
                "pickup_address": payload_data.get("pickup_address", "Unknown Pickup"),
                "dropoff_address": payload_data.get("dropoff_address", "Unknown Dropoff"),
                "distance_meters": payload_data.get("distance_meters", 0)
            }
        }))

    async def ride_status(self, event):
        """Send ride status updates down to the WebSocket safely."""
        print("RIDE_STATUS EVENT RECEIVED:", event)
        payload_data = event.get("data", event)
        verification_code = payload_data.get('verification_code') or payload_data.get('data', {}).get('verification_code')
        await self.send(text_data=json.dumps({
            'type': 'ride_status',
            'ride_id': payload_data.get('ride_id') or payload_data.get('id'),
            'status': payload_data.get('status', 'unknown'),
            'verification_code': verification_code,
            'timestamp': payload_data.get('timestamp', timezone.now().isoformat()),
            'data': payload_data
        }))
    
    async def send_error(self, message):
        """Helper to send error messages back to the client."""
        await self.send(text_data=json.dumps({
            "type": "error",
            "message": message
        }))

    async def handle_driver_update_status(self, data):
        """Handles driver state toggles (Online / Offline / Busy)"""
        ride_id = data.get('ride_id')
        new_status = data.get('status')
        otp = data.get('otp')
        
        # Global status switch (Online / Offline) when not tied to a specific ride
        if not ride_id and new_status:
            is_online = True if new_status in ["available", "online"] else False
            await self.set_user_online(is_online)
            print(f"Driver {self.user.id} set global online status to: {is_online}")
            return

        if not ride_id or not new_status:
            await self.send_error('Missing parameters: ride_id, status')
            return
            
        success, result = await self.execute_status_update(ride_id, new_status, otp)
        if not success:
            await self.send_error(result.get('error', 'Status update rejected.'))

    async def handle_chat_message(self, data):
        ride_id = data.get("ride_id")
        message = data.get("message")
        sender_role = data.get("role")
        if ride_id and message:
            await self.save_chat_message(ride_id, message)
            await self.channel_layer.group_send(
                f"ride_{ride_id}",
                {
                    "type": "chat_broadcast",
                    "message": message,
                    "role": sender_role,
                    "sender_id": str(self.user.id),
                    "timestamp": timezone.now().isoformat()
                }
            )
    
    async def chat_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_received",
            "message": event["message"],
            "role": event["role"],
            "sender_id": event["sender_id"],
            "timestamp": event["timestamp"]
        }))
    
    async def handle_location_broadcast(self, data):
        ride_id = data.get("ride_id")
        if ride_id and self.ride_group:
            await self.channel_layer.group_send(
                self.ride_group,
                {
                    "type": "location_relay",
                    "role": data.get("role"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude")
                }
            )

    async def location_relay(self, event):
        await self.send(text_data=json.dumps({
            "type": "live_location_update",
            "role": event["role"],
            "latitude": event["latitude"],
            "longitude": event["longitude"]
        }))
    async def handle_verify_pickup_pin(self, data):
        ride_id = data.get("ride_id")
        pin = data.get("pin")
        # In a production environment, cross-verify against ride.pickup_pin database column
        if pin == "1234": 
            await self.channel_layer.group_send(
                f"ride_{ride_id}",
                {
                    "type": "status_relay",
                    "status": "in_progress",
                    "message": "Start code verified! Trip is now in progress."
                }
            )
    async def ride_started(self,event):

        await self.send(
        text_data=json.dumps({
            "type":"ride_started",
            "ride_id":event["ride_id"]
        })
        )
    async def status_relay(self, event):
        await self.send(text_data=json.dumps({
            "type": "status_updated",
            "status": event["status"],
            "message": event["message"]
        }))
    async def send_ride_request(self, event):
        print("DRIVER EVENT RECEIVED:", event)

        await self.send(text_data=json.dumps({
            "type": "new_ride_request",
            "data": event["data"]
        }))
    
    async def pool_join_request(self, event):

        print("POOL REQUEST SENT TO DRIVER")
        print("################################")
        print("POOL REQUEST HANDLER HIT")
        print(event)
        print("################################")

        await self.send(
            text_data=json.dumps({
                "type": "pool_join_request",
                "participant_id": event["participant_id"],
                "ride_id": event["ride_id"],
                "rider_name": event["rider_name"],
                "rider_id": event["rider_id"],
                "pickup_address": event["pickup_address"],
                "dropoff_address": event["dropoff_address"],
                "seats": event["seats"],
            })
        )

    async def handle_location_update(self, data):
        """
        Handle driver location updates.
       
        Expected data:
        {
            "type": "location_update",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "heading": 180,
            "speed": 15.5,
            "accuracy": 10
        }
        """
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        heading = data.get('heading')
        speed = data.get('speed')
        accuracy = data.get('accuracy')
       
        if not latitude or not longitude:
            await self.send_error('Missing location data')
            return
       
        # Update driver location
        await self.update_driver_location(
            latitude = data.get('latitude'),
            longitude = data.get('longitude'),
            heading = data.get('heading'),
            speed = data.get('speed')
            )
       
        # If driver is on an active ride, store location and broadcast
        active_ride = await self.get_active_ride()
        if active_ride:
            await self.store_ride_location(
                ride=active_ride,
                latitude=latitude,
                longitude=longitude,
                accuracy=accuracy,
                speed=speed,
                heading=heading
            )
           
            # Broadcast to ride group
            await self.channel_layer.group_send(
                f'ride_{active_ride.id}',
                {
                    'type': 'driver_location',
                    'driver_id': str(self.user.id),
                    'latitude': latitude,
                    'longitude': longitude,
                    'heading': heading,
                    'speed': speed,
                    'timestamp': timezone.now().isoformat(),
                }
            )
    
    def get_eta_between_points(
        self,
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng
        ):
        return GoogleMapsService().get_eta(
            origin_lat,
            origin_lng,
            destination_lat,
            destination_lng
        )

    @database_sync_to_async
    def execute_accept_ride(self, ride_id):
        from .services.ride import RideService
        try:
            ride = Ride.objects.get(id=ride_id)
            return RideService().assign_driver(ride, self.user)
        except Exception as e:
            return False, {'error': str(e)}

    @database_sync_to_async
    def execute_status_update(self, ride_id, new_status, otp=None):
        from .services.ride import RideService
        try:
            ride = Ride.objects.get(id=ride_id)
            return RideService().update_ride_status(ride, new_status, self.user, {'otp': otp})
        except Exception as e:
            return False, {'error': str(e)}
    @database_sync_to_async
    def save_chat_message(self, ride_id, message):
        from .models import Ride, ChatMessage
        try:
            ride = Ride.objects.get(id=ride_id)
            ChatMessage.objects.create(ride=ride, sender=self.user, message=message)
        except Ride.DoesNotExist:
            pass
    
    @database_sync_to_async
    def get_ride_by_id(self, ride_id):
        try:
            return Ride.objects.get(id=ride_id)
        except Ride.DoesNotExist:
            return None

    @database_sync_to_async
    def calculate_eta(self, ride, driver_lat, driver_lng):

        distance_meters = geodesic(
            (driver_lat, driver_lng),
            (ride.pickup_location.y, ride.pickup_location.x)
        ).meters

        # Average city speed ≈ 30 km/h
        average_speed_mps = 8.33

        eta_seconds = int(distance_meters / average_speed_mps)

        eta_minutes = max(1, round(eta_seconds / 60))

        return {
            "distance_meters": round(distance_meters),
            "eta_seconds": eta_seconds,
            "eta_minutes": eta_minutes,
        }

    @database_sync_to_async
    def save_driver_location(self,ride_id,latitude,longitude,heading):

        ride = Ride.objects.get(id=ride_id)

        RideLocation.objects.create(
            ride=ride,
            location=Point(
                float(longitude),
                float(latitude),
                srid=4326
            ),
            heading=heading,
            recorded_at=timezone.now()
        )

    # -----------------------------------------------------------------------------------------
    
   
    # async def handle_join_ride(self, data):
    #     """Join a ride's location channel."""
    #     ride_id = data.get('ride_id')
    #     if not ride_id:
    #         await self.send_error('Missing ride_id')
    #         return
       
    #     # Verify user is part of this ride
    #     is_participant = await self.verify_ride_participant(ride_id)
    #     if not is_participant:
    #         await self.send_error('Not authorized for this ride')
    #         return
       
    #     self.ride_group = f'ride_{ride_id}'
    #     await self.channel_layer.group_add(
    #         self.ride_group,
    #         self.channel_name
    #     )
       
    #     await self.send(text_data=json.dumps({
    #         'type': 'joined_ride',
    #         'ride_id': ride_id,
    #     }))
#    --------------------------------------------
    async def handle_join_ride(self, data):
        """Logic to add the user to a ride-specific channel."""
        ride_id = data.get("ride_id")
        print("JOIN_RIDE RECEIVED")
        print(data)
        if not ride_id:
            await self.send_error("Missing ride_id")
            return

        # Verify the user is actually part of this ride
        is_participant = await self.verify_ride_participant(ride_id)
        print("IS PARTICIPANT:", is_participant)
        if is_participant:
            # Join a room specific to this ride for real-time tracking
            self.ride_group = f"ride_{ride_id}"
            await self.channel_layer.group_add(self.ride_group, self.channel_name)
            print(
            "JOINED RIDE GROUP:",
            self.ride_group
            )
            await self.send(text_data=json.dumps({
                "type": "joined_ride",
                "ride_id": ride_id,
                "message": "Successfully synchronized with active ride stream."
            }))
        else:
            await self.send_error("You are not authorized for this ride.")

    async def handle_leave_ride(self, data):
        """Leave a ride's location channel."""
        if hasattr(self, 'ride_group'):
            await self.channel_layer.group_discard(
                self.ride_group,
                self.channel_name
            )
            del self.ride_group
   
    # Channel layer message handlers
   
    async def driver_location(self, event):
        """Send driver location to WebSocket."""
        await self.send(text_data=json.dumps({
    "type": "driver_location",
    "driver_id": event.get("driver_id"),
    "latitude": event.get("latitude"),
    "longitude": event.get("longitude"),
    "heading": event.get("heading"),
    "speed": event.get("speed"),
    "eta_minutes": event.get("eta_minutes"),
    "distance_meters": event.get("distance_meters"),
    "timestamp": event.get("timestamp"),
        }))
    async def rider_location(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "rider_location",
                "latitude": event["latitude"],
                "longitude": event["longitude"],
                "timestamp": event["timestamp"],
            })
        )
    
    async def joined_ride(self, event):
        # This ensures that when the server sends a 'joined_ride' event,
        # the consumer doesn't crash or log a warning.
        await self.send(text_data=json.dumps(event))
   
    async def send_error(self, message):
        """Send error message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
        }))
   
    async def ride_request(self, event):
        """Handler for ride request notification."""
        await self.send(text_data=json.dumps({
            'type': 'ride_request',
            'ride_id': event['ride_id'],
            'pickup_address': event['pickup_address'],
            'dropoff_address': event['dropoff_address'],
            'estimated_fare': event['estimated_fare'],
            'distance_meters': event['distance_meters'],
        }))
    # Database operations
   
    @database_sync_to_async
    def set_user_online(self, online: bool):
        User.objects.filter(id=self.user.id).update(is_online=online)
   
    @database_sync_to_async
    def update_driver_location(self, latitude, longitude, heading=None, speed=None):
        service = DriverLocationService()
        service.update_driver_location(
            driver=self.user,
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed
        )
   
    @database_sync_to_async
    def get_active_ride(self):
        return Ride.objects.filter(
            driver=self.user,
            status__in=['driver_assigned', 'driver_arriving', 'arrived', 'in_progress']
        ).first()
   
    @database_sync_to_async
    def verify_ride_participant(self, ride_id):
        # Check if user is the main rider, the driver, OR a shared ride participant
        is_main_rider_or_driver = Ride.objects.filter(
            id=ride_id
        ).filter(
            models.Q(rider=self.user) | models.Q(driver=self.user)
        ).exists()
        
        if is_main_rider_or_driver:
            return True
            
        # Check if user is in RideParticipant table
        from .models import RideParticipant
        return RideParticipant.objects.filter(ride_id=ride_id, user=self.user).exists()
    
    @database_sync_to_async
    def store_ride_location(self, ride, latitude, longitude, accuracy, speed, heading):
        RideLocation.objects.create(
            ride=ride,
            location=Point(longitude, latitude, srid=4326),
            accuracy_meters=accuracy,
            speed_mps=speed,
            heading=heading,
            recorded_at=timezone.now()
        )



class SOSTrackingConsumer(AsyncWebsocketConsumer):
    """
    Maintains a persistent websocket pipeline for streaming high-frequency GPS pings during an SOS alert.
    """
    async def connect(self):
        self.sos_id = self.scope['url_route']['kwargs']['sos_id']
        self.safety_room_group = f"sos_{self.sos_id}"

        # Join the safety broadcast channel room
        await self.channel_layer.group_add(
            self.safety_room_group,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.safety_room_group,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Receives continuous incoming GPS coordinates from the phone's native hardware.
        """
        data = json.loads(text_data)
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        # Broadcast the location data to listening third-party response teams or family links
        await self.channel_layer.group_send(
            self.safety_room_group,
            {
                'type': 'safety_location_update',
                'latitude': latitude,
                'longitude': longitude,
            }
        )

    async def safety_location_update(self, event):
        # Sends coordinates to listening client interfaces
        await self.send(text_data=json.dumps({
            'latitude': event['latitude'],
            'longitude': event['longitude']
        }))