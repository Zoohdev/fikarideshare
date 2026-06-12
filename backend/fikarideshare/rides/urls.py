from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RideEstimateView,
    RideViewSet,
    DriverRideRequestsView,
    DriverAcceptRideView,
)

# 1. Initialize the automatic router for your ModelViewSet
router = DefaultRouter()
router.register(r'trips', RideViewSet, basename='ride')

# 2. Combine the router paths and explicit APIView paths together
urlpatterns = [
    # Router endpoints (Handles: /api/rides/trips/, /api/rides/trips/active/, etc.)
    path('', include(router.urls)),

    # Standalone APIView Endpoints
    path('estimate/', RideEstimateView.as_view(), name='ride_estimate'),
    path('driver/requests/', DriverRideRequestsView.as_view(), name='driver_requests'),
    path('driver/accept/<uuid:ride_id>/', DriverAcceptRideView.as_view(), name='driver_accept_ride'),
]