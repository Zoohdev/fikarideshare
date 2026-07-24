from django.contrib import admin

# Register your models here.
from django.contrib.gis import admin
from .models import OperationalCity, ServiceableZone

@admin.register(OperationalCity)
class OperationalCityAdmin(admin.GISModelAdmin):
    list_display = ('city_name', 'is_active')
    search_fields = ('city_name',)

@admin.register(ServiceableZone)
class ServiceableZoneAdmin(admin.GISModelAdmin):
    list_display = ('zone_label', 'city', 'is_serviceable')
    list_filter = ('is_serviceable', 'city')
    search_fields = ('zone_label',)