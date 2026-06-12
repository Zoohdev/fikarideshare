from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal
from .models import PaymentMethod, Payment, DriverPayout, Wallet, WalletTransaction
from .serializers import (
    PaymentMethodSerializer, PaymentSerializer,
    WalletSerializer, DriverPayoutSerializer
)

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
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProcessPaymentView(APIView):
    """
    Creates a transaction entry for an authorized ride fare calculation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Business logic: Calculate your platform cut (e.g., 20% commission tier)
            total_amount = serializer.validated_data['amount']
            platform_fee = (total_amount * Decimal('0.20')).quantize(Decimal('0.01'))
            driver_earnings = total_amount - platform_fee

            payment = serializer.save(
                user=request.user,
                platform_fee=platform_fee,
                driver_earnings=driver_earnings,
                status=Payment.Status.PENDING
            )

            # --- GATEWAY INTEGRATION ENGINE DISPATCH ---
            # run_payment_intent_charge.delay(payment.id)

            return Response(
                {
                    "message": "Payment processing transaction initialized.",
                    "payment_id": payment.id,
                    "status": payment.status
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
                description="In-app balance top-up payment success."
            )

        return Response(
            {"message": "Wallet funded successfully.", "new_balance": str(wallet.balance)},
            status=status.HTTP_200_OK
        )


class DriverPayoutView(APIView):
    """
    Batch tracking endpoints to aggregate earnings for fleet drivers.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Enforce that only driver type user models can invoke withdrawals
        if getattr(request.user, 'user_type', None) != 'driver':
            return Response({"error": "Payout request restricted to driver accounts."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DriverPayoutSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            payout = serializer.save(driver=request.user, status=DriverPayout.Status.PENDING)
            return Response(
                {
                    "message": "Payout instruction queued for clearing verification processing.",
                    "payout_id": payout.id,
                    "status": payout.status
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
