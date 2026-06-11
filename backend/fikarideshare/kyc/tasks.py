from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from .models import KYCVerification
from .services import KYCManager


@shared_task
def check_pending_verifications():
    """
    Check status of pending verifications.
   
    Polls Onfido for results if webhook hasn't been received.
    Run periodically (e.g., every 5 minutes).
    """
    manager = KYCManager()
   
    # Get verifications that have been in progress for more than 5 minutes
    cutoff = timezone.now() - timedelta(minutes=5)
    pending = KYCVerification.objects.filter(
        status=KYCVerification.Status.IN_PROGRESS,
        provider_check_id__isnull=False,
        updated_at__lt=cutoff
    )
   
    for verification in pending:
        success, result = manager.onfido.get_check_result(
            verification.provider_check_id
        )
       
        if success and result.get('status') == 'complete':
            manager._process_check_result(verification.provider_check_id)


@shared_task
def send_kyc_reminder():
    """
    Send reminders to users with incomplete KYC.
    """
    from users.models import User
    from .tasks_notifications import send_push_notification
   
    # Users who started but didn't complete KYC
    incomplete = User.objects.filter(
        kyc_status='in_progress',
        kyc_verifications__status=KYCVerification.Status.PENDING,
        kyc_verifications__created_at__lt=timezone.now() - timedelta(days=1)
    ).distinct()
   
    for user in incomplete:
        send_push_notification.delay(
            user_id=str(user.id),
            title='Complete Your Verification',
            body='Complete your identity verification to start using the app.',
            data={'action': 'complete_kyc'}
        )

