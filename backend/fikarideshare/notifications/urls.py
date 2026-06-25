from django.urls import path
from .views import NotificationListView, NotificationMarkReadView, PushTokenRegisterView

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('<uuid:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('push-tokens/', PushTokenRegisterView.as_view(), name='push_token_register'),
]
