import os
import sys
from unittest.mock import MagicMock
from pathlib import Path
from datetime import timedelta
from decouple import config
import glob
from dotenv import load_dotenv
import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent


def _redis_tls(url):
    """Heroku Redis uses rediss:// with a self-signed cert. redis-py rejects
    it unless we relax cert verification. Local redis:// is returned as-is."""
    if url.startswith('rediss://') and 'ssl_cert_reqs' not in url:
        sep = '&' if '?' in url else '?'
        return f'{url}{sep}ssl_cert_reqs=none'
    return url

load_dotenv(os.path.join(BASE_DIR, '.env'))


SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = [h for h in config('ALLOWED_HOSTS', default='').split(',') if h]
ALLOWED_HOSTS += ['.herokuapp.com']
CSRF_TRUSTED_ORIGINS = ['https://*.herokuapp.com']
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
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files on Heroku
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


# Database configuration with PostGIS.
# On Heroku, the Postgres addon injects DATABASE_URL - use it. Locally we fall
# back to the discrete DB_* vars from .env.
if config('DATABASE_URL', default=''):
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL'),
            conn_max_age=600,
            ssl_require=True,
        )
    }
    # dj-database-url sets the plain postgres engine; force the GIS backend.
    DATABASES['default']['ENGINE'] = 'django.contrib.gis.db.backends.postgis'
else:
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


# Redis. On Heroku a single addon provides one REDIS_URL (rediss://, db 0)
# shared by cache, channels and Celery. Locally each uses its own db number.
REDIS_URL = config('REDIS_URL', default='redis://127.0.0.1:6379/0')
REDIS_IS_TLS = REDIS_URL.startswith('rediss://')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': _redis_tls(config('REDIS_URL', default='redis://127.0.0.1:6379/1')),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {'ssl_cert_reqs': None} if REDIS_IS_TLS else {},
        }
    }
}


# Django Channels configuration
ASGI_APPLICATION = 'config.asgi.application'


CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [_redis_tls(REDIS_URL)],
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
CELERY_BROKER_URL = _redis_tls(config('REDIS_URL', default='redis://127.0.0.1:6379/2'))
CELERY_RESULT_BACKEND = _redis_tls(config('REDIS_URL', default='redis://127.0.0.1:6379/2'))
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

# WhiteNoise serves static files from the dyno. Media (user uploads such as KYC
# docs) must NOT live on the dyno - its filesystem is wiped on every restart -
# so enable S3 with USE_S3=True + AWS_* vars for anything you can't lose.
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

USE_S3 = config('USE_S3', default=False, cast=bool)
if USE_S3:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='')
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    STORAGES['default'] = {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage'}


# Security settings (production)
if not DEBUG:
    # Heroku terminates TLS at its router and forwards over HTTP with this
    # header; without it SECURE_SSL_REDIRECT causes an infinite redirect loop.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
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