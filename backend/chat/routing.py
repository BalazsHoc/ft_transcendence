from django.urls import re_path
from .consumers import EventChatConsumer
websocket_urlpatterns=[re_path(r'ws/events/(?P<event_id>[0-9a-f-]+)/$', EventChatConsumer.as_asgi())]
