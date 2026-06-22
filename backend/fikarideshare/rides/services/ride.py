from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.contrib.gis.geos import Point
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import random
from users.models import User
from vehicles.models import Vehicle
from ..models import Ride, RideParticipant
from .location import GoogleMapsService, DriverLocationService
from .pricing import PricingService
from asgiref.sync import async_to_sync



class RideService:
    """
    Core service for ride management.   
   
    Handles:
    - Ride creation and fare estimation
    - Driver matching and assignment
    - Ride status transitions
    - Shared ride management
    """
   
    def __init__(self):
        self.maps = GoogleMapsService()
        self.location_service = DriverLocationService()
        self.pricing = PricingService()
        self.channel_layer = get_channel_layer()
   
    def find_compatible_shared_pool(self, pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float, required_seats: int):
        """
        Geospatial Convergence Matching Algorithm (Uber/Rapido Style)
        Finds an active shared trip moving toward the same general destination zone.
        """
        from django.contrib.gis.geos import Point
        from django.contrib.gis.measure import D
        from django.db.models import Q
        
        passenger_pickup = Point(pickup_lng, pickup_lat, srid=4326)
        passenger_dropoff = Point(dropoff_lng, dropoff_lat, srid=4326)

        # 1. Query for rides that are shared, have seats, and are open for matching
        candidate_pools = Ride.objects.filter(
            ride_type='shared',
            pool_open=True,
            available_seats__gte=required_seats,
            status__in=[Ride.Status.SEARCHING, Ride.Status.DRIVER_ASSIGNED, Ride.Status.IN_PROGRESS]
        )

        # 2. Filter pools where the new passenger's pickup is within 3.5km of the active route's pickup point
        # AND the passenger's dropoff is within 6.0km of the active route's dropoff point (Directional Alignment)
        matched_pool = candidate_pools.filter(
            pickup_location__distance_lte=(passenger_pickup, D(km=3.5)),
            dropoff_location__distance_lte=(passenger_dropoff, D(km=6.0))
        ).first()

        return matched_pool

    def estimate_fare(
        self,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_lat: float,
        dropoff_lng: float,
        vehicle_type: str = 'economy'
    ) -> Dict:
        """
        Calculate fare estimate for a ride.
       
        Returns:
            Dict with fare breakdown and route info
        """
        # Get route information
        directions = self.maps.get_directions(
            origin=(pickup_lat, pickup_lng),
            destination=(dropoff_lat, dropoff_lng)
        )
       
        if not directions:
            return {'error': 'Unable to calculate route'}
       
        # Calculate fare
        fare = self.pricing.calculate_fare(
            distance_meters=directions['distance_meters'],
            duration_seconds=directions['duration_in_traffic_seconds'],
            vehicle_type=vehicle_type
        )
       
        # Get pickup/dropoff addresses
        pickup_address = self.maps.reverse_geocode(pickup_lat, pickup_lng)
        dropoff_address = self.maps.reverse_geocode(dropoff_lat, dropoff_lng)
       
        return {
            'estimated_fare': fare['total'],
            'fare_breakdown': fare,
            'distance_meters': directions['distance_meters'],
            'duration_seconds': directions['duration_in_traffic_seconds'],
            'polyline': directions['polyline'],
            'pickup_address': pickup_address,
            'dropoff_address': dropoff_address,
            'surge_multiplier': fare.get('surge_multiplier', 1.0),
        }
   
    def broadcast_ride_request(self, driver_id, ride_data):
        """
        Pushes a new ride request to a specific driver via WebSocket.
        """
        # Wrap the async group_send in async_to_sync so it executes in this sync method
        print("================================")
        print("SENDING TO DRIVER:", driver_id)
        print("GROUP:", f"user_{driver_id}")
        print("RIDE:", ride_data.id)
        print("================================")
        async_to_sync(self.channel_layer.group_send)(
            f"user_{driver_id}",
            {
                "type": "new_ride_request",
                "data": {
                    "ride_id": str(ride_data.id),
                    "pickup": {
                        "lat": ride_data.pickup_location.y,
                        "lng": ride_data.pickup_location.x
                    },
                    "dropoff": {
                        "lat": ride_data.dropoff_location.y,
                        "lng": ride_data.dropoff_location.x
                    },
                    "fare": float(ride_data.estimated_fare),
                }
            }
        )

    @transaction.atomic
    def create_ride(
        self,
        rider: User,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_lat: float,
        dropoff_lng: float,
        vehicle_type: str = 'economy',
        passenger_count: int = 1,
        notes: str = '',
        ride_type='standard',
        scheduled_time: timezone.datetime = None
    ) -> Tuple[bool, Dict]:
        """
        Create a new ride request.
       
        Returns:
            Tuple of (success, ride_data or error)
        """
        # Check if rider has an active ride
        active_ride = Ride.objects.filter(
            rider=rider,
            status__in=[
                Ride.Status.REQUESTED,
                Ride.Status.SEARCHING,
                Ride.Status.DRIVER_ASSIGNED,
                Ride.Status.DRIVER_ARRIVING,
                Ride.Status.ARRIVED,
                Ride.Status.IN_PROGRESS,
            ]
        ).first()
       
        if active_ride:
            return False, {'error': 'You already have an active ride'}
       
        # Get fare estimate
        estimate = self.estimate_fare(
            pickup_lat, pickup_lng,
            dropoff_lat, dropoff_lng,
            vehicle_type
        )
       
        if 'error' in estimate:
            return False, estimate
    #    me
        otp_code = f"{random.randint(1000, 9999)}"
        # Create ride
        ride = Ride.objects.create(
            rider=rider,
            ride_type=(
                Ride.RideType.SCHEDULED if scheduled_time
                else ride_type
            ),
            status=Ride.Status.REQUESTED,
            pickup_location=Point(pickup_lng, pickup_lat, srid=4326),
            pickup_address=estimate['pickup_address'],
            dropoff_location=Point(dropoff_lng, dropoff_lat, srid=4326),
            dropoff_address=estimate['dropoff_address'],
            vehicle_type_requested=vehicle_type,
            estimated_fare=estimate['estimated_fare'],
            estimated_distance_meters=estimate['distance_meters'],
            estimated_duration_seconds=estimate['duration_seconds'],
            surge_multiplier=estimate['surge_multiplier'],
            passenger_count=passenger_count,
            notes=notes,
            scheduled_pickup_time=scheduled_time,

            verification_code=otp_code,
        )
       
        # If not scheduled, start searching for driver
        if not scheduled_time:
            ride.status = Ride.Status.SEARCHING
            ride.save()
           
            # Trigger driver search asynchronously
            from ..tasks import find_and_assign_driver
            # find_and_assign_driver.delay(str(ride.id))
            from django.db import transaction
            transaction.on_commit(lambda: find_and_assign_driver.delay(str(ride.id)))
       
        return True, {
            'ride_id': str(ride.id),
            'status': ride.status,
            'estimated_fare': float(ride.estimated_fare),
            'pickup_address': ride.pickup_address,
            'dropoff_address': ride.dropoff_address,
            'estimated_duration': estimate['duration_seconds'],
            'polyline': estimate['polyline'],
            
            'verification_code': ride.verification_code,
        }
   
    def find_available_driver(
        self,
        ride: Ride,
        exclude_drivers: List[str] = None
    ) -> Optional[User]:
        """
        Find the best available driver for a ride.
       
        Selection criteria:
        1. Distance to pickup (primary)
        2. Driver rating
        3. Vehicle type match
        """
        exclude_drivers = exclude_drivers or []
       
        print("================================")
        print("LOOKING FOR DRIVERS")
        print("PICKUP LAT:", ride.pickup_location.y)
        print("PICKUP LNG:", ride.pickup_location.x)


        nearby_drivers = self.location_service.find_nearby_drivers(
            latitude=ride.pickup_location.y,
            longitude=ride.pickup_location.x,
            radius_km=15,
            vehicle_type=ride.vehicle_type_requested,
            limit=10
        )
        
        for driver_info in nearby_drivers:
            driver_id = driver_info['driver_id']
           
            if driver_id in exclude_drivers:
                continue
            print("================================")
            print("DRIVER ID:", driver_id)
            print("USER EXISTS:",
                User.objects.filter(id=driver_id).exists())

            user = User.objects.filter(id=driver_id).first()
            print("USER OBJECT:", user)
            print("================================")
            # Check driver doesn't have active ride
            has_active_ride = Ride.objects.filter(
                driver_id=driver_id,
                status__in=[
                    Ride.Status.DRIVER_ASSIGNED,
                    Ride.Status.DRIVER_ARRIVING,
                    Ride.Status.ARRIVED,
                    Ride.Status.IN_PROGRESS,
                ]
            ).exists()
           
            if has_active_ride:
                continue
           
            try:
                return User.objects.get(id=driver_id)
            except User.DoesNotExist:
                continue
       
        return None
   
    @transaction.atomic
    def assign_driver(
        self,
        ride: Ride,
        driver: User
    ) -> Tuple[bool, Dict]:
        """
        Assign a driver to a ride.
        """
        # Get driver's primary vehicle
        vehicle = driver.vehicles.filter(
            is_primary=True,
            is_active=True,
            dekra_status='approved'
        ).first()
       
        if not vehicle:
            return False, {'error': 'Driver has no available vehicle'}
       
        # Calculate ETA
        eta_info = self.location_service.get_driver_eta(
            driver=driver,
            destination_lat=ride.pickup_location.y,
            destination_lng=ride.pickup_location.x
        )
       
        # Update ride
        ride.driver = driver
        ride.vehicle = vehicle
        ride.status = Ride.Status.DRIVER_ASSIGNED
        ride.driver_assigned_at = timezone.now()
        ride.save()
       
        # Notify rider via WebSocket
        eta_seconds = eta_info['eta_seconds'] if eta_info else None

        self._broadcast_ride_update(ride, {
            'driver': {
                'id': str(driver.id),
                'name': driver.full_name,
                'rating': float(driver.average_rating),
                'phone': driver.phone_number,
                'photo': driver.profile_photo.url if driver.profile_photo else None,
            },
            'vehicle': {
                'make': vehicle.make,
                'model': vehicle.model,
                'color': vehicle.color,
                'license_plate': vehicle.license_plate,
            },
            'eta_seconds': eta_seconds,
            'eta_minutes': round(eta_seconds / 60) if eta_seconds else None,
        })
       
        return True, {
            'ride_id': str(ride.id),
            'status': ride.status,
            'driver_id': str(driver.id),
        }
   
    def update_ride_status(
        self,
        ride: Ride,
        new_status: str,
        actor: User,
        data: Dict = None
    ) -> Tuple[bool, Dict]:
        data = data or {}
       
        # 1. VALIDATE FIRST
        valid_transitions = {
            Ride.Status.REQUESTED: [Ride.Status.SEARCHING, Ride.Status.CANCELLED],
            Ride.Status.SEARCHING: [Ride.Status.DRIVER_ASSIGNED, Ride.Status.CANCELLED],
            Ride.Status.DRIVER_ASSIGNED: [Ride.Status.DRIVER_ARRIVING,Ride.Status.IN_PROGRESS, Ride.Status.CANCELLED],
            Ride.Status.DRIVER_ARRIVING: [Ride.Status.ARRIVED, Ride.Status.CANCELLED],
            Ride.Status.ARRIVED: [Ride.Status.IN_PROGRESS, Ride.Status.CANCELLED],
            Ride.Status.IN_PROGRESS: [Ride.Status.COMPLETED],
        }
        print("UPDATE_RIDE_STATUS CALLED")
        print("NEW STATUS:", new_status)
        if new_status not in valid_transitions.get(ride.status, []):
            return False, {
                'error': f'Invalid transition from {ride.status} to {new_status}'
            }
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
                f"tracking_{ride.id}",
                {
                    "type": "trip_status",
                    "status": ride.status
                }
            )
        # 2. HANDLE ACTIONS AND TIMESTAMPS
        if new_status == Ride.Status.IN_PROGRESS:
            provided_otp = data.get('otp') or data.get('verification_code')
            
            # Check if this OTP belongs to the main rider
            if str(provided_otp) == str(ride.verification_code):
                ride.started_at = timezone.now()
            else:
                # If it's a shared ride, check if it belongs to a participant
                if ride.ride_type == 'shared':
                    participant = ride.participants.filter(pickup_code=provided_otp).first()
                    if participant:
                        participant.status = RideParticipant.Status.PICKED_UP
                        participant.picked_up_at = timezone.now()
                        participant.save()
                        # Do not block the transition, but we are just validating a passenger
                    else:
                        return False, {'error': 'Invalid verification code.'}
                else:
                    return False, {'error': 'Invalid verification code.'}

            
        elif new_status == Ride.Status.DRIVER_ARRIVING:
            pass  
        elif new_status == Ride.Status.ARRIVED:
            ride.driver_arrived_at = timezone.now()
        elif new_status == Ride.Status.COMPLETED:
            ride.completed_at = timezone.now()
            self._calculate_final_fare(ride)
        elif new_status == Ride.Status.CANCELLED:
            ride.cancelled_at = timezone.now()
            ride.cancellation_reason = data.get(
                'reason',
                Ride.CancellationReason.RIDER_CANCELLED if actor == ride.rider
                else Ride.CancellationReason.DRIVER_CANCELLED
            )
            ride.cancellation_note = data.get('note', '')

        # 3. SET STATUS AND SAVE ONCE
        ride.status = new_status
        ride.save()

        # 4. BROADCAST TO CHANNELS
        broadcast_payload = {
            **data,
            'verification_code': ride.verification_code,
            'pickup_lat': ride.pickup_location.y,
            'pickup_lng': ride.pickup_location.x,
            'dropoff_lat': ride.dropoff_location.y,
            'dropoff_lng': ride.dropoff_location.x,
        }
        self._broadcast_ride_update(ride, broadcast_payload)
        
        return True, {
            'ride_id': str(ride.id),
            'status': ride.status,
        }
   
    def _calculate_final_fare(self, ride: Ride):
        """
        Calculate final fare based on actual ride data.
        """
        # Get actual distance from recorded locations
        from django.contrib.gis.db.models.functions import Length
       
        locations = ride.location_updates.order_by('recorded_at')
       
        if locations.count() >= 2:
            # Calculate actual distance from location points
            from django.contrib.gis.geos import LineString
           
            points = [loc.location for loc in locations]
            route = LineString(points)
           
            ride.actual_distance_meters = int(route.length)  # Approximate
       
        # Calculate actual duration
        if ride.started_at and ride.completed_at:
            ride.actual_duration_seconds = int(
                (ride.completed_at - ride.started_at).total_seconds()
            )
       
        # Calculate final fare
        fare = self.pricing.calculate_fare(
            distance_meters=ride.actual_distance_meters or ride.estimated_distance_meters,
            duration_seconds=ride.actual_duration_seconds or ride.estimated_duration_seconds,
            vehicle_type=ride.vehicle_type_requested,
            surge_multiplier=float(ride.surge_multiplier)
        )
       
        ride.final_fare = fare['total']
        ride.save()
   
    def _broadcast_ride_update(self, ride: Ride, extra_data: Dict = None):
        """
        Broadcast ride status update via WebSocket.
        """
        print("BROADCASTING STATUS:",ride.status)
        print("BROADCASTING STATUS:", ride.status)
        final_fare = float(ride.final_fare) if ride.final_fare is not None else 0.0
        data = {
            'ride_id': str(ride.id),
            'status': ride.status,
            'ride_type': ride.ride_type,
            'final_fare': final_fare,
            'verification_code': ride.verification_code,
            'timestamp': timezone.now().isoformat(),
            **(extra_data or {})
        }
       
        # Send to rider
        async_to_sync(self.channel_layer.group_send)(
            f'user_{ride.rider_id}',
            {
                'type': 'ride_status',
                'data': data
            }
        )
       
        # Send to driver if assigned
        if ride.driver_id:
            async_to_sync(self.channel_layer.group_send)(
                f'user_{ride.driver_id}',
                {
                    'type': 'ride_status',
                    'data': data
                }
            )
       
        if ride.ride_type == 'shared':
            # 1. Send to all joined co-passengers
            for participant in ride.participants.all():
                async_to_sync(self.channel_layer.group_send)(
                    f'user_{participant.user_id}',
                    {'type': 'ride_status', 'data': data}
                )
            async_to_sync(self.channel_layer.group_send)(
                f'user_{ride.rider_id}',
                {'type': 'ride_status', 'data': data}
            )
        
        # Send to ride group (for participants)
        async_to_sync(self.channel_layer.group_send)(
            f'ride_{ride.id}',
            {
                'type': 'ride_status',
                **data
            }
        )

