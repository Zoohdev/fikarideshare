from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q

from .models import Ride, RideParticipant
from .serializers import (
    RideEstimateSerializer,
    RideCreateSerializer,
    RideSerializer,
    RideStatusUpdateSerializer,
    RideParticipantSerializer,
    InviteParticipantSerializer,
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
            Q(rider=user) | Q(driver=user)
        ).select_related(
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
        service = RideService()
       
        success, result = service.create_ride(
            rider=request.user,
            pickup_lat=data['pickup']['latitude'],
            pickup_lng=data['pickup']['longitude'],
            dropoff_lat=data['dropoff']['latitude'],
            dropoff_lng=data['dropoff']['longitude'],
            vehicle_type=data['vehicle_type'],
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
            participants = ride.participants.all()
            serializer = RideParticipantSerializer(participants, many=True)
            return Response(serializer.data)
       
        elif request.method == 'POST':
            # Invite a participant
            serializer = InviteParticipantSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
           
            # Implementation for inviting participants
            # ...
           
            return Response({'message': 'Invitation sent'})


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


