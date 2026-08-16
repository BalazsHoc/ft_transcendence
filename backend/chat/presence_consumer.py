import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q

from accounts.presence import (
    close_presence_session,
    open_presence_session,
    touch_presence_session,
    user_presence,
)
from social.models import Friendship


class PresenceConsumer(AsyncWebsocketConsumer):
    """Keep one authenticated browser session alive and fan out friend updates."""

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.presence_group = f"presence_user_{self.user.pk}"
        await self.channel_layer.group_add(self.presence_group, self.channel_name)
        self.session_id, became_online = await self.open_session()
        await self.accept()
        await self.send_presence()
        if became_online:
            await self.broadcast_presence()

    async def disconnect(self, close_code):
        if not hasattr(self, "presence_group"):
            return
        await self.channel_layer.group_discard(self.presence_group, self.channel_name)
        if hasattr(self, "session_id"):
            became_offline = await self.close_session()
            if became_offline:
                await self.broadcast_presence()

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_json({"type": "error", "detail": "Invalid JSON."})
            return

        if payload.get("type") != "heartbeat":
            return
        snapshot = await self.touch_session()
        if snapshot:
            await self.send_json({"type": "presence_update", **snapshot})

    async def presence_update(self, event):
        await self.send_json(
            {
                "type": "presence_update",
                "user_id": event["user_id"],
                "is_online": event["is_online"],
                "last_seen": event["last_seen"],
            }
        )

    async def send_presence(self):
        await self.send_json({"type": "presence_update", **await self.get_snapshot()})

    async def send_json(self, data):
        await self.send(text_data=json.dumps(data, cls=DjangoJSONEncoder))

    async def broadcast_presence(self):
        snapshot = await self.get_snapshot()
        event = {"type": "presence_update", **snapshot}
        for friend_id in await self.get_friend_ids():
            await self.channel_layer.group_send(
                f"presence_user_{friend_id}",
                {"type": "presence_update", **event},
            )

    @database_sync_to_async
    def open_session(self):
        return open_presence_session(self.user.pk)

    @database_sync_to_async
    def touch_session(self):
        return touch_presence_session(self.session_id, self.user.pk)

    @database_sync_to_async
    def close_session(self):
        return close_presence_session(self.session_id, self.user.pk)

    @database_sync_to_async
    def get_snapshot(self):
        return user_presence(self.user.pk)

    @database_sync_to_async
    def get_friend_ids(self):
        relations = Friendship.objects.filter(
            status=Friendship.STATUS_ACCEPTED,
        ).filter(Q(user_low=self.user) | Q(user_high=self.user))
        friend_ids = []
        for relation in relations:
            friend_ids.append(
                relation.user_high_id
                if relation.user_low_id == self.user.pk
                else relation.user_low_id
            )
        return [str(friend_id) for friend_id in friend_ids]
