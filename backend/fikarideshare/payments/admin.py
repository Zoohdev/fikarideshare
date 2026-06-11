from django.contrib import admin
from .models import Wallet, Payment, PaymentMethod, WalletTransaction, DriverPayout

admin.site.register(Wallet)
admin.site.register(Payment)
admin.site.register(PaymentMethod)
admin.site.register(WalletTransaction)
admin.site.register(DriverPayout)
