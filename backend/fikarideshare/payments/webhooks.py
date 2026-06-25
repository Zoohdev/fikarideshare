import logging
from decimal import Decimal

import stripe
from django.conf import settings
from django.http import HttpResponseBadRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Payment
from .services import StripeService

logger = logging.getLogger(__name__)


def _payment_for_intent(intent_id):
    return Payment.objects.filter(provider_payment_intent_id=intent_id).first()


def _handle_amount_capturable_updated(intent):
    """
    Payment intents are created with capture_method='manual', so a card
    that needed 3D-Secure only becomes capturable once the customer
    finishes authenticating with Stripe directly - this event is how we
    find out, and we capture immediately rather than waiting on the
    ride/wallet flow that started the charge.
    """
    payment = _payment_for_intent(intent['id'])
    if not payment or payment.status != Payment.Status.AUTHORIZED:
        return

    success, result = StripeService().capture_payment(intent['id'])
    if success:
        payment.status = Payment.Status.COMPLETED
        payment.provider_charge_id = result.get('charge_id', '')
        payment.completed_at = timezone.now()
        payment.save(update_fields=['status', 'provider_charge_id', 'completed_at'])
    else:
        payment.status = Payment.Status.FAILED
        payment.failure_reason = result.get('error', '')
        payment.save(update_fields=['status', 'failure_reason'])


def _handle_payment_failed(intent):
    payment = _payment_for_intent(intent['id'])
    if not payment:
        return

    last_error = intent.get('last_payment_error') or {}
    payment.status = Payment.Status.FAILED
    payment.failure_reason = last_error.get('message', '')
    payment.failure_code = last_error.get('code') or ''
    payment.save(update_fields=['status', 'failure_reason', 'failure_code'])


def _handle_payment_canceled(intent):
    payment = _payment_for_intent(intent['id'])
    if not payment or payment.status == Payment.Status.COMPLETED:
        return

    payment.status = Payment.Status.CANCELLED
    payment.save(update_fields=['status'])


def _handle_charge_refunded(charge):
    payment = Payment.objects.filter(provider_charge_id=charge['id']).first()
    if not payment:
        return

    payment.refunded_amount = Decimal(charge.get('amount_refunded', 0)) / 100
    payment.status = (
        Payment.Status.REFUNDED if charge.get('refunded')
        else Payment.Status.PARTIALLY_REFUNDED
    )
    payment.save(update_fields=['refunded_amount', 'status'])


def _handle_account_updated(account):
    """
    Fires whenever a driver's Connect Express onboarding state changes -
    this is how `User.payouts_enabled` (checked by DriverPayoutView before
    allowing a withdrawal) gets flipped on, since we never poll Stripe
    directly for it.
    """
    from users.models import User

    User.objects.filter(stripe_connect_account_id=account['id']).update(
        payouts_enabled=bool(account.get('payouts_enabled'))
    )


EVENT_HANDLERS = {
    'payment_intent.amount_capturable_updated': _handle_amount_capturable_updated,
    'payment_intent.payment_failed': _handle_payment_failed,
    'payment_intent.canceled': _handle_payment_canceled,
    'charge.refunded': _handle_charge_refunded,
    'account.updated': _handle_account_updated,
}


@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.warning('Stripe webhook signature verification failed: %s', e)
        return HttpResponseBadRequest('invalid payload or signature')

    handler = EVENT_HANDLERS.get(event['type'])
    if handler:
        handler(event['data']['object'])

    return JsonResponse({'received': True})
