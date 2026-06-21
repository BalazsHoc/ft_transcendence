import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from events.models import Event, EventParticipant
from .models import Message
from .serializers import MessageSerializer

class EventChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.event_id=self.scope['url_route']['kwargs']['event_id']
        self.room_group_name=f'event_chat_{self.event_id}'
        self.user=self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001); return
        allowed=await self.user_can_access_event()
        if not allowed:
            await self.close(code=4003); return
        await self.channel_layer.group_add(self.room_group_name,self.channel_name)
        await self.accept()
    async def disconnect(self, close_code):
        if hasattr(self,'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name,self.channel_name)
    async def receive(self, text_data):
        try: payload=json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_json({'type':'error','detail':'Invalid JSON.'}); return
        text=(payload.get('text') or '').strip()
        if not text:
            await self.send_json({'type':'error','detail':'Message text is required.'}); return
        message_data=await self.create_message(text)
        await self.channel_layer.group_send(self.room_group_name, {'type':'chat_message','message':message_data})
    async def chat_message(self, event):
        await self.send_json({'type':'message', **event['message']})
    async def send_json(self, data):
        await self.send(text_data=json.dumps(data))
    @database_sync_to_async
    def user_can_access_event(self):
        try: event=Event.objects.get(id=self.event_id)
        except ObjectDoesNotExist: return False
        if event.creator_id == self.user.id: return True
        return EventParticipant.objects.filter(event=event,user=self.user).exists()
    @database_sync_to_async
    def create_message(self, text):
        event=Event.objects.get(id=self.event_id)
        msg=Message.objects.create(event=event,sender=self.user,text=text)
        return MessageSerializer(msg).data
