# from django.contrib.gis.geos import Point
# from rest_framework.decorators import api_view, permission_classes, authentication_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from rest_framework import status
# from .models import ServiceableZone

# @api_view(['GET'])
# @authentication_classes([]) # Disables token/session checking for this view
# @permission_classes([AllowAny]) # Allows any public user to access this endpoint
# def check_serviceability(request):
#     lat_param = request.GET.get('latitude')
#     lng_param = request.GET.get('longitude')
    
#     if not lat_param or not lng_param:
#         return Response(
#             {'error': 'Both latitude and longitude parameters are required.'}, 
#             status=status.HTTP_400_BAD_REQUEST
#         )
        
#     try:
#         lat = float(lat_param)
#         lng = float(lng_param)
        
#         # PostGIS geometric index order: (Longitude, Latitude)
#         target_point = Point(lng, lat, srid=4326)
        
#         # Fast spatial containment lookup using spatial indexing
#         matching_zone = ServiceableZone.objects.filter(
#             is_serviceable=True,
#             geom_polygon__contains=target_point
#         ).select_related('city').first()
        
#         if matching_zone:
#             return Response({
#                 'serviceable': True,
#                 'city': matching_zone.city.city_name,
#                 'zone_label': matching_zone.zone_label
#             }, status=status.HTTP_200_OK)
            
#         return Response({
#             'serviceable': False, 
#             'message': 'Location is outside our current operational zones.'
#         }, status=status.HTTP_200_OK)
        
#     except (ValueError, TypeError):
#         return Response(
#             {'error': 'Invalid coordinate format. Must be floating-point numbers.'}, 
#             status=status.HTTP_400_BAD_REQUEST
#         )

from django.contrib.gis.geos import Point
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import ServiceableZone

@api_view(['GET'])
@authentication_classes([]) 
@permission_classes([AllowAny]) 
def check_serviceability(request):
    # 1. Capture both pickup and destination coordinates
    p_lat = request.GET.get('pickup_lat')
    p_lng = request.GET.get('pickup_lng')
    d_lat = request.GET.get('dest_lat')
    d_lng = request.GET.get('dest_lng')
    
    if not all([p_lat, p_lng, d_lat, d_lng]):
        return Response(
            {'error': 'Pickup and destination coordinates are required.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        # 2. Convert to GeoDjango Points (Longitude, Latitude)
        pickup_pt = Point(float(p_lng), float(p_lat), srid=4326)
        dest_pt = Point(float(d_lng), float(d_lat), srid=4326)
        
        # 3. Check Pickup Zone
        pickup_valid = ServiceableZone.objects.filter(
            is_serviceable=True,
            geom_polygon__contains=pickup_pt
        ).exists()
        
        if not pickup_valid:
            return Response({
                'serviceable': False, 
                'message': 'Your pickup location is outside our current operational zones.'
            }, status=status.HTTP_200_OK)

        # 4. Check Destination Zone
        dest_valid = ServiceableZone.objects.filter(
            is_serviceable=True,
            geom_polygon__contains=dest_pt
        ).exists()

        if not dest_valid:
            return Response({
                'serviceable': False, 
                'message': 'Your destination is outside our current operational zones.'
            }, status=status.HTTP_200_OK)
            
        # 5. Both are valid
        return Response({'serviceable': True}, status=status.HTTP_200_OK)
        
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid coordinate format. Must be floating-point numbers.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )