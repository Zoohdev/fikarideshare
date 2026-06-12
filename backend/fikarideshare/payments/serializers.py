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
    """
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'method_type', 'provider', 'display_name',
            'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

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
