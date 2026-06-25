from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import PaymentMethod, Payment, DriverPayout, Wallet, WalletTransaction
from .serializers import (
    PaymentMethodSerializer, PaymentSerializer,
    WalletSerializer, DriverPayoutSerializer, WalletTransactionSerializer
)
from .services import StripeService, PaymentService

class PaymentMethodListCreateView(APIView):
    """
    List saved customer profiles or append a newly vaulted token profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        methods = PaymentMethod.objects.filter(user=request.user, is_active=True)
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PaymentMethodSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        provider_payment_method_id = validated.pop('provider_payment_method_id')
        method_type = validated.get('method_type', PaymentMethod.MethodType.CARD)

        if method_type != PaymentMethod.MethodType.CARD:
            return Response(
                {"error": "Only card payment methods can be added right now."},
                status=status.HTTP_400_BAD_REQUEST
            )

        success, result = StripeService().attach_payment_method(request.user, provider_payment_method_id)
        if not success:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        card = result.get('card', {})

        # Default to making the first card the default; otherwise respect the request.
        is_default = validated.get('is_default')
        if is_default is None:
            is_default = not PaymentMethod.objects.filter(user=request.user, is_active=True).exists()
        if is_default:
            PaymentMethod.objects.filter(
                user=request.user, is_active=True, is_default=True
            ).update(is_default=False)

        payment_method = PaymentMethod.objects.create(
            user=request.user,
            method_type=method_type,
            provider='stripe',
            provider_payment_method_id=result['id'],
            display_name=f"{card.get('brand', 'Card').title()} ending in {card.get('last4', '')}",
            last_four=card.get('last4', ''),
            brand=card.get('brand', ''),
            expiry_month=card.get('exp_month'),
            expiry_year=card.get('exp_year'),
            is_default=is_default,
            is_verified=True,
        )

        return Response(
            PaymentMethodSerializer(payment_method).data,
            status=status.HTTP_201_CREATED
        )


class ProcessPaymentView(APIView):
    """
    Charges the rider's default saved card for a ride fare (or any ad-hoc
    amount), via Stripe - authorize and capture in one step.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount_raw = request.data.get('amount')
        currency = request.data.get('currency', 'USD')
        ride_id = request.data.get('ride_id')

        if ride_id:
            # Shared-ride participants (including the organizer) are now
            # auto-charged their own fare share the moment the ride
            # completes (RideViewSet.CompleteRideView) - if the caller's
            # app still shows a "Proceed to Payment" button from before
            # that finished, don't charge them a second time.
            from rides.models import RideParticipant
            already_paid = RideParticipant.objects.filter(
                ride_id=ride_id, user=request.user, payment_status='paid'
            ).exists()
            if already_paid:
                return Response(
                    {"message": "Already paid for this ride."},
                    status=status.HTTP_200_OK
                )

        if not amount_raw:
            return Response({"error": "amount is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = Decimal(str(amount_raw))
        except Exception:
            return Response({"error": "amount must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({"error": "amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        success, result = PaymentService().charge_saved_card(
            user=request.user,
            amount=amount,
            currency=currency,
            description=f"Ride payment{f' for {ride_id}' if ride_id else ''}",
            metadata={'ride_id': str(ride_id)} if ride_id else {},
        )

        if not success:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        if result.get('requires_action'):
            return Response(
                {"message": "Additional authentication required.", **result},
                status=status.HTTP_202_ACCEPTED
            )

        return Response(
            {"message": "Payment captured.", **result},
            status=status.HTTP_200_OK
        )


class WalletBalanceAndHistoryView(APIView):
    """
    Retrieves ledger transactions and running totals for user balances.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(
            user=request.user,
            defaults={'currency': 'KES'} # Adapting to regional currency operations
        )
        data = WalletSerializer(wallet).data
        data['transactions'] = WalletTransactionSerializer(
            wallet.transactions.all()[:50], many=True
        ).data
        return Response(data, status=status.HTTP_200_OK)


class WalletTopUpView(APIView):
    """
    Executes transaction tracking to top up in-app wallet storage balances.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount_str = request.data.get('amount')
        if not amount_str or Decimal(amount_str) <= 0:
            return Response({"error": "A positive value amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(amount_str)

        success, result = PaymentService().charge_saved_card(
            user=request.user,
            amount=amount,
            currency='USD',
            description='Wallet top-up',
            metadata={'purpose': 'wallet_topup'},
        )

        if not success:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        if result.get('requires_action'):
            return Response(
                {"message": "Additional authentication required.", **result},
                status=status.HTTP_202_ACCEPTED
            )

        with transaction.atomic():
            wallet, created = Wallet.objects.select_for_update().get_or_create(user=request.user)
            wallet.balance += amount
            wallet.save()

            txn = WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type=WalletTransaction.TransactionType.CREDIT,
                source=WalletTransaction.Source.TOPUP,
                amount=amount,
                balance_after=wallet.balance,
                reference_id=result['payment_id'],
                description="In-app balance top-up payment success."
            )

        return Response(
            {"message": "Wallet funded successfully.", "new_balance": str(wallet.balance)},
            status=status.HTTP_200_OK
        )


class DriverPayoutView(APIView):
    """
    Driver-initiated withdrawal of earnings to their Stripe Connect account.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        driver = request.user
        if getattr(driver, 'user_type', None) not in ('driver', 'both'):
            return Response({"error": "Payout request restricted to driver accounts."}, status=status.HTTP_403_FORBIDDEN)

        if not driver.stripe_connect_account_id or not driver.payouts_enabled:
            return Response(
                {"error": "Set up payouts (Stripe Connect onboarding) before requesting a withdrawal."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DriverPayoutSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        payout = serializer.save(driver=driver, status=DriverPayout.Status.PROCESSING)

        success, result = StripeService().transfer_to_driver(
            amount=payout.amount,
            currency=payout.currency,
            driver_account_id=driver.stripe_connect_account_id,
            metadata={'payout_id': str(payout.id)},
        )

        if not success:
            payout.status = DriverPayout.Status.FAILED
            payout.save(update_fields=['status'])
            return Response(
                {"error": result.get('error', 'Transfer failed.'), "payout_id": payout.id, "status": payout.status},
                status=status.HTTP_400_BAD_REQUEST
            )

        payout.status = DriverPayout.Status.COMPLETED
        payout.provider_payout_id = result['id']
        payout.processed_at = timezone.now()
        payout.save(update_fields=['status', 'provider_payout_id', 'processed_at'])

        from notifications.services import create_notification
        create_notification(
            user=driver,
            notification_type='payout_completed',
            title='Payout sent',
            body=f'{payout.currency} {payout.amount} sent to your bank account.',
            data={'payout_id': str(payout.id)},
        )

        return Response(
            {
                "message": "Payout sent to your bank account.",
                "payout_id": payout.id,
                "status": payout.status
            },
            status=status.HTTP_201_CREATED
        )


class ConnectOnboardingView(APIView):
    """
    Starts (or resumes) Stripe Connect Express onboarding for a driver, so
    Stripe's own hosted flow collects banking details - we never see or
    store raw bank account numbers ourselves.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        driver = request.user
        if getattr(driver, 'user_type', None) not in ('driver', 'both'):
            return Response({"error": "Payout onboarding is for driver accounts."}, status=status.HTTP_403_FORBIDDEN)

        stripe_service = StripeService()

        if driver.stripe_connect_account_id:
            success, result = stripe_service.create_account_link(driver.stripe_connect_account_id)
        else:
            success, result = stripe_service.create_connect_account(driver)
            if success:
                driver.stripe_connect_account_id = result['account_id']
                driver.save(update_fields=['stripe_connect_account_id'])

        if not success:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response({"onboarding_url": result['onboarding_url']}, status=status.HTTP_200_OK)


class ConnectStatusView(APIView):
    """
    Whether the driver has a Connect account and can currently receive
    payouts. `payouts_enabled` is kept in sync by the `account.updated`
    handler in payments/webhooks.py, not checked live against Stripe here.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        driver = request.user
        return Response({
            "onboarded": bool(driver.stripe_connect_account_id),
            "payouts_enabled": driver.payouts_enabled,
        }, status=status.HTTP_200_OK)
