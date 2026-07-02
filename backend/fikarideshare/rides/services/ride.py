from typing import Dict, List, Tuple, Optional
from decimal import Decimal
import math
from django.db import transaction
from django.db.models import Q
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


def _bearing_degrees(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compass bearing (0-360) from point 1 to point 2."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    d_lng = math.radians(lng2 - lng1)
    x = math.sin(d_lng) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(d_lng)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def _bearing_difference(bearing_a: float, bearing_b: float) -> float:
    """Smallest angle (0-180) between two compass bearings."""
    diff = abs(bearing_a - bearing_b) % 360
    return min(diff, 360 - diff)


# ---------------------------------------------------------------------------
# Shared per-stop distance/ETA helper.
#
# Before this, three separate places independently estimated distance/ETA:
#   - consumers.calculate_eta            (geodesic straight-line, flat 30km/h)
#   - consumers.calculate_per_rider_etas (same, duplicated)
#   - compute_optimized_route's sort key (geodesic, used only for ordering,
#     the actual meters value was discarded after sorting)
# None of them returned real road distance/duration, and the per-stop
# numbers were never attached to the route payload the frontend renders.
#
# This consolidates onto one Google-backed calculation so the driver's map
# shows real road ETA (per the decision to prioritize accuracy over request
# volume), with a short in-memory throttle so a fast stream of GPS pings
# doesn't turn into a Google Distance Matrix call per pickup per ping.
#
# Throttle is keyed on (ride_id, destination) and skipped if the driver
# hasn't moved more than ~30m and the last calculation is under
# ETA_RECALC_INTERVAL_SECONDS old - the cached value is reused instead.
# This is process-local (a plain dict), which is fine for a single Django/
# Channels worker; if you run multiple workers behind a load balancer,
# swap this for a Redis-backed cache (e.g. django.core.cache) so the
# throttle is shared across processes instead of duplicating calls once
# per worker.
# ---------------------------------------------------------------------------

ETA_RECALC_INTERVAL_SECONDS = 15
ETA_RECALC_MIN_MOVEMENT_METERS = 30

_eta_cache: Dict[str, Dict] = {}


def get_stop_distance_eta(
    maps_service: "GoogleMapsService",
    ride_id: str,
    stop_key: str,
    driver_lat: float,
    driver_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> Dict:
    """
    Real road distance/duration (via Google) from the driver's current
    location to a single stop (a pickup or dropoff point), with a short
    throttle so frequent location pings don't each trigger a fresh API call.

    Returns a dict shaped: {distance_meters, duration_seconds, eta_minutes}.
    Falls back to straight-line geodesic + flat speed only if the Google
    call itself fails (e.g. API error/timeout) - never silently returns
    nothing, since the frontend always needs a number to render.
    """
    from geopy.distance import geodesic

    cache_key = f"{ride_id}:{stop_key}"
    now = timezone.now()
    cached = _eta_cache.get(cache_key)

    if cached:
        moved = geodesic(
            (cached['driver_lat'], cached['driver_lng']),
            (driver_lat, driver_lng),
        ).meters
        age_seconds = (now - cached['computed_at']).total_seconds()
        if moved < ETA_RECALC_MIN_MOVEMENT_METERS and age_seconds < ETA_RECALC_INTERVAL_SECONDS:
            return cached['result']

    try:
        directions = maps_service.get_directions(
            origin=(driver_lat, driver_lng),
            destination=(dest_lat, dest_lng),
        )
        if not directions:
            raise ValueError("Google directions returned no result")
        distance_meters = directions['distance_meters']
        duration_seconds = directions.get('duration_in_traffic_seconds') or directions.get('duration_seconds')
    except Exception:
        # Google call failed - fall back to the old straight-line estimate
        # rather than leaving the driver's UI with no number at all.
        distance_meters = geodesic((driver_lat, driver_lng), (dest_lat, dest_lng)).meters
        average_speed_mps = 8.33  # ~30 km/h city fallback speed
        duration_seconds = distance_meters / average_speed_mps

    result = {
        'distance_meters': round(distance_meters),
        'duration_seconds': round(duration_seconds),
        'eta_minutes': max(1, round(duration_seconds / 60)),
    }

    _eta_cache[cache_key] = {
        'driver_lat': driver_lat,
        'driver_lng': driver_lng,
        'computed_at': now,
        'result': result,
    }

    return result


def clear_stop_eta_cache(ride_id: str):
    """Drop cached ETAs for a ride - call when it completes/cancels so the
    process-local cache doesn't grow unbounded across many rides over time."""
    stale_keys = [k for k in _eta_cache if k.startswith(f"{ride_id}:")]
    for k in stale_keys:
        _eta_cache.pop(k, None)


class RideService:
    """
    Core service for ride management.   
   
    Handles:
    - Ride creation and fare estimation
    - Driver matching and assignment
    - Ride status transitions
    - Shared ride management
    """
   
    ACTIVE_RIDE_STATUSES = [
        Ride.Status.REQUESTED,
        Ride.Status.SEARCHING,
        Ride.Status.DRIVER_ASSIGNED,
        Ride.Status.DRIVER_ARRIVING,
        Ride.Status.ARRIVED,
        Ride.Status.IN_PROGRESS,
    ]

    def __init__(self):
        self.maps = GoogleMapsService()
        self.location_service = DriverLocationService()
        self.pricing = PricingService()
        self.channel_layer = get_channel_layer()

    def check_no_active_ride(self, user) -> Optional[Dict]:
        """
        Returns an error dict if `user` already has an active ride - as
        rider, driver, or an accepted/pending pool participant elsewhere -
        or None if they're clear to request/join one.

        Locks the user's own row first (must be called inside an atomic
        block) so two near-simultaneous requests from the same user can't
        both pass this check before either has committed - previously this
        check raced freely, and the pool-join path never called it at all.
        """
        User.objects.select_for_update().get(id=user.id)

        has_active_ride = Ride.objects.filter(
            Q(rider=user) | Q(driver=user),
            status__in=self.ACTIVE_RIDE_STATUSES,
        ).exists()
        if has_active_ride:
            return {'error': 'You already have an active ride'}

        has_active_participation = RideParticipant.objects.filter(
            user=user,
            is_organizer=False,
            status__in=[
                RideParticipant.Status.PENDING,
                RideParticipant.Status.ACCEPTED,
                RideParticipant.Status.PICKED_UP,
            ],
            ride__status__in=self.ACTIVE_RIDE_STATUSES,
        ).exists()
        if has_active_participation:
            return {'error': 'You already have an active ride'}

        return None

    # Pools whose own pickup->dropoff bearing diverges from the candidate
    # rider's by more than this are rejected, even if pickup/dropoff points
    # both fall within MAX_POOL_PICKUP_DISTANCE_KM/MAX_POOL_DROPOFF_DISTANCE_KM -
    # otherwise a rider heading the opposite direction can match just
    # because their dropoff happens to land in the same radius.
    MAX_POOL_BEARING_DIFF_DEGREES = 45
    MAX_POOL_PICKUP_DISTANCE_KM = 3.5
    MAX_POOL_DROPOFF_DISTANCE_KM = 6.0
    # A pool already IN_PROGRESS for longer than this is excluded from
    # matching - there's no realistic time left to detour for a new
    # pickup on a trip that's nearly done.
    MAX_POOL_IN_PROGRESS_MINUTES = 10
    # Below this remaining distance, a bearing is noise, not signal (e.g.
    # pickup and dropoff a block apart) - skip the directional check
    # rather than reject a plausible match on a meaningless angle.
    MIN_BEARING_DISTANCE_METERS = 200

    def find_compatible_shared_pool(self, pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float, required_seats: int):
        """
        Geospatial Convergence Matching Algorithm (Uber/Rapido Style)
        Finds an active shared trip moving toward the same general destination zone.
        """
        from django.contrib.gis.geos import Point
        from django.contrib.gis.measure import D
        from django.contrib.gis.db.models.functions import Distance
        from geopy.distance import geodesic
        from datetime import timedelta

        passenger_pickup = Point(pickup_lng, pickup_lat, srid=4326)
        passenger_dropoff = Point(dropoff_lng, dropoff_lat, srid=4326)
        passenger_bearing = _bearing_degrees(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
        passenger_trip_distance_m = geodesic((pickup_lat, pickup_lng), (dropoff_lat, dropoff_lng)).meters

        in_progress_cutoff = timezone.now() - timedelta(minutes=self.MAX_POOL_IN_PROGRESS_MINUTES)

        # 1. Query for rides that are shared, have seats, and are open for
        # matching, within range, ordered nearest-pickup-first. IN_PROGRESS
        # pools are only eligible if they started recently.
        candidate_pools = Ride.objects.filter(
            ride_type='shared',
            pool_open=True,
            available_seats__gte=required_seats,
        ).filter(
            Q(status__in=[Ride.Status.SEARCHING, Ride.Status.DRIVER_ASSIGNED]) |
            Q(status=Ride.Status.IN_PROGRESS, started_at__gte=in_progress_cutoff)
        ).filter(
            pickup_location__distance_lte=(passenger_pickup, D(km=self.MAX_POOL_PICKUP_DISTANCE_KM)),
            dropoff_location__distance_lte=(passenger_dropoff, D(km=self.MAX_POOL_DROPOFF_DISTANCE_KM))
        ).annotate(
            distance_to_pickup=Distance('pickup_location', passenger_pickup)
        ).order_by('distance_to_pickup')[:10]

        # 2. Directional alignment - reject pools heading a meaningfully
        # different way even if both points fall within radius (a rider
        # going the opposite direction can still land in-radius on a short
        # trip). Pick the candidate whose own bearing is closest to the new
        # rider's. For a pool already underway, bearing is measured from
        # the driver's last known location (not the original pickup point)
        # to the pool's dropoff, since that's the direction actually being
        # driven right now.
        best_pool = None
        best_diff = None
        for pool in candidate_pools:
            if not pool.pickup_location or not pool.dropoff_location:
                continue

            origin_lat, origin_lng = pool.pickup_location.y, pool.pickup_location.x
            if pool.status == Ride.Status.IN_PROGRESS:
                latest_location = pool.location_updates.order_by('-recorded_at').first()
                if latest_location:
                    origin_lat, origin_lng = latest_location.location.y, latest_location.location.x

            pool_remaining_distance_m = geodesic(
                (origin_lat, origin_lng), (pool.dropoff_location.y, pool.dropoff_location.x)
            ).meters

            if (pool_remaining_distance_m < self.MIN_BEARING_DISTANCE_METERS
                    or passenger_trip_distance_m < self.MIN_BEARING_DISTANCE_METERS):
                diff = 0
            else:
                pool_bearing = _bearing_degrees(
                    origin_lat, origin_lng,
                    pool.dropoff_location.y, pool.dropoff_location.x,
                )
                diff = _bearing_difference(passenger_bearing, pool_bearing)

            if diff > self.MAX_POOL_BEARING_DIFF_DEGREES:
                continue
            if best_diff is None or diff < best_diff:
                best_pool, best_diff = pool, diff

        return best_pool

    def compute_optimized_route(self, ride: Ride, current_lat: float = None, current_lng: float = None) -> List[Dict]:
        """
        Nearest-neighbor sequencing of pending pickup/dropoff stops across
        the primary rider and accepted pool participants, honoring "can't
        drop someone off before they've been picked up".

        Distance is real geodesic distance via geopy - the previous
        version sorted by raw GEOS Point.distance(), which on SRID 4326
        points returns decimal *degrees*, not meters, and distorts further
        from the equator. PENDING participants are excluded (filtered out
        by the status__in below) - an unapproved match shouldn't show up
        in the driver's route before they've accepted it.

        Extracted from the smart_waypoints view action so it can also be
        called - and pushed over the ride's websocket group - whenever the
        participant set changes (match/accept/decline/pickup/dropoff),
        instead of only being available via an on-demand GET the driver's
        app happens to poll.

        Each stop in the returned sequence now also carries distance_meters/
        duration_seconds/eta_minutes from the driver's current position to
        that stop specifically - sorting already computed a distance per
        candidate stop, but previously discarded it once the closest one was
        picked. The frontend needs this per-stop figure to show "3.2 km /
        9 min to Rider 2 pickup" on the marker and passenger queue, for
        every stop, not just the immediate next one - so it's computed for
        every stop in the sequence below, not only the nearest. This is the
        one path that builds the route for both solo (single pickup/dropoff
        pair) and shared rides alike - a solo ride is just the case where
        pending_stops only ever has one pickup and one dropoff in it.
        """
        from geopy.distance import geodesic

        if current_lat is None or current_lng is None:
            current_lat = ride.pickup_location.y
            current_lng = ride.pickup_location.x
        current_loc = (current_lat, current_lng)

        pending_stops = []

        if ride.status == Ride.Status.DRIVER_ASSIGNED:
            pending_stops.append({'type': 'pickup', 'user_id': ride.rider.id, 'point': ride.pickup_location, 'name': 'Primary Rider'})
        if ride.status in [Ride.Status.DRIVER_ASSIGNED, Ride.Status.IN_PROGRESS]:
            pending_stops.append({'type': 'dropoff', 'user_id': ride.rider.id, 'point': ride.dropoff_location, 'name': 'Primary Rider', 'requires_pickup': ride.rider.id})

        for p in ride.participants.filter(
            is_organizer=False,
            status__in=[RideParticipant.Status.ACCEPTED, RideParticipant.Status.PICKED_UP],
        ):
            if p.status == RideParticipant.Status.ACCEPTED:
                pending_stops.append({'type': 'pickup', 'user_id': p.user.id, 'point': p.pickup_location, 'name': f'Rider {p.user.id}'})
            pending_stops.append({'type': 'dropoff', 'user_id': p.user.id, 'point': p.dropoff_location, 'name': f'Rider {p.user.id}', 'requires_pickup': p.user.id})

        route_sequence = []
        picked_up_users = set()

        if ride.status == Ride.Status.IN_PROGRESS:
            picked_up_users.add(ride.rider.id)
        for p in ride.participants.filter(is_organizer=False, status=RideParticipant.Status.PICKED_UP):
            picked_up_users.add(p.user.id)

        while pending_stops:
            valid_next_stops = [
                stop for stop in pending_stops
                if stop['type'] == 'pickup' or (stop['type'] == 'dropoff' and stop['requires_pickup'] in picked_up_users)
            ]
            if not valid_next_stops:
                break  # Safety break

            valid_next_stops.sort(
                key=lambda stop: geodesic(current_loc, (stop['point'].y, stop['point'].x)).meters
            )
            closest_stop = valid_next_stops[0]

            # Real road distance/ETA from the driver's current position to
            # this stop, via the throttled Google-backed helper above.
            # Note: this is "driver's current position -> this stop"
            # directly, not "driver -> previous stop -> this stop" - i.e.
            # every stop's number is relative to where the driver is RIGHT
            # NOW, which is what "how far am I from rider 2's pickup"
            # actually means, rather than a cumulative route-leg distance.
            stop_key = f"{closest_stop['type']}:{closest_stop['user_id']}"
            stop_eta = get_stop_distance_eta(
                self.maps,
                str(ride.id),
                stop_key,
                current_lat,
                current_lng,
                closest_stop['point'].y,
                closest_stop['point'].x,
            )

            route_sequence.append({
                "action": closest_stop['type'],
                "user_id": str(closest_stop['user_id']),
                "latitude": closest_stop['point'].y,
                "longitude": closest_stop['point'].x,
                "distance_meters": stop_eta['distance_meters'],
                "duration_seconds": stop_eta['duration_seconds'],
                "eta_minutes": stop_eta['eta_minutes'],
            })

            if closest_stop['type'] == 'pickup':
                picked_up_users.add(closest_stop['user_id'])

            current_loc = (closest_stop['point'].y, closest_stop['point'].x)
            pending_stops.remove(closest_stop)

        return route_sequence

    def push_optimized_route(self, ride: Ride, current_lat: float = None, current_lng: float = None):
        """
        Compute the route and push it to the ride's websocket group, so the
        driver's app gets a fresh sequence the moment the participant set
        changes instead of only on its next location-driven poll.
        """
        route = self.compute_optimized_route(ride, current_lat, current_lng)
        async_to_sync(self.channel_layer.group_send)(
            f"ride_{ride.id}",
            {
                "type": "route_updated",
                "optimized_route": route,
            }
        )
        return route

    def estimate_fare(
        self,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_lat: float,
        dropoff_lng: float,
        vehicle_type: str = 'economy',
        is_shared: bool = False
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
            vehicle_type=vehicle_type,
            is_shared=is_shared
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
        # Check if rider has an active ride (as rider, driver, or pool
        # participant elsewhere)
        active_ride_error = self.check_no_active_ride(rider)
        if active_ride_error:
            return False, active_ride_error


        # Get fare estimate
        estimate = self.estimate_fare(
            pickup_lat, pickup_lng,
            dropoff_lat, dropoff_lng,
            vehicle_type,
            is_shared=(ride_type == 'shared')
        )
       
        if 'error' in estimate:
            return False, estimate
    #    me
        otp_code = f"{random.randint(1000, 9999)}"
        # Create ride
        # ride_type ('standard'/'shared') and scheduling are independent -
        # whether a ride is poolable shouldn't change based on whether it's
        # for right now or booked ahead. This used to overwrite ride_type
        # to 'scheduled' whenever scheduled_time was set, silently dropping
        # the rider's actual standard/shared choice - which also meant a
        # scheduled shared ride could never be matched into a pool, since
        # find_compatible_shared_pool filters on ride_type='shared'.
        # "Scheduled-ness" is tracked by scheduled_pickup_time instead (see
        # process_scheduled_rides, which now filters on that rather than
        # ride_type).
        ride = Ride.objects.create(
            rider=rider,
            ride_type=ride_type,
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

        # Mirror the organizer (whoever requested the ride) as a
        # RideParticipant row too, is_organizer=True. This is additive -
        # ride.rider/ride.verification_code stay the source of truth for
        # permissions and the existing OTP flow, untouched. It just means
        # participant-list-based logic (currently: fare split) has one
        # consistent place to look instead of special-casing "the rider"
        # separately from "everyone else in the car". RideSerializer
        # excludes is_organizer=True from the public `participants` field,
        # so this is invisible to existing API consumers.
        RideParticipant.objects.create(
            ride=ride,
            user=rider,
            is_organizer=True,
            status=RideParticipant.Status.ACCEPTED,
            pickup_location=ride.pickup_location,
            pickup_address=ride.pickup_address,
            dropoff_location=ride.dropoff_location,
            dropoff_address=ride.dropoff_address,
            estimated_distance_meters=ride.estimated_distance_meters,
            pickup_code=otp_code,
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
            # has_active_ride = Ride.objects.filter(
            #     driver_id=driver_id,
            #     status__in=[
            #         Ride.Status.DRIVER_ASSIGNED,
            #         Ride.Status.DRIVER_ARRIVING,
            #         Ride.Status.ARRIVED,
            #         Ride.Status.IN_PROGRESS,
            #     ]
            # ).exists()
           
            # if has_active_ride:
            #     print(f"DRIVER {driver_id} SKIPPED — has active ride")
            #     continue

            active_rides = Ride.objects.filter(
                driver_id=driver_id,
                status__in=[
                    Ride.Status.DRIVER_ASSIGNED,
                    Ride.Status.DRIVER_ARRIVING,
                    Ride.Status.ARRIVED,
                    Ride.Status.IN_PROGRESS,
                ]
            )
           
            if active_rides.exists():
                # If they are on a standard (exclusive) ride, skip them entirely
                if active_rides.filter(ride_type='standard').exists():
                    print(f"DRIVER {driver_id} SKIPPED — has active standard ride")
                    continue
                
                # If they are on a shared ride, check if they are completely out of seats
                total_available_seats = sum(r.available_seats for r in active_rides if r.ride_type == 'shared')
                if total_available_seats <= 0:
                    print(f"DRIVER {driver_id} SKIPPED — shared ride is full")
                    continue
            # ---------------
           
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

        if ride.ride_type == 'shared' and vehicle.seats:
            # available_seats previously just sat at its model default (3)
            # regardless of which vehicle actually got assigned - an
            # Economy car and an XL both showed the same pool capacity.
            # Reconcile against the real vehicle now that we know which
            # one it is, minus the driver's own seat and whoever's already
            # in the car (organizer's party + already-matched others).
            seats_already_taken = ride.passenger_count or 1
            seats_already_taken += sum(
                p.seats_reserved for p in ride.participants.filter(
                    is_organizer=False,
                    status__in=[
                        RideParticipant.Status.PENDING,
                        RideParticipant.Status.ACCEPTED,
                        RideParticipant.Status.PICKED_UP,
                    ],
                )
            )
            ride.available_seats = max(0, vehicle.seats - 1 - seats_already_taken)
            ride.pool_open = ride.available_seats > 0

        ride.save()

        # Push waypoints (with their per-stop distance/ETA) immediately on
        # acceptance, rather than waiting for the driver's first location
        # ping to populate them. No current_lat/current_lng is passed here
        # because assign_driver doesn't have the driver's live GPS position
        # at this exact moment (the driver only starts sending location
        # pings once they've joined the ride's websocket group, which
        # happens slightly after this point in the flow) - this falls back
        # to ride.pickup_location internally (see compute_optimized_route),
        # which is a reasonable first approximation and gets corrected by
        # the genuinely live figure within seconds, on the next ping.
        self.push_optimized_route(ride)
       
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

        from notifications.services import create_notification
        create_notification(
            user=ride.rider,
            notification_type='ride_accepted',
            title='Driver found',
            body=f'{driver.full_name} is on the way in a {vehicle.color} {vehicle.make} {vehicle.model}.',
            data={'ride_id': str(ride.id)},
        )

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
            # Exception: in a shared ride, the trip is already IN_PROGRESS
            # once the first passenger is picked up, but each subsequent
            # passenger still has to submit their own OTP. That call also
            # targets new_status=IN_PROGRESS while ride.status is already
            # IN_PROGRESS - which the transition table above would
            # otherwise reject as a no-op transition.
            is_repeat_pickup_verification = (
                new_status == Ride.Status.IN_PROGRESS
                and ride.status == Ride.Status.IN_PROGRESS
                and (data.get('otp') or data.get('verification_code'))
            )
            if not is_repeat_pickup_verification:
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
        verified_participant = None
        if new_status == Ride.Status.IN_PROGRESS:
            provided_otp = data.get('otp') or data.get('verification_code')

            # Check if this OTP belongs to the main rider (their mirrored
            # organizer RideParticipant row, kept in sync with
            # ride.verification_code since ride creation).
            if str(provided_otp) == str(ride.verification_code):
                if not ride.started_at:
                    ride.started_at = timezone.now()
                verified_participant = ride.participants.filter(is_organizer=True).first()
            else:
                # If it's a shared ride, check if it belongs to a participant.
                # Status is restricted to ACCEPTED/PICKED_UP - ACCEPTED is the
                # real gate (a PENDING participant already has an
                # auto-generated pickup_code, so without this filter their
                # own code would mark them picked up before the driver ever
                # approved them, bypassing Accept/Decline entirely).
                # PICKED_UP is included so re-submitting the same OTP (e.g.
                # after the ride-wide status already flipped to IN_PROGRESS
                # for an earlier passenger) is a no-op instead of a false
                # "Invalid verification code" rejection.
                if ride.ride_type == 'shared':
                    participant = ride.participants.filter(
                        pickup_code=provided_otp,
                        status__in=[
                            RideParticipant.Status.ACCEPTED,
                            RideParticipant.Status.PICKED_UP,
                        ],
                    ).first()
                    if participant:
                        verified_participant = participant
                    else:
                        return False, {'error': 'Invalid verification code.'}
                else:
                    return False, {'error': 'Invalid verification code.'}

            if (
                verified_participant
                and verified_participant.status != RideParticipant.Status.PICKED_UP
            ):
                verified_participant.status = RideParticipant.Status.PICKED_UP
                verified_participant.picked_up_at = timezone.now()
                verified_participant.save()

            data['verified_user_id'] = (
                str(verified_participant.user_id) if verified_participant else None
            )


        elif new_status == Ride.Status.DRIVER_ARRIVING:
            pass  
        elif new_status == Ride.Status.ARRIVED:
            ride.driver_arrived_at = timezone.now()
        elif new_status == Ride.Status.COMPLETED:
            ride.completed_at = timezone.now()
            self._calculate_final_fare(ride)
            self._decline_stale_pending_participants(ride)
        elif new_status == Ride.Status.CANCELLED:
            ride.cancelled_at = timezone.now()
            ride.cancellation_reason = data.get(
                'reason',
                Ride.CancellationReason.RIDER_CANCELLED if actor == ride.rider
                else Ride.CancellationReason.DRIVER_CANCELLED
            )
            ride.cancellation_note = data.get('note', '')
            self._decline_stale_pending_participants(ride)

        # 3. SET STATUS AND SAVE ONCE
        ride.status = new_status
        ride.save()

        if new_status == Ride.Status.IN_PROGRESS:
            # A participant may have just been marked PICKED_UP above -
            # their dropoff stop is now valid to schedule.
            self.push_optimized_route(ride)
        elif new_status == Ride.Status.COMPLETED:
            from notifications.services import create_notification
            for recipient in filter(None, [ride.rider, ride.driver]):
                create_notification(
                    user=recipient,
                    notification_type='ride_completed',
                    title='Ride completed',
                    body=f'Trip finished - fare: {ride.final_fare or ride.estimated_fare}',
                    data={'ride_id': str(ride.id)},
                )
        elif new_status == Ride.Status.CANCELLED:
            from notifications.services import create_notification
            for recipient in filter(None, [ride.rider, ride.driver]):
                create_notification(
                    user=recipient,
                    notification_type='ride_cancelled',
                    title='Ride cancelled',
                    body=ride.cancellation_reason or 'The ride was cancelled.',
                    data={'ride_id': str(ride.id)},
                )

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
            'verified_user_id': data.get('verified_user_id'),
        }
   
    def _decline_stale_pending_participants(self, ride: Ride):
        """
        When a ride ends (completed or cancelled) with pool-join requests
        still sitting at PENDING - the driver never acted on them - decline
        them and restore their reserved seats, instead of leaving them
        stuck at PENDING forever (which would also make the fare split
        treat them as a real passenger if it ever queried by anything
        broader than ACCEPTED/PICKED_UP/DROPPED_OFF).
        """
        pending = list(ride.participants.filter(status=RideParticipant.Status.PENDING))
        if not pending:
            return

        restored_seats = sum(p.seats_reserved for p in pending)
        for p in pending:
            p.status = RideParticipant.Status.DECLINED
            p.save(update_fields=['status'])

        ride.available_seats += restored_seats
        ride.save(update_fields=['available_seats'])

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
        # Mirrors RideSerializer.get_rider_pickup_status exactly - the
        # primary rider's own pickup state, not ride.status (which flips to
        # in_progress as soon as ANY pooled passenger is picked up). Without
        # this, REST responses and live broadcasts disagree during a
        # multi-passenger ride.
        organizer = ride.participants.filter(is_organizer=True).first()
        data = {
            'ride_id': str(ride.id),
            'status': ride.status,
            'ride_type': ride.ride_type,
            'final_fare': final_fare,
            'verification_code': ride.verification_code,
            'rider_pickup_status': organizer.status if organizer else None,
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
            # 1. Send to all joined co-passengers (is_organizer=False - the
            # rider already got this message above, and again just below;
            # ride.participants now also contains their own mirrored row).
            for participant in ride.participants.filter(is_organizer=False):
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

