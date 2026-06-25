from django.urls import path
from .views import (
    PaymentMethodListCreateView, ProcessPaymentView,
    WalletBalanceAndHistoryView, WalletTopUpView, DriverPayoutView,
    ConnectOnboardingView, ConnectStatusView
)
from .webhooks import stripe_webhook

urlpatterns = [
    # Payment Method Profile Controls
    path('methods/', PaymentMethodListCreateView.as_view(), name='payment_methods'),

    # Ride Core Processing
    path('charge/', ProcessPaymentView.as_view(), name='process_charge'),

    # Stripe webhook (signature-verified, no auth - called by Stripe itself)
    path('webhook/', stripe_webhook, name='stripe_webhook'),

    # In-App Wallet Architecture
    path('wallet/', WalletBalanceAndHistoryView.as_view(), name='wallet_ledger'),
    path('wallet/topup/', WalletTopUpView.as_view(), name='wallet_topup'),

    # Settled Earning Payout Operations
    path('payouts/', DriverPayoutView.as_view(), name='driver_payouts'),

    # Driver Stripe Connect onboarding (hosted by Stripe - we never collect
    # raw bank account details ourselves)
    path('connect/onboard/', ConnectOnboardingView.as_view(), name='connect_onboard'),
    path('connect/status/', ConnectStatusView.as_view(), name='connect_status'),
]