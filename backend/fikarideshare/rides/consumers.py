import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

from users.models import User
from .models import Ride, RideLocation
from .services.location import DriverLocationService


class LocationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time location tracking.
   
    Handles:
    - Driver location updates
    - Ride tracking
    - Real-time ETA updates
    """
   
    async def connect(self):
        self.user = self.scope.get('user')
       
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
       
        # Join user-specific channel
        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )
       
        await self.accept()
       
        # Mark user as online
        await self.set_user_online(True)
   
    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
       
        # Mark user as offline
        if hasattr(self, 'user') and self.user:
            await self.set_user_online(False)
       
        # Leave ride group if in one
        if hasattr(self, 'ride_group'):
            await self.channel_layer.group_discard(
                self.ride_group,
                self.channel_name
            )
   
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
           
            if message_type == 'location_update':
                await self.handle_location_update(data)
            elif message_type == 'join_ride':
                await self.handle_join_ride(data)
            elif message_type == 'leave_ride':
                await self.handle_leave_ride(data)
           
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
   
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
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed
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
   
    async def handle_join_ride(self, data):
        """Join a ride's location channel."""
        ride_id = data.get('ride_id')
        if not ride_id:
            await self.send_error('Missing ride_id')
            return
       
        # Verify user is part of this ride
        is_participant = await self.verify_ride_participant(ride_id)
        if not is_participant:
            await self.send_error('Not authorized for this ride')
            return
       
        self.ride_group = f'ride_{ride_id}'
        await self.channel_layer.group_add(
            self.ride_group,
            self.channel_name
        )
       
        await self.send(text_data=json.dumps({
            'type': 'joined_ride',
            'ride_id': ride_id,
        }))
   
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
            'type': 'driver_location',
            'driver_id': event['driver_id'],
            'latitude': event['latitude'],
            'longitude': event['longitude'],
            'heading': event.get('heading'),
            'speed': event.get('speed'),
            'timestamp': event['timestamp'],
        }))
   
    async def ride_status(self, event):
        """Send ride status update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'ride_status',
            'ride_id': event['ride_id'],
            'status': event['status'],
            'timestamp': event['timestamp'],
            'data': event.get('data', {}),
        }))
   
    async def send_error(self, message):
        """Send error message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
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
        return Ride.objects.filter(
            id=ride_id
        ).filter(
            models.Q(rider=self.user) | models.Q(driver=self.user)
        ).exists()
   
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
