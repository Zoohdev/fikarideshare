import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator


class PaymentMethod(models.Model):
    """
    Stored payment methods for users (cards, mobile money, etc.).
    Sensitive data stored with payment provider, only tokens stored here.
    """
   
    class MethodType(models.TextChoices):
        CARD = 'card', 'Credit/Debit Card'
        MOBILE_MONEY = 'mobile_money', 'Mobile Money'
        BANK_ACCOUNT = 'bank_account', 'Bank Account'
        WALLET = 'wallet', 'In-App Wallet'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )
   
    method_type = models.CharField(max_length=20, choices=MethodType.choices)
   
    # Provider reference (Stripe payment method ID, etc.)
    provider = models.CharField(max_length=50, default='stripe')
    provider_payment_method_id = models.CharField(max_length=100)
   
    # Display info (non-sensitive)
    display_name = models.CharField(max_length=100)  # e.g., "Visa ending in 4242"
    last_four = models.CharField(max_length=4, blank=True)
    brand = models.CharField(max_length=50, blank=True)  # visa, mastercard, etc.
    expiry_month = models.PositiveIntegerField(null=True, blank=True)
    expiry_year = models.PositiveIntegerField(null=True, blank=True)
   
    # Status
    is_default = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    class Meta:
        db_table = 'payment_methods'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['provider_payment_method_id']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_default=True, is_active=True),
                name='unique_default_payment_method'
            )
        ]
   
    def __str__(self):
        return f'{self.user.email} - {self.display_name}'


class Payment(models.Model):
    """
    Payment transactions for rides.
    Tracks the full lifecycle of a payment.
    """
   
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        AUTHORIZED = 'authorized', 'Authorized'
        CAPTURED = 'captured', 'Captured'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
        PARTIALLY_REFUNDED = 'partially_refunded', 'Partially Refunded'
        CANCELLED = 'cancelled', 'Cancelled'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
   
    # User and payment method
    user = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='payments'
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
   
    # Amount details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='USD')
   
    # Fees breakdown
    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    driver_earnings = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
   
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
   
    # Provider references
    provider = models.CharField(max_length=50, default='stripe')
    provider_payment_intent_id = models.CharField(max_length=100, blank=True)
    provider_charge_id = models.CharField(max_length=100, blank=True)
    provider_transfer_id = models.CharField(max_length=100, blank=True)
   
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
   
    # Failure info
    failure_reason = models.TextField(blank=True)
    failure_code = models.CharField(max_length=50, blank=True)
   
    # Refund tracking
    refunded_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
   
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['provider_payment_intent_id']),
            models.Index(fields=['status', 'created_at']),
        ]
   
    def __str__(self):
        return f'Payment {self.id} - {self.amount} {self.currency} ({self.status})'


class DriverPayout(models.Model):
    """
    Payout records for driver earnings.
    Batch payouts processed periodically.
    """
   
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='payouts'
    )
   
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='USD')
   
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
   
    # Rides included in this payout
    rides = models.ManyToManyField('rides.Ride', related_name='payouts')
   
    # Provider reference
    provider_payout_id = models.CharField(max_length=100, blank=True)
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
   
    class Meta:
        db_table = 'driver_payouts'
        ordering = ['-created_at']


class Wallet(models.Model):
    """
    In-app wallet for users.
    Can be used for payments and receiving refunds.
    """
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='wallet'
    )
   
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    currency = models.CharField(max_length=3, default='USD')
   
    # Frozen balance (held for pending transactions)
    frozen_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    class Meta:
        db_table = 'wallets'
   
    @property
    def available_balance(self):
        return self.balance - self.frozen_balance
   
    def __str__(self):
        return f'{self.user.email} - {self.balance} {self.currency}'


class WalletTransaction(models.Model):
    """
    Transaction history for wallet operations.
    """
   
    class TransactionType(models.TextChoices):
        CREDIT = 'credit', 'Credit'
        DEBIT = 'debit', 'Debit'
        HOLD = 'hold', 'Hold'
        RELEASE = 'release', 'Release'
   
    class Source(models.TextChoices):
        TOPUP = 'topup', 'Top Up'
        RIDE_PAYMENT = 'ride_payment', 'Ride Payment'
        REFUND = 'refund', 'Refund'
        PROMOTION = 'promotion', 'Promotion'
        REFERRAL = 'referral', 'Referral Bonus'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
   
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    source = models.CharField(max_length=20, choices=Source.choices)
   
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
   
    reference_id = models.CharField(max_length=100, blank=True)  # Related payment/ride ID
    description = models.TextField(blank=True)
   
    created_at = models.DateTimeField(auto_now_add=True)
   
    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']

