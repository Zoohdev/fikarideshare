from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import SupportTicket
from .serializers import SupportTicketSerializer


class SupportTicketListCreateView(generics.ListCreateAPIView):
    """
    File a new support ticket, or list the current user's own tickets.
    """
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
