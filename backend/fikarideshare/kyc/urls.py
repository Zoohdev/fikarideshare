from django.urls import path
from .views import KYCSubmitAndStatusView, DriverLicenseSubmitView, KYCWebhookView

urlpatterns = [
    # General Identification Routing
    path('identity/', KYCSubmitAndStatusView.as_view(), name='kyc_identity'),

    # Professional Driving Licensing Routing
    path('license/', DriverLicenseSubmitView.as_view(), name='kyc_driver_license'),

    # Onfido verification result callback webhook endpoint
    path('webhook/', KYCWebhookView.as_view(), name='kyc_webhook'),
]