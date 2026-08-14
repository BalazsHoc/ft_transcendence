from django.urls import re_path
from .consumers import EventChatConsumer
from .direct_consumers import DirectChatConsumer
from .group_consumers import GroupChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/events/(?P<event_id>[0-9a-f-]+)/$", EventChatConsumer.as_asgi()),
    re_path(
        r"ws/direct/(?P<conversation_id>[0-9a-f-]+)/$",
        DirectChatConsumer.as_asgi(),
    ),
    re_path(r"ws/groups/(?P<group_id>[0-9a-f-]+)/$", GroupChatConsumer.as_asgi()),
]
