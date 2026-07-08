from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlacesAutocompleteView,
    PlaceDetailsView,
    RideEstimateView,
    RideViewSet,
    DriverRideRequestsView,
    DriverAcceptRideView,
    DriverDashboardStatsView,
    RideVerificationView,
    CompleteRideView,
    CreateRideShareLinkAPIView,
    PublicTrackingAPIView,
    public_tracking_page,
    AcceptPoolRequestAPIView,
    DeclinePoolRequestAPIView,
    TriggerSOSAlertView,
    EmergencySOSResolveView,
    EmergencySOSAudioUploadView
)

# 1. Initialize the automatic router for your ModelViewSet
router = DefaultRouter()
router.register(r'trips', RideViewSet, basename='ride')

# 2. Combine the router paths and explicit APIView paths together
urlpatterns = [
    # Router endpoints (Handles: /api/rides/trips/, /api/rides/trips/active/, etc.)
    path('', include(router.urls)),

    # Standalone APIView Endpoints
    path('places/autocomplete/', PlacesAutocompleteView.as_view(), name='places_autocomplete'),
    path('places/details/', PlaceDetailsView.as_view(), name='place_details'),
    path('estimate/', RideEstimateView.as_view(), name='ride_estimate'),
    path('driver/requests/', DriverRideRequestsView.as_view(), name='driver_requests'),
    path('driver/accept/<uuid:ride_id>/', DriverAcceptRideView.as_view(), name='driver_accept_ride'),
    path('driver/stats/', DriverDashboardStatsView.as_view(), name='driver_stats'),
    path("verify-code/", RideVerificationView.as_view(), name='verify-code-post'),
    path("verify-code/<uuid:ride_id>/", RideVerificationView.as_view(), name='verify-code-get'),
    path("complete-ride/", CompleteRideView.as_view(), name='complete_ride'),
    path("trips/<uuid:ride_id>/share/",CreateRideShareLinkAPIView.as_view(),name="share"),

    path("public-track/<uuid:token>/",PublicTrackingAPIView.as_view(),name="public_track"),

    # Matches the frontend's api.post(`/rides/pool/${rideId}/sos/`) call
    path("pool/<uuid:ride_id>/sos/", TriggerSOSAlertView.as_view(), name='trigger_sos'),
    path("pool/sos/<uuid:sos_id>/resolve/", EmergencySOSResolveView.as_view(), name='resolve_sos'),
    path("pool/sos/<uuid:sos_id>/audio/", EmergencySOSAudioUploadView.as_view(), name='sos_audio_upload'),

    path("track/<uuid:token>/",public_tracking_page,name="public_tracking_page"),
    path(
    "pool-request/accept/",
    AcceptPoolRequestAPIView.as_view()
),

path(
    "pool-request/decline/",
    DeclinePoolRequestAPIView.as_view()
),

]