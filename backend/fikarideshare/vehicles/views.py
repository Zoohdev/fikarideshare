from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Vehicle, VehicleInspection
from .serializers import (
    VehicleSerializer,
    VehicleCreateSerializer,
    VehicleInspectionSerializer,
    InspectionRequestSerializer,
)
from .services import VehicleManager, DEKRAService


class VehicleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing driver's vehicles.
    """
   
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
   
    def get_serializer_class(self):
        if self.action == 'create':
            return VehicleCreateSerializer
        return VehicleSerializer
   
    def get_queryset(self):
        return Vehicle.objects.filter(
            driver=self.request.user
        ).order_by('-is_primary', '-created_at')
   
    def perform_create(self, serializer):
        manager = VehicleManager()
        vehicle = serializer.save(driver=self.request.user)
       
        # Set as primary if first vehicle
        if not self.request.user.vehicles.exclude(id=vehicle.id).exists():
            vehicle.is_primary = True
            vehicle.save()
   
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        """Set a vehicle as the primary vehicle."""
        vehicle = self.get_object()
       
        # Remove primary from other vehicles
        Vehicle.objects.filter(
            driver=request.user,
            is_primary=True
        ).update(is_primary=False)
       
        vehicle.is_primary = True
        vehicle.save()
       
        return Response({'status': 'Vehicle set as primary'})
   
    @action(detail=True, methods=['post'])
    def request_inspection(self, request, pk=None):
        """Request DEKRA inspection for a vehicle."""
        vehicle = self.get_object()
       
        serializer = InspectionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        manager = VehicleManager()
        success, result = manager.request_inspection(
            vehicle=vehicle,
            inspection_type=serializer.validated_data['inspection_type']
        )
       
        if success:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
   
    @action(detail=True, methods=['get'])
    def inspections(self, request, pk=None):
        """Get inspection history for a vehicle."""
        vehicle = self.get_object()
        inspections = vehicle.inspections.all()
        serializer = VehicleInspectionSerializer(inspections, many=True)
        return Response(serializer.data)


class DEKRAWebhookView(APIView):
    """
    Webhook endpoint for DEKRA inspection results.
    """
   
    permission_classes = [AllowAny]
   
    def post(self, request):
        # Verify webhook signature in production
        # signature = request.headers.get('X-DEKRA-Signature')
       
        manager = VehicleManager()
        manager.process_webhook(request.data)
       
        return Response(status=status.HTTP_200_OK)


class DEKRALocationsView(APIView):
    """
    Get nearby DEKRA inspection locations.
    """
   
    permission_classes = [IsAuthenticated]
   
    def get(self, request):
        latitude = request.query_params.get('lat')
        longitude = request.query_params.get('lng')
        radius = request.query_params.get('radius', 50)
       
        if not latitude or not longitude:
            return Response(
                {'error': 'lat and lng parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        dekra = DEKRAService()
        success, locations = dekra.get_available_locations(
            latitude=float(latitude),
            longitude=float(longitude),
            radius_km=int(radius)
        )
       
        return Response({'locations': locations})

