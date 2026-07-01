import asyncio
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# windows' default ProactorEventLoop has a known incompatibility with
# redis.asyncio's timeout handling (channels_redis), causing spurious
# "Timeout reading from 127.0.0.1:6379" errors that kill every websocket
# connection within seconds even though redis itself is healthy. The
# selector event loop doesn't have this issue. Must be set before Daphne
# creates its event loop, so this has to happen at import time here.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from django.core.asgi import get_asgi_application

# Initialise Django's app registry BEFORE importing anything that touches
# models/auth. rides.middleware imports AnonymousUser at module load, so it
# must come after get_asgi_application(). Under `daphne config.asgi:application`
# (how the Heroku web dyno starts) nothing sets Django up for us first, unlike
# `manage.py runserver` - so import order here is load-bearing.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from rides.middleware import TokenAuthMiddleware

# Fallback import to keep Daphne from crashing if routing.py is blank
try:
    from rides.routing import websocket_urlpatterns
except ImportError:
    websocket_urlpatterns = []

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # "websocket": AuthMiddlewareStack(
    #     URLRouter(
    #         websocket_urlpatterns
    #     )
    # ),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

