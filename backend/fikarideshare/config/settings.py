import os
import sys
from unittest.mock import MagicMock
from pathlib import Path
from datetime import timedelta
from decouple import config
import glob
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(os.path.join(BASE_DIR, '.env'))


SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')

# Application definition
INSTALLED_APPS = [
    # Django Channels (must be first for ASGI)
    'daphne',
   
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',  # GeoDjango for PostGIS
   
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'django_filters',
    'drf_spectacular',
   
    # Local apps
    'users.apps.UsersConfig',
    'vehicles.apps.VehiclesConfig',
    'rides.apps.RidesConfig',
    'payments.apps.PaymentsConfig',
    'ratings.apps.RatingsConfig',
    'kyc.apps.KycConfig',
    'support.apps.SupportConfig',
    'notifications.apps.NotificationsConfig',
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ROOT_URLCONF = 'config.urls'


# Custom user model
AUTH_USER_MODEL = 'users.User'


# Database configuration with PostGIS
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}


# Redis cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}


# Django Channels configuration
ASGI_APPLICATION = 'config.asgi.application'


CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://127.0.0.1:6379/0')],
        },
    },
}
# CELERY_TASK_ALWAYS_EAGER = True
# CELERY_TASK_EAGER_PROPAGATES_EXCEPTIONS = True
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}


# JWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}


# Celery configuration
CELERY_BROKER_URL = config('REDIS_URL', default='redis://127.0.0.1:6379/2')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://127.0.0.1:6379/2')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'


# External API keys
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')


GOOGLE_MAPS_API_KEY = config('GOOGLE_MAPS_API_KEY', default='')


ONFIDO_API_TOKEN = config('ONFIDO_API_TOKEN', default='')  # KYC provider
DEKRA_API_KEY = config('DEKRA_API_KEY', default='')
DEKRA_API_URL = config('DEKRA_API_URL', default='[api.dekra.com](https://api.dekra.com/v1)')


# CORS settings
# CORS_ALLOWED_ORIGINS = [
#     'http://localhost:3000',
#     'http://localhost:8081',
# ]
# CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_ALL_ORIGINS = True  
CORS_ALLOW_CREDENTIALS = True


# Static and media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Security settings (production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates', # <--- Make sure this line is exactly here
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# GeoDjango GDAL/GEOS library paths - Windows dev only. Linux/production
# never reaches this branch (GDAL/GEOS are installed as system libraries
# there), so this has no effect on hosting.
#
# Per-developer overrides go in your own untracked .env (never hardcode a
# personal path here) - see .env.example for GDAL_LIBRARY_PATH,
# GEOS_LIBRARY_PATH, OSGEO4W_ROOT, PROJ_LIB, GDAL_DATA. If none are set, we
# auto-detect a standard OSGeo4W install instead of assuming one person's
# username/folder layout.
if os.name == 'nt':
    GDAL_LIBRARY_PATH = config('GDAL_LIBRARY_PATH', default='') or None
    GEOS_LIBRARY_PATH = config('GEOS_LIBRARY_PATH', default='') or None

    if not (GDAL_LIBRARY_PATH and GEOS_LIBRARY_PATH):
        osgeo_candidates = filter(None, [
            config('OSGEO4W_ROOT', default=''),
            r'C:\OSGeo4W',
            os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'Programs', 'OSGeo4W'),
        ])

        for osgeo_root in osgeo_candidates:
            osgeo_bin = os.path.join(osgeo_root, 'bin')
            gdal_dlls = glob.glob(os.path.join(osgeo_bin, 'gdal*.dll'))
            geos_dlls = glob.glob(os.path.join(osgeo_bin, 'geos_c.dll'))

            if gdal_dlls and geos_dlls:
                os.environ['PATH'] = osgeo_bin + os.pathsep + os.environ['PATH']
                GDAL_LIBRARY_PATH = GDAL_LIBRARY_PATH or gdal_dlls[0]
                GEOS_LIBRARY_PATH = GEOS_LIBRARY_PATH or geos_dlls[0]
                os.environ['PROJ_LIB'] = config('PROJ_LIB', default=os.path.join(osgeo_root, 'share', 'proj'))
                os.environ['GDAL_DATA'] = config('GDAL_DATA', default=os.path.join(osgeo_root, 'share', 'gdal'))
                print(f"GeoDjango: linked GDAL/GEOS from {osgeo_bin}")
                break
        else:
            print(
                "GeoDjango: no local OSGeo4W install auto-detected. If PostGIS "
                "features fail, set GDAL_LIBRARY_PATH/GEOS_LIBRARY_PATH (or "
                "OSGEO4W_ROOT) in your own .env - see .env.example."
            )





