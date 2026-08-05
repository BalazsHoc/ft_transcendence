import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models

from .direct_serializers import DirectMessageSerializer
from .direct_services import DirectMessageError, create_direct_message
from .models import DirectConversation


class DirectChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"direct_chat_{self.conversation_id}"
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return
        if not await self.user_can_access_conversation():
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

        text = payload.get("text") or ""
        try:
            message_data = await self.create_message(text)
        except DirectMessageError as exc:
            await self.send_json({"type": "error", "detail": str(exc)})
            return
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "direct_message", "message": message_data},
        )

    async def direct_message(self, event):
        await self.send_json({"type": "message", **event["message"]})

    async def send_json(self, data):
        await self.send(text_data=json.dumps(data, cls=DjangoJSONEncoder))

    @database_sync_to_async
    def user_can_access_conversation(self):
        return DirectConversation.objects.filter(
            pk=self.conversation_id,
            friendship__status="accepted",
        ).filter(
            models.Q(friendship__user_low=self.user)
            | models.Q(friendship__user_high=self.user),
        ).exists()

    @database_sync_to_async
    def create_message(self, text):
        conversation = DirectConversation.objects.get(pk=self.conversation_id)
        message = create_direct_message(
            conversation=conversation,
            sender=self.user,
            text=text,
        )
        return DirectMessageSerializer(message).data
