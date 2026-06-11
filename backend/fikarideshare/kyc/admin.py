from django.contrib import admin
from .models import KYCDocument, KYCVerification, DriverLicense

admin.site.register(KYCDocument)
admin.site.register(KYCVerification)
admin.site.register(DriverLicense)
