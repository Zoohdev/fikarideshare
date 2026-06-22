from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
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
                # Calculate estimated distance for this leg
                leg_estimate = service.estimate_fare(
                    pickup_lat=data['pickup']['latitude'],
                    pickup_lng=data['pickup']['longitude'],
                    dropoff_lat=data['dropoff']['latitude'],
                    dropoff_lng=data['dropoff']['longitude']
                )
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
                # Add participant to the matched pool route
                existing_participant = RideParticipant.objects.filter(
                    ride=open_pool,
                    user=request.user
                        ).first()

                if existing_participant:
                    return Response(
                        {
                            "error": "You already joined this ride."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                participant = RideParticipant.objects.create(
                    ride=open_pool,
                    user=request.user,
                    pickup_location=pickup,
                    dropoff_location=dropoff,
                    status=RideParticipant.Status.ACCEPTED,
                )
                            
                print("================================")
                print("PARTICIPANT CREATED")
                print("ID:", participant.id)
                print("STATUS:", participant.status)
                print("USER:", participant.user.id)
                print("RIDE:", open_pool.id)
                print("================================")

                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync

                channel_layer = get_channel_layer()

                async_to_sync(channel_layer.group_send)(
                    f"ride_{open_pool.id}",
                    {
                        "type": "pool_join_request",
                        "participant_id": str(participant.id),
                        "ride_id": str(open_pool.id),

                        "rider_name": request.user.full_name,
                        "rider_id": str(request.user.id),

                        "pickup_address":
                            participant.pickup_address,

                        "dropoff_address":
                            participant.dropoff_address,

                        "seats":
                            data.get("passenger_count", 1),
                    }
                )
                print("================================")
                print("SENDING POOL REQUEST")
                print("GROUP:", f"ride_{open_pool.id}")
                print("PARTICIPANT:", participant.id)
                print("STATUS:", participant.status)
                print("================================")

                # Update remaining capacity on vehicle
                # open_pool.available_seats -= data.get('passenger_count', 1)
                # if open_pool.available_seats <= 0:
                #     open_pool.pool_open = False
                # open_pool.save()
                
                # Trigger real-time WebSocket update to the driver app
                service._broadcast_ride_update(
                open_pool,
                {
                    'event': 'pool_request_pending',
                    'participant_id': str(participant.id)
                }
            )
                
                return Response(RideSerializer(open_pool).data, status=status.HTTP_200_OK)
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
            return Response(result, status=status.HTTP_201_CREATED)
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
        from django.contrib.gis.geos import Point
        
        ride = self.get_object()
        
        # 1. Get Driver's current location (Fallback to first pickup if driver location isn't tracked yet)
        # Assuming you pass driver_lat / driver_lng in query params, or use the main ride pickup
        current_lat = float(request.query_params.get('lat', ride.pickup_location.y))
        current_lng = float(request.query_params.get('lng', ride.pickup_location.x))
        current_loc = Point(current_lng, current_lat, srid=4326)

        pending_stops = []
        
        # 2. Gather all pending stops (Primary Rider)
        if ride.status == ride.Status.DRIVER_ASSIGNED:
            pending_stops.append({'type': 'pickup', 'user_id': ride.rider.id, 'point': ride.pickup_location, 'name': 'Primary Rider'})
        if ride.status in [ride.Status.DRIVER_ASSIGNED, ride.Status.IN_PROGRESS]:
            pending_stops.append({'type': 'dropoff', 'user_id': ride.rider.id, 'point': ride.dropoff_location, 'name': 'Primary Rider', 'requires_pickup': ride.rider.id})

        # 3. Gather all pending stops (Pool Participants)
        for p in ride.participants.filter(
            status__in=[
                RideParticipant.Status.ACCEPTED,
                RideParticipant.Status.PICKED_UP,
            ]
        ):

            if p.status == RideParticipant.Status.ACCEPTED:

                pending_stops.append({
                    'type': 'pickup',
                    'user_id': p.user.id,
                    'point': p.pickup_location,
                    'name': f'Rider {p.user.id}'
                })

            pending_stops.append({
                'type': 'dropoff',
                'user_id': p.user.id,
                'point': p.dropoff_location,
                'name': f'Rider {p.user.id}',
                'requires_pickup': p.user.id
            })

        # 4. Nearest Neighbor Algorithm (Calculate best sequence)
        route_sequence = []
        picked_up_users = set()
        
        # Add users who are already in the car to the picked_up set
        if ride.status == ride.Status.IN_PROGRESS:
            picked_up_users.add(ride.rider.id)
        for p in ride.participants.filter(status='picked_up'):
            picked_up_users.add(p.user.id)

        while pending_stops:
            # Filter valid next stops (Cannot drop off someone who hasn't been picked up)
            valid_next_stops = [
                stop for stop in pending_stops 
                if stop['type'] == 'pickup' or (stop['type'] == 'dropoff' and stop['requires_pickup'] in picked_up_users)
            ]
            
            if not valid_next_stops:
                break # Safety break
                
            # Find closest valid stop to current location
            valid_next_stops.sort(key=lambda stop: current_loc.distance(stop['point']))
            closest_stop = valid_next_stops[0]
            
            # Format for the frontend App
            route_sequence.append({
                "action": closest_stop['type'],
                "user_id": closest_stop['user_id'],
                "latitude": closest_stop['point'].y,
                "longitude": closest_stop['point'].x
            })
            
            # Update state for next loop iteration
            if closest_stop['type'] == 'pickup':
                picked_up_users.add(closest_stop['user_id'])
                
            current_loc = closest_stop['point']
            pending_stops.remove(closest_stop)

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
            
            # FIX: Check if car is now empty (assuming primary rider is also gone or isn't part of the pool)
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

            return Response({'status': 'dropped_off', 'user_id': user_id_to_drop, 'fare': final_fare})

        # Case B: Dropping off the Primary Rider
        if str(ride.rider.id) == str(user_id_to_drop) and ride.status == ride.Status.IN_PROGRESS:
            ride_fare = ride.estimated_fare 
            
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
            participants = ride.participants.filter(
                status=RideParticipant.Status.ACCEPTED
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

    # POST: The driver calls this to verify the code
    def post(self, request):
        
        print("Request Data:", request.data)

        serializer = RideVerificationSerializer(data=request.data)

        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        print("Validated Data:", serializer.validated_data)
        ride_id = request.data.get('ride_id')
        try:
            ride = Ride.objects.get(id=ride_id)
            code = request.data.get('code')
            if not code:
                return Response({'error': 'Verification code is required'}, status=status.HTTP_400_BAD_REQUEST)
            # Case A: Code matches the main primary ride owner
            if str(ride.verification_code).strip() == code:

                service = RideService()

                success, result = service.update_ride_status(
                    ride=ride,
                    new_status=Ride.Status.IN_PROGRESS,
                    actor=request.user,
                    data={
                        "verification_code": code
                    }
                )

                if not success:
                    print("UPDATE STATUS FAILED")
                    print("RESULT:", result)
                    print("CURRENT STATUS:", ride.status)

                    return Response(
                        result,
                        status=status.HTTP_400_BAD_REQUEST
                    )

                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_{ride.rider.id}",
                    {
                        "type": "ride_status",
                        "ride_id": str(ride.id),
                        "status": "in_progress",
                        "data": {
                            "ride_id": str(ride.id),
                            "status": "in_progress",
                            "verified_user_id": str(ride.rider.id)
                        }
                    }
                )
                
                return Response({
                    "status": "verified",
                    "type": "primary_rider"
                })
                
            # Case B: Code matches a pooled participant hopping in mid-trip
            if ride.ride_type == 'shared':
                participant = ride.participants.filter(pickup_code=code, status='accepted').first()
                if participant:
                    participant.status = RideParticipant.Status.PICKED_UP
                    participant.picked_up_at = timezone.now()
                    participant.save()
                    
                    # FIX 2: Ensure the main ride switches to IN_PROGRESS if this is the first passenger
                    service = RideService()
                    print("OTP VERIFIED")
                    print("RIDE ID:", ride.id)
                    print("CURRENT STATUS:", ride.status)
                    if ride.status != Ride.Status.IN_PROGRESS:

                        success, result = service.update_ride_status(
                            ride=ride,
                            new_status=Ride.Status.IN_PROGRESS,
                            actor=request.user,
                            data={
                                "verification_code": code
                            }
                        )

                        if not success:
                            return Response(
                                result,
                                status=status.HTTP_400_BAD_REQUEST
                            )

                    
                    from channels.layers import get_channel_layer
                    from asgiref.sync import async_to_sync

                    channel_layer = get_channel_layer()

                    async_to_sync(channel_layer.group_send)(
                        f"user_{participant.user.id}",
                        {
                            "type": "ride_status",
                            "ride_id": str(ride.id),
                            "status": "in_progress",
                            "data": {
                                "ride_id": str(ride.id),
                                "status": "in_progress",
                                "verified_user_id": str(participant.user.id)
                            }
                        }
                    )
                    return Response({'status': 'verified', 'type': 'pool_participant', 'user': participant.user.id}, status=status.HTTP_200_OK)
                    
            return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
        except Ride.DoesNotExist:
            return Response({'error': 'Ride record not found'}, status=status.HTTP_404_NOT_FOUND)

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
            # success, result = service.update_ride_status(
            #     ride=ride,
            #     new_status=Ride.Status.COMPLETED,
            #     actor=request.user,
            #     data={}
            # )
            if ride.status != Ride.Status.IN_PROGRESS:
                service.update_ride_status(
                    ride=ride,
                    new_status=Ride.Status.IN_PROGRESS,
                    actor=request.user,
                    data={}
                )
            
            if success:
                if ride.ride_type == 'shared':
                    from decimal import Decimal
                    participants = ride.participants.all()
                    
                    # 1. Calculate the total combined distance of all individual legs
                    # Includes the main rider's estimated distance + all participants
                    total_leg_distance = ride.estimated_distance_meters or 1  # prevent division by zero
                    for p in participants:
                        total_leg_distance += (p.estimated_distance_meters or 0)
                    
                    # 2. Proportional Split Logic
                    gross_fare = ride.final_fare
                    
                    # Calculate Main Rider Share
                    main_rider_ratio = Decimal(ride.estimated_distance_meters or 0) / Decimal(total_leg_distance)
                    main_rider_fare = gross_fare * main_rider_ratio
                    ride.final_fare = round(main_rider_fare, 2)
                    ride.save()
                    
                    # Calculate Participant Shares
                    for p in participants:
                        participant_ratio = Decimal(p.estimated_distance_meters or 0) / Decimal(total_leg_distance)
                        p.fare_amount = round(gross_fare * participant_ratio, 2)
                        p.status = RideParticipant.Status.DROPPED_OFF
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
        ride = get_object_or_404(SharedRideGroup, id=ride_id)
        
        
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

        participant = get_object_or_404(
            RideParticipant,
            id=participant_id
        )

        ride = participant.ride

        participant.status = (
            RideParticipant.Status.ACCEPTED
        )

        

        participant.save()

        RideService()._broadcast_ride_update(
            participant.ride,
            {
                "event": "passenger_joined_pool",
                "participant_id": str(participant.id),
            }
        )

        return Response({
            "success": True
        })

class DeclinePoolRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        participant_id =request.data.get(
                "participant_id"
            )

        participant = get_object_or_404(
                RideParticipant,
                id=participant_id
            )

        participant.status = (
            RideParticipant.Status.DECLINED
        )
        RideService()._broadcast_ride_update(
            participant.ride,
            {
                "event":
                "passenger_declined",

                "participant_id":
                str(participant.id)
            }
        )

        participant.save()

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

