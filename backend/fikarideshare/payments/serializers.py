from rest_framework import serializers
from .models import Wallet, PaymentMethod, Payment, DriverPayout

class WalletSerializer(serializers.ModelSerializer):
    """
    Serializer to display a user's current running wallet balance.
    Strictly read-only to prevent balance-tampering via raw API requests.
    """
    currency = serializers.CharField(default="KES")

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'frozen_balance', 'currency', 'updated_at']
        read_only_fields = ['id', 'balance', 'frozen_balance', 'updated_at']


class PaymentMethodSerializer(serializers.ModelSerializer):
    """
    Serializer for managing saved funding profiles (Cards, Mobile Money, etc.).

    For cards, the client creates a Stripe PaymentMethod via the Stripe SDK
    (CardField + createPaymentMethod) and sends only the resulting
    provider_payment_method_id ("pm_..."). The view attaches it to the
    user's Stripe customer and fills in display_name/last_four/brand/
    expiry_* from Stripe's own response - those are never trusted from
    the client.
    """
    provider_payment_method_id = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'method_type', 'provider', 'display_name',
            'last_four', 'brand', 'expiry_month', 'expiry_year',
            'is_default', 'created_at', 'provider_payment_method_id',
        ]
        read_only_fields = [
            'id', 'display_name', 'last_four', 'brand',
            'expiry_month', 'expiry_year', 'created_at',
        ]

    def validate(self, attrs):
        method_type = attrs.get('method_type')
        provider = attrs.get('provider')

        if method_type == 'mobile_money' and not provider:
            raise serializers.ValidationError(
                {"provider": "Provider (e.g., MPESA, AIRTEL) is required for mobile money accounts."}
            )
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    """
    Detailed audit log serializer tracking payment flows tied to individual trips.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_method', 'amount', 'currency',
            'status', 'status_display', 'platform_fee', 'driver_earnings',
            'failure_reason', 'completed_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'status', 'status_display', 'platform_fee',
            'driver_earnings', 'failure_reason', 'completed_at', 'created_at'
        ]


class DriverPayoutSerializer(serializers.ModelSerializer):
    """
    Serializer to validate and track batch payout distributions for drivers.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DriverPayout
        fields = ['id', 'amount', 'currency', 'status', 'status_display', 'created_at']
        read_only_fields = ['id', 'status', 'status_display', 'created_at']


class InitiatePaymentSerializer(serializers.Serializer):
    """
    Inbound request validation payload used when triggering a checkout handshake.
    """
    ride_id = serializers.UUIDField(required=True)
    payment_method_id = serializers.UUIDField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)


class WalletTopUpSerializer(serializers.Serializer):
    """
    Payload configuration layout used when loading digital funds into a wallet app shell.
    """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=5.00)
    phone_number = serializers.CharField(required=False, help_text="For SIM toolkit STK Push prompts.")
