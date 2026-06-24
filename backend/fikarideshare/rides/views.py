from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import transaction
from django.shortcuts import render
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Ride, RideParticipant,EmergencySOS,RideShareLink,RideLocation
from .serializers import (
    RideEstimateSerializer,
    RideCreateSerializer,
    RideSerializer,
    RideStatusUpdateSerializer,
    RideParticipantSerializer,
    InviteParticipantSerializer,
    EmergencySOS,
    RideVerificationSerializer
)
from .services.ride import RideService


class RideEstimateView(APIView):
    """
    Get fare estimate for a ride.
    """
   
    permission_classes = [IsAuthenticated]
   
    def post(self, request):
        serializer = RideEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        data = serializer.validated_data
        service = RideService()
       
        estimate = service.estimate_fare(
            pickup_lat=data['pickup']['latitude'],
            pickup_lng=data['pickup']['longitude'],
            dropoff_lat=data['dropoff']['latitude'],
            dropoff_lng=data['dropoff']['longitude'],
            vehicle_type=data['vehicle_type']
        )
       
        if 'error' in estimate:
            return Response(estimate, status=status.HTTP_400_BAD_REQUEST)

        ride_type = request.data.get('ride_type', 'standard')
        if ride_type == 'shared':
            estimate['total'] = float(estimate['total']) * 0.75  # 25% cheaper fallback for choosing to share
            estimate['is_shared_pricing'] = True
        return Response(estimate)


class RideViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ride operations.
    """
   
    permission_classes = [IsAuthenticated]
    serializer_class = RideSerializer
    filterset_fields = ['status', 'ride_type']

    def get_queryset(self):
        user = self.request.user
        return Ride.objects.filter(
            Q(rider=user) | Q(driver=user) | Q(participants__user=user)
        ).distinct().select_related(
            'rider', 'driver', 'vehicle'
        ).order_by('-requested_at')
   
    def get_serializer_class(self):
        if self.action == 'create':
            return RideCreateSerializer
        return RideSerializer
   
    def create(self, request, *args, **kwargs):
        """Create a new ride request."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        data = serializer.validated_data
        ride_type = data.get('ride_type', 'standard')
        if ride_type == 'shared':
            from django.contrib.gis.geos import Point
            service = RideService()
            
            # Use our Uber-style geospatial vector match algorithm
            open_pool = service.find_compatible_shared_pool(
                pickup_lat=data['pickup']['latitude'],
                pickup_lng=data['pickup']['longitude'],
                dropoff_lat=data['dropoff']['latitude'],
                dropoff_lng=data['dropoff']['longitude'],
                required_seats=data.get('passenger_count', 1)
            )
            
            if open_pool:
                required_seats = data.get('passenger_count', 1)
                pickup = Point(
                    data['pickup']['longitude'],
                    data['pickup']['latitude'],
                    srid=4326
                )
                dropoff = Point(
                    data['dropoff']['longitude'],
                    data['dropoff']['latitude'],
                    srid=4326
                )

                with transaction.atomic():
                    # check_no_active_ride locks the requester's own row -
                    # the pool-match path previously never checked this at
                    # all, so a rider already active elsewhere (as rider,
                    # driver, or another pool's participant) could still
                    # get matched in here.
                    active_ride_error = service.check_no_active_ride(request.user)
                    if active_ride_error:
                        return Response(active_ride_error, status=status.HTTP_400_BAD_REQUEST)

                    # Re-fetch and lock the row - open_pool was read outside
                    # any lock, so without this, two riders matching the
                    # same last seat at once could both succeed.
                    pool = Ride.objects.select_for_update().get(id=open_pool.id)

                    lost_race = not pool.pool_open or pool.available_seats < required_seats
                    already_joined = RideParticipant.objects.filter(
                        ride=pool, user=request.user
                    ).exists()

                    if already_joined:
                        return Response(
                            {"error": "You already joined this ride."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if not lost_race:
                        # PENDING, not ACCEPTED - the seat is reserved
                        # immediately (so no one else can grab it while the
                        # driver decides), but this rider doesn't count as
                        # a real passenger anywhere else (route, fare
                        # split, "is the car empty" checks) until the
                        # driver actually approves them below.
                        participant = RideParticipant.objects.create(
                            ride=pool,
                            user=request.user,
                            pickup_location=pickup,
                            dropoff_location=dropoff,
                            status=RideParticipant.Status.PENDING,
                            seats_reserved=required_seats,
                        )

                        pool.available_seats -= required_seats
                        if pool.available_seats <= 0:
                            pool.pool_open = False
                        pool.save(update_fields=['available_seats', 'pool_open'])

                        from channels.layers import get_channel_layer
                        from asgiref.sync import async_to_sync

                        channel_layer = get_channel_layer()
                        async_to_sync(channel_layer.group_send)(
                            f"ride_{pool.id}",
                            {
                                "type": "pool_join_request",
                                "participant_id": str(participant.id),
                                "ride_id": str(pool.id),
                                "rider_name": request.user.full_name,
                                "rider_id": str(request.user.id),
                                "pickup_address": participant.pickup_address,
                                "dropoff_address": participant.dropoff_address,
                                "seats": required_seats,
                            }
                        )

                        service._broadcast_ride_update(
                            pool,
                            {
                                'event': 'pool_request_pending',
                                'participant_id': str(participant.id)
                            }
                        )

                        return Response(
                            {
                                **RideSerializer(pool).data,
                                "joined_existing_pool": True,
                                "participant_id": str(participant.id),
                                "pool_status": "pending_driver_approval",
                            },
                            status=status.HTTP_200_OK
                        )
                # Lost the race for the last seat between the initial match
                # and acquiring the lock - fall through to creating a fresh
                # (still poolable) ride instead of erroring the rider out.
        # --- POOLING LOGIC END ---

        service = RideService()
       
        success, result = service.create_ride(
            rider=request.user,
            pickup_lat=data['pickup']['latitude'],
            pickup_lng=data['pickup']['longitude'],
            dropoff_lat=data['dropoff']['latitude'],
            dropoff_lng=data['dropoff']['longitude'],
            vehicle_type=data['vehicle_type'],
            ride_type=data.get('ride_type', 'standard'),
            passenger_count=data.get('passenger_count', 1),
            notes=data.get('notes', ''),
            scheduled_time=data.get('scheduled_time'),
        )
       
        if success:
            return Response(
                {**result, "joined_existing_pool": False},
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update ride status."""
        ride = self.get_object()
        serializer = RideStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        service = RideService()
        success, result = service.update_ride_status(
            ride=ride,
            new_status=serializer.validated_data['status'],
            actor=request.user,
            data=serializer.validated_data
        )
       
        if success:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
   
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a ride."""
        ride = self.get_object()
       
        if not ride.can_cancel:
            return Response(
                {'error': 'This ride cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        service = RideService()
        success, result = service.update_ride_status(
            ride=ride,
            new_status=Ride.Status.CANCELLED,
            actor=request.user,
            data={
                'reason': request.data.get('reason', ''),
                'note': request.data.get('note', ''),
            }
        )
       
        if success:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def smart_waypoints(self, request, pk=None):
        ride = self.get_object()

        lat_param = request.query_params.get('lat')
        lng_param = request.query_params.get('lng')
        current_lat = float(lat_param) if lat_param else None
        current_lng = float(lng_param) if lng_param else None

        route_sequence = RideService().compute_optimized_route(ride, current_lat, current_lng)
        return Response({"optimized_route": route_sequence}, status=status.HTTP_200_OK)

    
    @action(detail=True, methods=['post'])
    def dropoff_user(self, request, pk=None):
        ride = self.get_object()
        user_id_to_drop = request.data.get('user_id')
        service = RideService()
        
        # Case A: Dropping off a Pool Participant
        participant = ride.participants.filter(user_id=user_id_to_drop, status='picked_up').first()
        if participant:
            # Finalize their specific fare
            final_fare = participant.estimated_fare_contribution
            
            participant.status = RideParticipant.Status.DROPPED_OFF
            participant.fare_amount = final_fare
            participant.save()
            
            # Open up a seat in the car again!
            ride.available_seats += 1
            ride.pool_open = True
            ride.save()
            
            service._broadcast_ride_update(ride, {
                'event': 'individual_dropped_off', 
                'user_id': user_id_to_drop, 
                'final_fare': str(final_fare),
                'message': 'Your ride is complete!'
            })
            
            # Is the car now empty? ride.participants now includes the
            # organizer (is_organizer=True, kept in sync below in Case B),
            # so this correctly waits for the primary rider too instead of
            # only counting pool joiners.
            active_participants = ride.participants.exclude(status__in=['dropped_off', 'cancelled']).exists()
            if not active_participants:
                # Use RideService to safely transition state just like CompleteRideView does
                service.update_ride_status(
                    ride=ride,
                    new_status=Ride.Status.COMPLETED,
                    actor=request.user,
                    data={}
                )
                return Response({'status': 'ride_fully_completed', 'user_id': user_id_to_drop})

            service.push_optimized_route(ride)
            return Response({'status': 'dropped_off', 'user_id': user_id_to_drop, 'fare': final_fare})

        # Case B: Dropping off the Primary Rider
        if str(ride.rider.id) == str(user_id_to_drop) and ride.status == ride.Status.IN_PROGRESS:
            ride_fare = ride.estimated_fare

            # Keep the organizer's own RideParticipant row in sync, so the
            # "is the car empty" check below (and in Case A) sees them as
            # gone too, instead of only ever checking pool joiners.
            organizer_participant = ride.participants.filter(
                user_id=user_id_to_drop, is_organizer=True
            ).first()
            if organizer_participant:
                organizer_participant.status = RideParticipant.Status.DROPPED_OFF
                organizer_participant.fare_amount = ride_fare
                organizer_participant.save()

            service._broadcast_ride_update(ride, {
                'event': 'individual_dropped_off',
                'user_id': user_id_to_drop,
                'final_fare': str(ride_fare),
                'message': 'Your ride is complete!'
            })

            # If the car is completely empty, end the whole session safely
            if not ride.participants.exclude(status__in=['dropped_off', 'cancelled']).exists():
                service.update_ride_status(
                    ride=ride,
                    new_status=Ride.Status.COMPLETED,
                    actor=request.user,
                    data={}
                )
                return Response({'status': 'ride_fully_completed', 'fare': ride_fare})

            service.push_optimized_route(ride)
            return Response({'status': 'primary_rider_dropped_off', 'fare': ride_fare})

        return Response({'error': 'User not found or not currently picked up'}, status=status.HTTP_400_BAD_REQUEST)
    
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get user's active ride."""
        ride = Ride.objects.filter(
            Q(rider=request.user) | Q(driver=request.user),
            status__in=[
                Ride.Status.REQUESTED,
                Ride.Status.SEARCHING,
                Ride.Status.DRIVER_ASSIGNED,
                Ride.Status.DRIVER_ARRIVING,
                Ride.Status.ARRIVED,
                Ride.Status.IN_PROGRESS,
            ]
        ).first()
       
        if ride:
            serializer = RideSerializer(ride)
            return Response(serializer.data)
        else:
            return Response({'message': 'No active ride'}, status=status.HTTP_404_NOT_FOUND)
   
    @action(detail=True, methods=['get', 'post'])
    def participants(self, request, pk=None):
        """Manage shared ride participants."""
        ride = self.get_object()
       
        if request.method == 'GET':
            # is_organizer=False - matches RideSerializer.get_participants:
            # this lists other passengers, the rider already knows they're
            # in their own ride.
            participants = ride.participants.filter(
                status=RideParticipant.Status.ACCEPTED,
                is_organizer=False,
            )
            serializer = RideParticipantSerializer(participants, many=True)
            return Response(serializer.data)
       
        elif request.method == 'POST':
            # Invite a participant
            serializer = InviteParticipantSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
           
            # Implementation for inviting participants
            # ...
           
            return Response({'message': 'Invitation sent'})

    


    # views.py
class RideVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    # GET: The rider calls this to see their 4-digit code
    def get(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id, rider=request.user)
            return Response({'verification_code': ride.verification_code}, status=status.HTTP_200_OK)
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found'}, status=status.HTTP_404_NOT_FOUND)

    # POST: The driver calls this to verify a single rider's code. This is
    # called once per passenger in a shared ride - each call only marks
    # the specific RideParticipant whose pickup_code matches, never the
    # whole pool. All matching/mutation lives in
    # RideService.update_ride_status() so there is exactly one place that
    # decides "who does this code belong to" - this view used to duplicate
    # that logic and pre-mutate the participant before calling the service,
    # which made the service's own (now-stale) status filter falsely reject
    # the first non-primary-rider pickup of a shared ride with a 400.
    def post(self, request):
        serializer = RideVerificationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        ride_id = serializer.validated_data['ride_id']
        code = str(serializer.validated_data['code']).strip()

        try:
            with transaction.atomic():
                ride = Ride.objects.select_for_update().get(id=ride_id)

                service = RideService()
                success, result = service.update_ride_status(
                    ride=ride,
                    new_status=Ride.Status.IN_PROGRESS,
                    actor=request.user,
                    data={"verification_code": code}
                )
        except Ride.DoesNotExist:
            return Response({'error': 'Ride record not found'}, status=status.HTTP_404_NOT_FOUND)

        if not success:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        verified_user_id = result.get('verified_user_id')
        is_primary_rider = verified_user_id == str(ride.rider_id)

        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{verified_user_id}",
            {
                "type": "ride_status",
                "ride_id": str(ride.id),
                "status": "in_progress",
                "data": {
                    "ride_id": str(ride.id),
                    "status": "in_progress",
                    "verified_user_id": verified_user_id
                }
            }
        )

        return Response({
            "status": "verified",
            "type": "primary_rider" if is_primary_rider else "pool_participant",
            "user": verified_user_id,
        }, status=status.HTTP_200_OK)

class DriverRideRequestsView(APIView):
    """
    View pending ride requests for drivers.
    """
   
    permission_classes = [IsAuthenticated]
   
    def get(self, request):
        if not request.user.is_driver:
            return Response(
                {'error': 'Only drivers can view ride requests'},
                status=status.HTTP_403_FORBIDDEN
            )
       
        # Get nearby ride requests
        # This would typically filter by proximity to driver's current location
        requests = Ride.objects.filter(
            status=Ride.Status.SEARCHING,
            driver__isnull=True
        ).order_by('requested_at')[:10]
       
        serializer = RideSerializer(requests, many=True)
        return Response(serializer.data)


class DriverAcceptRideView(APIView):
    """
    Driver accepts a ride request.
    """
   
    permission_classes = [IsAuthenticated]
   
    def post(self, request, ride_id):
        if not request.user.is_driver:
            return Response(
                {'error': 'Only drivers can accept rides'},
                status=status.HTTP_403_FORBIDDEN
            )
       
        try:
            ride = Ride.objects.get(
                id=ride_id,
                status=Ride.Status.SEARCHING,
                driver__isnull=True
            )
        except Ride.DoesNotExist:
            return Response(
                {'error': 'Ride not available'},
                status=status.HTTP_404_NOT_FOUND
            )
       
        service = RideService()
        success, result = service.assign_driver(ride, request.user)
       
        if success:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
class CompleteRideView(APIView):
    """
    Endpoint for drivers to complete an active ride.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        ride_id = request.data.get('ride_id')
        if not ride_id:
            return Response({'error': 'ride_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            ride = Ride.objects.get(id=ride_id, driver=request.user)
            service = RideService()
            success, result = service.update_ride_status(
                ride=ride,
                new_status=Ride.Status.COMPLETED,
                actor=request.user,
                data={}
            )

            if success:
                if ride.ride_type == 'shared':
                    from rides.services.pricing import FareSplitService

                    # Only people who actually rode get a fare share - not
                    # PENDING requests the driver never acted on (now
                    # DECLINED by _decline_stale_pending_participants
                    # above) or anyone who separately declined/cancelled.
                    participants = list(ride.participants.filter(
                        status__in=[
                            RideParticipant.Status.ACCEPTED,
                            RideParticipant.Status.PICKED_UP,
                            RideParticipant.Status.DROPPED_OFF,
                        ]
                    ))

                    # The organizer (ride.rider) is mirrored as one of these
                    # participants (is_organizer=True, see
                    # RideService.create_ride) for every ride created after
                    # this was added, and backfilled for older ones by
                    # migration 0018. Defensive fallback in case a ride
                    # somehow has none, rather than silently dropping the
                    # rider's own share from the split.
                    if not any(p.is_organizer for p in participants):
                        participants.append(RideParticipant(
                            ride=ride,
                            user_id=ride.rider_id,
                            is_organizer=True,
                            status=RideParticipant.Status.ACCEPTED,
                            pickup_location=ride.pickup_location,
                            pickup_address=ride.pickup_address,
                            dropoff_location=ride.dropoff_location,
                            dropoff_address=ride.dropoff_address,
                            estimated_distance_meters=ride.estimated_distance_meters,
                            pickup_code=ride.verification_code,
                        ))

                    # ride.final_fare is the total for the whole vehicle trip
                    # (set by _calculate_final_fare above) - it must stay the
                    # grand total, not get overwritten with just one leg's
                    # share (the previous version of this code did that).
                    split_input = [{
                        'user_id': str(p.user_id),
                        'distance_meters': p.estimated_distance_meters or 0,
                    } for p in participants]

                    split_result = FareSplitService().calculate_split(
                        total_fare=ride.final_fare,
                        participants=split_input,
                        split_type='distance',
                    )
                    shares_by_user = {row['user_id']: row for row in split_result}

                    from payments.services import PaymentService
                    payment_service = PaymentService()

                    for p in participants:
                        share = shares_by_user.get(str(p.user_id))
                        if share:
                            p.fare_amount = share['amount']
                            p.fare_percentage = share['percentage']
                        p.status = RideParticipant.Status.DROPPED_OFF

                        # Charge each rider (organizer included) their own
                        # share immediately - previously the split was
                        # calculated and stored here but nothing actually
                        # collected it; only a single manual "Proceed to
                        # Payment" button existed, which only the organizer
                        # could even reach and which charged the whole
                        # trip's total rather than anyone's individual share.
                        if p.fare_amount and p.fare_amount > 0:
                            charged, charge_result = payment_service.charge_saved_card(
                                user=p.user,
                                amount=p.fare_amount,
                                currency='USD',
                                description=f"Fare share for ride {ride.id}",
                                metadata={'ride_id': str(ride.id), 'participant_id': str(p.id)},
                            )
                            if charged and not charge_result.get('requires_action'):
                                p.payment_status = 'paid'
                                payment_id = charge_result.get('payment_id')
                                if payment_id:
                                    p.payment_id = payment_id
                            else:
                                p.payment_status = 'failed'

                        p.save()

                return Response({'status': 'completed', 'ride_id': str(ride.id)}, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Ride.DoesNotExist:
            return Response({'error': 'Active ride not found for this driver'}, status=status.HTTP_404_NOT_FOUND)


class TriggerSOSAlertView(APIView):
    """
    Initializes a critical safety incident tracking log in the backend system.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, ride_id):
        ride = get_object_or_404(Ride, id=ride_id)
        
        
        reporter_type = 'driver' if ride.driver == request.user else 'rider'
        
        sos_incident = EmergencySOS.objects.create(
            ride=ride,
            reporter=request.user,
            reporter_type=reporter_type,
            is_active=True
        )

        

        return Response({
            "message": "Crisis state recorded internally. System dispatch initialized.",
            "sos_id": str(sos_incident.id),
            "tracking_url": f"https://fika.co.za/safety/track/{sos_incident.id}/"
        }, status=status.HTTP_201_CREATED)


class PublicTrackingAPIView(APIView):

    authentication_classes = []
    permission_classes = []

    def get(self, request, token):

        link = get_object_or_404(
            RideShareLink,
            token=token,
            is_active=True
        )
        if (
            not link.is_active or
            timezone.now() > link.expires_at
        ):
            return Response(
                {"error":"expired"},
                status=404
            )


        ride = link.ride

        latest = RideLocation.objects.filter(
            ride=ride
        ).order_by(
            "-recorded_at"
        ).first()
        print("RIDE:", ride.id)
        print("ROUTE POLYLINE:", ride.route_polyline)

        if ride.route_polyline:
            print("COORD COUNT:", len(ride.route_polyline.coords))

        return Response({
            "ride_id": str(ride.id),

            "status": ride.status,

            "driver": {
                "name":
                ride.driver.first_name
                if ride.driver
                else "Driver Pending"
            },

            "vehicle": {
                "number":
                    ride.vehicle.license_plate
                    if ride.vehicle
                    else None,

                "model":
                    ride.vehicle.make
                    if ride.vehicle
                    else None,
            },

            "pickup": {
                "latitude": ride.pickup_location.y,
                "longitude": ride.pickup_location.x
            },

            "destination": {
                "latitude": ride.dropoff_location.y,
                "longitude": ride.dropoff_location.x
            },

            "driver_location": {
                "latitude": latest.location.y if latest else None,
                "longitude": latest.location.x if latest else None
            },
            "pickup_address":
                ride.pickup_address,

            "dropoff_address":
                ride.dropoff_address,

            "estimated_duration":
                ride.estimated_duration_seconds,
            "estimated_distance": ride.estimated_distance_meters,
            "route": [
                {
                    "latitude": point[1],
                    "longitude": point[0]
                }
                for point in ride.route_polyline.coords
            ] if ride.route_polyline else []
})

class CreateRideShareLinkAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, ride_id):

        ride = Ride.objects.get(id=ride_id)

        link, created = RideShareLink.objects.get_or_create(
            ride=ride
        )

        return Response({
            "token": str(link.token),
            "share_url":
            f"http://192.168.0.112:8000/api/rides/track/{link.token}"
        })

class AcceptPoolRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        participant_id = request.data.get(
            "participant_id"
        )

        with transaction.atomic():
            participant = get_object_or_404(
                RideParticipant.objects.select_for_update(),
                id=participant_id
            )

            ride = participant.ride

            if str(ride.driver_id) != str(request.user.id):
                return Response(
                    {"error": "Only this ride's driver can approve pool requests."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if participant.status != RideParticipant.Status.PENDING:
                return Response(
                    {"error": f"Request is no longer pending (status: {participant.status})."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            participant.status = RideParticipant.Status.ACCEPTED
            participant.save(update_fields=['status'])

        service = RideService()
        service._broadcast_ride_update(
            ride,
            {
                "event": "passenger_joined_pool",
                "participant_id": str(participant.id),
            }
        )
        service.push_optimized_route(ride)

        return Response({
            "success": True
        })

class DeclinePoolRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        participant_id = request.data.get(
            "participant_id"
        )

        with transaction.atomic():
            participant = get_object_or_404(
                RideParticipant.objects.select_for_update(),
                id=participant_id
            )

            ride = Ride.objects.select_for_update().get(id=participant.ride_id)

            if str(ride.driver_id) != str(request.user.id):
                return Response(
                    {"error": "Only this ride's driver can decline pool requests."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if participant.status != RideParticipant.Status.PENDING:
                return Response(
                    {"error": f"Request is no longer pending (status: {participant.status})."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            participant.status = RideParticipant.Status.DECLINED
            participant.save(update_fields=['status'])

            # The seat was reserved the moment this rider matched, before
            # the driver ever saw the request - give it back now that
            # they've been turned down, instead of permanently shrinking
            # this vehicle's capacity.
            ride.available_seats += participant.seats_reserved
            ride.pool_open = True
            ride.save(update_fields=['available_seats', 'pool_open'])

        service = RideService()
        service._broadcast_ride_update(
            ride,
            {
                "event": "passenger_declined",
                "participant_id": str(participant.id)
            }
        )

        return Response({
            "success": True
        })


def public_tracking_page(
    request,
    token
):
    return render(
        request,
        "tracking/public_tracking.html",
        {
            "token": str(token),
            "GOOGLE_MAPS_API_KEY":
            settings.GOOGLE_MAPS_API_KEY
        }
    )

