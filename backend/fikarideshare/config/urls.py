from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

# A simple JSON home status check dictionary view
def api_root_landing(request):
    return JsonResponse({
        "project": "Fika Ride-Share API Engine",
        "status": "online",
        "version": "1.0.0",
        "regions": ["Gauteng, South Africa"]
    }, status=200)

urlpatterns = [
    # Admin Control Panel Dashboard
    path('admin/', admin.site.urls),
   
    # App Module Routing Matrices
    path('api/users/', include('users.urls')),
    path('api/vehicles/', include('vehicles.urls')),
    path('api/kyc/', include('kyc.urls')),
    path('api/rides/', include('rides.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/ratings/', include('ratings.urls')),

    # Core System Fallback / Entry Index Base Point
    path('', api_root_landing, name='api_gateway_index'),
]

# Append media/static file asset pipelines for local development testing
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


