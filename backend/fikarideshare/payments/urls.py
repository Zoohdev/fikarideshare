from django.urls import path
from .views import (
    PaymentMethodListCreateView, ProcessPaymentView,
    WalletBalanceAndHistoryView, WalletTopUpView, DriverPayoutView
)

urlpatterns = [
    # Payment Method Profile Controls
    path('methods/', PaymentMethodListCreateView.as_view(), name='payment_methods'),
   
    # Ride Core Processing
    path('charge/', ProcessPaymentView.as_view(), name='process_charge'),
   
    # In-App Wallet Architecture
    path('wallet/', WalletBalanceAndHistoryView.as_view(), name='wallet_ledger'),
    path('wallet/topup/', WalletTopUpView.as_view(), name='wallet_topup'),
   
    # Settled Earning Payout Operations
    path('payouts/', DriverPayoutView.as_view(), name='driver_payouts'),
]