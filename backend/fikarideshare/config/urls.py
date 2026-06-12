from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django Administration Dashboard 
    path('admin/', admin.site.urls),

    # Core Application API Gateway Routes
    path('api/users/', include('users.urls')),
    path('api/vehicles/', include('vehicles.urls')),
    path('api/kyc/', include('kyc.urls')),
    path('api/rides/', include('rides.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/ratings/', include('ratings.urls')),
]

# This ensures Django can serve uploaded profile media files (ID pictures, licenses) during local development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

