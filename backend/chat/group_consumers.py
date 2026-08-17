import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder

from .direct_serializers import GroupMessageSerializer
from .group_services import GroupMessageError, active_group_for_user, create_group_message


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope["url_route"]["kwargs"]["group_id"]
        self.room_group_name = f"group_chat_{self.group_id}"
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return
        if not await self.user_can_access_group():
            await self.close(code=4003)
            return
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_json({"type": "error", "detail": "Invalid JSON."})
            return

        try:
            message_data = await self.create_message(payload.get("text") or "")
        except GroupMessageError as exc:
            await self.send_json({"type": "error", "detail": str(exc)})
            return
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "group_message", "message": message_data},
        )

    async def group_message(self, event):
        await self.send_json({"type": "message", **event["message"]})

    async def send_json(self, data):
        await self.send(text_data=json.dumps(data, cls=DjangoJSONEncoder))

    @database_sync_to_async
    def user_can_access_group(self):
        return active_group_for_user(group_id=self.group_id, user=self.user) is not None

    @database_sync_to_async
    def create_message(self, text):
        group = active_group_for_user(group_id=self.group_id, user=self.user)
        if group is None:
            raise GroupMessageError("Only group members can send messages.")
        message = create_group_message(group=group, sender=self.user, text=text)
        return GroupMessageSerializer(message).data
