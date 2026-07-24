from django.urls import path
from .views import check_serviceability

urlpatterns = [
    path('check/', check_serviceability, name='check-serviceability'),
]