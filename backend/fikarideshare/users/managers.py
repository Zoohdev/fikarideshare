from django.contrib.auth.base_user import BaseUserManager
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance as GeoDistance
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
        return self.filter(
            user_type__in=['driver', 'both'],
            is_online=True,
            current_location__distance_lte=(point, D(km=radius_km))
        ).annotate(distance=GeoDistance('current_location', point)).order_by('distance').distinct()