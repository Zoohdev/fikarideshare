import logging
import requests
from celery import shared_task

from .models import PushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_push_notification(self, user_id: str, title: str, body: str, data: dict = None):
    """
    Sends a push to every active Expo push token registered for a user.
    Best-effort: a push provider failure shouldn't break the in-app
    notification that already got saved by create_notification().
    """
    tokens = list(PushToken.objects.filter(user_id=user_id, is_active=True))
    if not tokens:
        return

    messages = [
        {
            'to': t.token,
            'title': title,
            'body': body,
            'data': data or {},
        }
        for t in tokens
    ]

    try:
        response = requests.post(EXPO_PUSH_URL, json=messages, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.warning('Expo push send failed: %s', e)
        raise self.retry(exc=e)

    results = response.json().get('data', [])
    dead_token_ids = []
    for token_obj, result in zip(tokens, results):
        if result.get('status') == 'error' and result.get('details', {}).get('error') == 'DeviceNotRegistered':
            dead_token_ids.append(token_obj.id)

    if dead_token_ids:
        PushToken.objects.filter(id__in=dead_token_ids).update(is_active=False)
