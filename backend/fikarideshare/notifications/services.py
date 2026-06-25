from typing import Dict, Optional
from .models import Notification


def create_notification(user, notification_type: str, title: str, body: str = '', data: Optional[Dict] = None) -> Notification:
    """
    Single entry point for producing a notification. Called from the few
    existing flows that should generate one (ride accepted, ride
    completed/cancelled, payment completed, payout completed). Persists
    the in-app row, then enqueues a best-effort push via Celery - none of
    the call sites need to change to pick this up.
    """
    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        body=body,
        data=data or {},
    )

    from .tasks import send_push_notification
    send_push_notification.delay(str(user.id), title, body, data or {})

    return notification
