from django.urls import path
from .views import KYCSubmitAndStatusView, DriverLicenseSubmitView

urlpatterns = [
    # General Identification Routing
    path('identity/', KYCSubmitAndStatusView.as_view(), name='kyc_identity'),
   
    # Professional Driving Licensing Routing
    path('license/', DriverLicenseSubmitView.as_view(), name='kyc_driver_license'),
]