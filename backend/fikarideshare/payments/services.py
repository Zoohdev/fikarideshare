

import stripe
from decimal import Decimal
from typing import Dict, Tuple, Optional
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Payment, PaymentMethod, Wallet, WalletTransaction, DriverPayout
from users.models import User
from rides.models import Ride


stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """
    Service for Stripe payment integration.
   
    Handles:
    - Customer creation
    - Payment method attachment
    - Payment intents
    - Transfers to drivers
    """
   
    def create_customer(self, user: User) -> Tuple[bool, str]:
        """
        Create a Stripe customer for a user.
        """
        try:
            # Fallback if full_name attribute isn't explicitly defined as a property
            full_name = getattr(user, 'full_name', f"{user.first_name} {user.last_name}".strip())
           
            customer = stripe.Customer.create(
                email=user.email,
                name=full_name,
                phone=str(user.phone_number),
                metadata={
                    'user_id': str(user.id),
                }
            )
            return True, customer.id
        except stripe.error.StripeError as e:
            return False, str(e)
   
    def attach_payment_method(
        self,
        user: User,
        payment_method_id: str
    ) -> Tuple[bool, Dict]:
        """
        Attach a payment method to a customer.
        """
        try:
            # FIX: Use getattr defensively since standard Django model instances
            # won't have stripe_customer_id until dynamically added or model-extended.
            customer_id = getattr(user, 'stripe_customer_id', None)
           
            if not customer_id:
                success, new_customer_id = self.create_customer(user)
                if not success:
                    return False, {'error': new_customer_id}
                user.stripe_customer_id = new_customer_id
                user.save(update_fields=['stripe_customer_id'])
                customer_id = new_customer_id
           
            # Attach payment method to customer
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id,
            )
           
            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    'default_payment_method': payment_method_id,
                }
            )
           
            return True, {
                'id': payment_method.id,
                'type': payment_method.type,
                'card': {
                    'brand': payment_method.card.brand,
                    'last4': payment_method.card.last4,
                    'exp_month': payment_method.card.exp_month,
                    'exp_year': payment_method.card.exp_year,
                }
            }
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}
   
    def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        customer_id: str,
        payment_method_id: str,
        metadata: Dict = None
    ) -> Tuple[bool, Dict]:
        """
        Create a payment intent for a ride.
        Uses manual capture to authorize first, then capture after ride.
        """
        try:
            amount_cents = int(amount * 100)
           
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                customer=customer_id,
                payment_method=payment_method_id,
                capture_method='manual',  # Authorize only, capture later
                confirm=True,
                metadata=metadata or {},
                return_url='rideshare://payment-complete',  # For 3D Secure
            )
           
            return True, {
                'id': intent.id,
                'status': intent.status,
                'client_secret': intent.client_secret,
            }
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}
   
    def capture_payment(
        self,
        payment_intent_id: str,
        amount: Decimal = None
    ) -> Tuple[bool, Dict]:
        """
        Capture an authorized payment.
        """
        try:
            capture_params = {}
            if amount is not None:
                capture_params['amount_to_capture'] = int(amount * 100)
           
            intent = stripe.PaymentIntent.capture(
                payment_intent_id,
                **capture_params
            )
           
            # FIX: Stripe returns latest_charge or charges array depending on API version.
            # We fetch safely to ensure charge_id is extracted.
            charge_id = getattr(intent, 'latest_charge', '')
           
            return True, {
                'id': intent.id,
                'status': intent.status,
                'charge_id': charge_id,
                'amount_captured': Decimal(intent.amount_received) / 100,
            }
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}
   
    def cancel_payment(self, payment_intent_id: str) -> Tuple[bool, Dict]:
        """Cancel an uncaptured payment intent."""
        try:
            intent = stripe.PaymentIntent.cancel(payment_intent_id)
            return True, {'id': intent.id, 'status': intent.status}
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}
   
    def refund_payment(
        self,
        payment_intent_id: str,
        amount: Decimal = None,
        reason: str = 'requested_by_customer'
    ) -> Tuple[bool, Dict]:
        """
        Refund a captured payment.
        """
        try:
            refund_params = {
                'payment_intent': payment_intent_id,
                'reason': reason,
            }
            if amount is not None:
                refund_params['amount'] = int(amount * 100)
           
            refund = stripe.Refund.create(**refund_params)
           
            return True, {
                'id': refund.id,
                'status': refund.status,
                'amount': Decimal(refund.amount) / 100,
            }
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}
   
    def create_connect_account(self, driver: User) -> Tuple[bool, Dict]:
        """
        Create a Stripe Connect account for a driver.
        """
        try:
            account = stripe.Account.create(
                type='express',
                country='US',
                email=driver.email,
                capabilities={
                    'transfers': {'requested': True},
                },
                business_type='individual',
                metadata={
                    'user_id': str(driver.id),
                }
            )
           
            account_link = stripe.AccountLink.create(
                account=account.id,
                refresh_url='rideshare://connect-refresh',
                return_url='rideshare://connect-complete',
                type='account_onboarding',
            )

            return True, {
                'account_id': account.id,
                'onboarding_url': account_link.url,
            }
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}

    def create_account_link(self, connect_account_id: str) -> Tuple[bool, Dict]:
        """
        Get a fresh onboarding link for an existing Connect account - used
        when a driver already has an account (e.g. a previous link expired
        or they didn't finish onboarding) so we don't create a duplicate
        Stripe account every time they retry.
        """
        try:
            account_link = stripe.AccountLink.create(
                account=connect_account_id,
                refresh_url='rideshare://connect-refresh',
                return_url='rideshare://connect-complete',
                type='account_onboarding',
            )
            return True, {'onboarding_url': account_link.url}
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}

    def transfer_to_driver(
        self,
        amount: Decimal,
        currency: str,
        driver_account_id: str,
        metadata: Dict = None
    ) -> Tuple[bool, Dict]:
        """
        Transfer funds to a driver's Connect account.
        """
        try:
            transfer = stripe.Transfer.create(
                amount=int(amount * 100),
                currency=currency.lower(),
                destination=driver_account_id,
                metadata=metadata or {},
            )
           
            return True, {
                'id': transfer.id,
                'amount': Decimal(transfer.amount) / 100,
            }
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}


class PaymentService:
    """
    High-level payment service for ride transactions.
    """
   
    def __init__(self):
        self.stripe = StripeService()
   
    @transaction.atomic
    def authorize_ride_payment(
        self,
        ride: Ride,
        payment_method: PaymentMethod
    ) -> Tuple[bool, Dict]:
        """
        Authorize payment for a ride (before ride starts).
        """
        payment = Payment.objects.create(
            user=ride.rider,
            payment_method=payment_method,
            amount=ride.estimated_fare,
            currency='USD',
            status=Payment.Status.PENDING,
            description=f'Ride {ride.id}',
            metadata={'ride_id': str(ride.id)},
        )
       
        success, result = self.stripe.create_payment_intent(
            amount=ride.estimated_fare,
            currency='USD',
            customer_id=getattr(ride.rider, 'stripe_customer_id', ''),
            payment_method_id=payment_method.provider_payment_method_id,
            metadata={
                'ride_id': str(ride.id),
                'payment_id': str(payment.id),
            }
        )
       
        if not success:
            payment.status = Payment.Status.FAILED
            payment.failure_reason = result.get('error', '')
            payment.save(update_fields=['status', 'failure_reason'])
            return False, result
       
        payment.provider_payment_intent_id = result['id']
        payment.status = Payment.Status.AUTHORIZED
        payment.save(update_fields=['provider_payment_intent_id', 'status'])
       
        ride.payment = payment
        ride.save(update_fields=['payment'])
       
        return True, {
            'payment_id': str(payment.id),
            'status': payment.status,
            'client_secret': result['client_secret'],
        }
   
    @transaction.atomic
    def complete_ride_payment(self, ride: Ride) -> Tuple[bool, Dict]:
        """
        Capture payment after ride is completed.
        """
        if not ride.payment:
            return False, {'error': 'No payment associated with ride'}
       
        payment = ride.payment
        final_amount = ride.final_fare or ride.estimated_fare
       
        success, result = self.stripe.capture_payment(
            payment_intent_id=payment.provider_payment_intent_id,
            amount=final_amount
        )
       
        if not success:
            payment.status = Payment.Status.FAILED
            payment.failure_reason = result.get('error', '')
            payment.save(update_fields=['status', 'failure_reason'])
            return False, result
       
        payment.amount = final_amount
        payment.status = Payment.Status.COMPLETED
        payment.completed_at = timezone.now()
        payment.provider_charge_id = result.get('charge_id', '')
       
        # Safe structural import loops
        try:
            from rides.services.pricing import PricingService
            pricing = PricingService()
            commission_rate = pricing.PLATFORM_COMMISSION
        except (ImportError, AttributeError):
            commission_rate = Decimal('0.20')  # Fallback to standard 20%
       
        payment.platform_fee = (final_amount * commission_rate).quantize(Decimal('0.01'))
        payment.driver_earnings = final_amount - payment.platform_fee
        payment.save()
       
        # Trigger async worker payload
        try:
            from .tasks import process_driver_payout
            process_driver_payout.delay(str(ride.id))
        except ImportError:
            pass  # Fallback gracefully if Celery workers aren't configured yet
       
        return True, {
            'payment_id': str(payment.id),
            'amount': float(payment.amount),
            'status': payment.status,
        }
   
    # FIX: Completed the broken/truncated cancel_ride_payment service block cleanly
    @transaction.atomic
    def cancel_ride_payment(
        self,
        ride: Ride,
        apply_cancellation_fee: bool = False
    ) -> Tuple[bool, Dict]:
        """
        Cancel or partially capture an authorized payment if a ride is cancelled.
        """
        if not ride.payment:
            return False, {'error': 'No payment execution tracking found for this ride record.'}
       
        payment = ride.payment
       
        if payment.status != Payment.Status.AUTHORIZED:
            return False, {'error': f'Cannot cancel payment with active status: {payment.status}'}
       
        if apply_cancellation_fee:
            # If the rider cancels late, capture just the penalty amount (e.g., $5.00)
            cancellation_fee = Decimal('5.00')
            success, result = self.stripe.capture_payment(
                payment_intent_id=payment.provider_payment_intent_id,
                amount=cancellation_fee
            )
           
            if not success:
                payment.status = Payment.Status.FAILED
                payment.failure_reason = result.get('error', '')
                payment.save(update_fields=['status', 'failure_reason'])
                return False, result
               
            payment.amount = cancellation_fee
            payment.status = Payment.Status.COMPLETED
            payment.completed_at = timezone.now()
            payment.save()
           
            return True, {
                'payment_id': str(payment.id),
                'status': 'cancellation_fee_charged',
                'amount': float(cancellation_fee)
            }
        else:
            # Full release of funds (Zero penalty cancellation)
            success, result = self.stripe.cancel_payment(payment.provider_payment_intent_id)
           
            if not success:
                return False, result
               
            payment.status = Payment.Status.CANCELLED
            payment.save(update_fields=['status'])
           
            return True, {
                'payment_id': str(payment.id),
                'status': payment.status
            }

    @transaction.atomic
    def charge_saved_card(
        self,
        user: User,
        amount: Decimal,
        currency: str = 'USD',
        description: str = '',
        metadata: Dict = None,
    ) -> Tuple[bool, Dict]:
        """
        Authorize-then-immediately-capture the user's default saved card.

        This is the ad-hoc charge path used by ride fare payment and wallet
        top-up (neither is threaded through the ride-lifecycle
        authorize/complete/cancel_ride_payment methods above, which depend
        on a `ride.payment` FK that doesn't exist on the current Ride model).
        """
        payment_method = PaymentMethod.objects.filter(
            user=user, is_active=True, is_default=True
        ).first()

        if not payment_method:
            return False, {'error': 'No saved payment method on file. Add a card first.'}

        customer_id = getattr(user, 'stripe_customer_id', None)
        if not customer_id:
            return False, {'error': 'No Stripe customer on file. Add a card first.'}

        payment = Payment.objects.create(
            user=user,
            payment_method=payment_method,
            amount=amount,
            currency=currency,
            status=Payment.Status.PENDING,
            description=description,
            metadata=metadata or {},
        )

        success, result = self.stripe.create_payment_intent(
            amount=amount,
            currency=currency,
            customer_id=customer_id,
            payment_method_id=payment_method.provider_payment_method_id,
            metadata=metadata or {},
        )

        if not success:
            payment.status = Payment.Status.FAILED
            payment.failure_reason = result.get('error', '')
            payment.save(update_fields=['status', 'failure_reason'])
            return False, result

        payment.provider_payment_intent_id = result['id']

        if result['status'] == 'requires_action':
            payment.status = Payment.Status.AUTHORIZED
            payment.save(update_fields=['provider_payment_intent_id', 'status'])
            return True, {
                'payment_id': str(payment.id),
                'status': payment.status,
                'requires_action': True,
                'client_secret': result['client_secret'],
            }

        capture_success, capture_result = self.stripe.capture_payment(result['id'])

        if not capture_success:
            payment.status = Payment.Status.AUTHORIZED
            payment.failure_reason = capture_result.get('error', '')
            payment.save(update_fields=['status', 'failure_reason'])
            return False, capture_result

        payment.status = Payment.Status.COMPLETED
        payment.provider_charge_id = capture_result.get('charge_id', '')
        payment.completed_at = timezone.now()
        payment.save(update_fields=['status', 'provider_charge_id', 'completed_at'])

        from notifications.services import create_notification
        create_notification(
            user=user,
            notification_type='payment_completed',
            title='Payment successful',
            body=f'{currency} {amount} - {description or "payment"} completed.',
            data={'payment_id': str(payment.id)},
        )

        return True, {
            'payment_id': str(payment.id),
            'status': payment.status,
            'requires_action': False,
        }


