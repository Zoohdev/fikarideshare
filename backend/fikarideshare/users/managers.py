from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance as GeoDistance

# A driver is only considered matchable if their last location ping is
# within this window. is_online alone isn't enough: it's reset on a clean
# socket disconnect (see LocationConsumer.disconnect), but a hard dyno
# kill/crash can drop the socket without running disconnect, leaving
# is_online=True with a location hours stale. Requiring a recent ping means
# we never dispatch a ride to a driver whose app is actually gone.
DRIVER_STALE_AFTER_SECONDS = 300


class UserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """
    def create_user(self, email, phone_number, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not phone_number:
            raise ValueError('The Phone Number field must be set')
           
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
       
        user = self.model(
            email=email,
            phone_number=phone_number,
            first_name=first_name,
            last_name=last_name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone_number, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, phone_number, first_name, last_name, password, **extra_fields)
    
    
    def get_available_drivers(self, point, radius_km):
        """
        Filters for drivers who are online, active, and within the radius.
        Includes users with user_type 'driver' or 'both'.

        Ordered nearest-first (current_location is a geography column, so
        this annotation is real meters, not raw degrees) - previously
        unordered, so ride matching picked whichever driver row the DB
        happened to return first rather than the actually-closest one.
        """
        fresh_cutoff = timezone.now() - timedelta(seconds=DRIVER_STALE_AFTER_SECONDS)
        return self.filter(
            user_type__in=['driver', 'both'],
            is_online=True,
            last_location_update__gte=fresh_cutoff,
            current_location__distance_lte=(point, D(km=radius_km))
        ).annotate(distance=GeoDistance('current_location', point)).order_by('distance').distinct()