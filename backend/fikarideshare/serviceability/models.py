from django.db import models

# Create your models here.
from django.contrib.gis.db import models
import uuid

class OperationalCity(models.Model):
    city_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city_name = models.CharField(max_length=100, unique=True)
    geom_polygon = models.PolygonField(srid=4326) 
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Operational Cities"

    def __str__(self):
        return self.city_name

class ServiceableZone(models.Model):
    zone_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city = models.ForeignKey(OperationalCity, on_delete=models.CASCADE, related_name='zones')
    zone_label = models.CharField(max_length=150)
    geom_polygon = models.PolygonField(srid=4326)
    is_serviceable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.city.city_name} - {self.zone_label}"