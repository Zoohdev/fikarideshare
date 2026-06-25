from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, PushToken
from .serializers import NotificationSerializer, PushTokenSerializer


class NotificationListView(generics.ListAPIView):
    """Paginated list of the current user's notifications, newest first."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)


class PushTokenRegisterView(APIView):
    """
    Registers (or re-registers) an Expo push token for the current user.
    Upserts on `token` so reinstalling/relogging on the same device doesn't
    create duplicate rows, and reassigns ownership if the same device
    token now belongs to a different logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PushTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token, _ = PushToken.objects.update_or_create(
            token=serializer.validated_data['token'],
            defaults={
                'user': request.user,
                'platform': serializer.validated_data['platform'],
                'is_active': True,
            },
        )
        return Response(PushTokenSerializer(token).data, status=status.HTTP_200_OK)
