from django.contrib import admin
from .models import User, BiometricData

admin.site.register(User)
admin.site.register(BiometricData)