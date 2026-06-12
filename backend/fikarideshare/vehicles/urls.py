from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, DEKRAWebhookView, DEKRALocationsView

# 1. Initialize the framework router layer
router = DefaultRouter()
router.register(r'garage', VehicleViewSet, basename='vehicle')

urlpatterns = [
    # Router endpoints (List, Create, Retrieve, Update, Destroy)
    # This automatically includes your custom @action paths:
    # - /api/vehicles/garage/<pk>/set_primary/
    # - /api/vehicles/garage/<pk>/request_inspection/
    # - /api/vehicles/garage/<pk>/inspections/
    path('', include(router.urls)),

    # 2. Standalone APIView Integrations
    # DEKRA Inspection result callback webhook endpoint
    path('dekra/webhook/', DEKRAWebhookView.as_view(), name='dekra_webhook'),

    # Nearby physical testing center lookup helper
    path('dekra/locations/', DEKRALocationsView.as_view(), name='dekra_locations'),
]

