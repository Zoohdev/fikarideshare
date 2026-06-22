from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/tracking/$', consumers.LocationConsumer.as_asgi()),
    re_path(r'ws/safety/sos/(?P<sos_id>[^/]+)/$', consumers.SOSTrackingConsumer.as_asgi()),
]
