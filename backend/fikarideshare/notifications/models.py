import uuid
from django.db import models


class Notification(models.Model):
    """
    In-app notification feed. No push delivery (Expo/FCM/APNs) yet - this
    is just a real backed list to replace notificationsScreen.js's
    hardcoded array.
    """

    class NotificationType(models.TextChoices):
        RIDE_ACCEPTED = 'ride_accepted', 'Ride Accepted'
        RIDE_COMPLETED = 'ride_completed', 'Ride Completed'
        RIDE_CANCELLED = 'ride_cancelled', 'Ride Cancelled'
        PAYMENT_COMPLETED = 'payment_completed', 'Payment Completed'
        PAYOUT_COMPLETED = 'payout_completed', 'Payout Completed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f'{self.user.email} - {self.title}'


class PushToken(models.Model):
    """
    Expo push tokens registered by the mobile app. One row per
    device/install - a user can have several (multiple devices).
    """

    class Platform(models.TextChoices):
        IOS = 'ios', 'iOS'
        ANDROID = 'android', 'Android'
        WEB = 'web', 'Web'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='push_tokens'
    )

    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'push_tokens'
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f'{self.user.email} - {self.platform} - {self.token[:20]}...'
