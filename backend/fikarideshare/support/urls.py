from django.urls import path
from .views import SupportTicketListCreateView

app_name = 'support'

urlpatterns = [
    path('tickets/', SupportTicketListCreateView.as_view(), name='support_tickets'),
]
