from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from core.asgi import application
from notifications.models import Notification
from groups.models import Group, GroupMembership
from social.models import Friendship
from accounts.models import PresenceSession

from .models import DirectConversation, DirectMessage

User = get_user_model()


class DirectMessagingApiTests(APITestCase):
    def setUp(self):
        self.alex = User.objects.create_user(
            username="alex",
            password="secure-password",
        )
        self.bob = User.objects.create_user(
            username="bob",
            password="secure-password",
        )
        self.carol = User.objects.create_user(
            username="carol",
            password="secure-password",
        )
        user_low, user_high = sorted(
            (self.alex, self.bob),
            key=lambda user: str(user.pk),
        )
        self.friendship = Friendship.objects.create(
            user_low=user_low,
            user_high=user_high,
            requested_by=self.alex,
            status=Friendship.STATUS_ACCEPTED,
        )

    def create_conversation(self):
        self.client.force_authenticate(self.alex)
        response = self.client.post(
            "/api/messages/conversations/",
            {"user_id": str(self.bob.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        return response

    def test_only_friends_can_start_conversations(self):
        self.client.force_authenticate(self.alex)
        response = self.client.post(
            "/api/messages/conversations/",
            {"user_id": str(self.carol.pk)},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(DirectConversation.objects.count(), 0)

    def test_friend_can_create_and_reuse_conversation(self):
        first = self.create_conversation()
        second = self.client.post(
            "/api/messages/conversations/",
            {"user_id": str(self.bob.pk)},
            format="json",
        )

        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(first.data["peer"]["username"], "bob")
        self.assertEqual(
            self.client.get("/api/messages/conversations/").status_code,
            200,
        )

    def test_messages_are_private_and_notify_recipient(self):
        conversation = self.create_conversation().data["id"]
        message_response = self.client.post(
            f"/api/messages/conversations/{conversation}/messages/",
            {"text": "Hello Bob"},
            format="json",
        )

        self.assertEqual(message_response.status_code, 201)
        self.assertEqual(message_response.data["text"], "Hello Bob")
        self.assertEqual(DirectMessage.objects.count(), 1)
        notification = Notification.objects.get(recipient=self.bob)
        self.assertEqual(notification.type, Notification.TYPE_DIRECT_MESSAGE)
        self.assertEqual(notification.actor, self.alex)
        self.assertEqual(notification.payload["conversation_id"], conversation)
        self.assertEqual(
            notification.target_url,
            f"/chats?conversationId={conversation}",
        )

        self.client.force_authenticate(self.bob)
        recipient_messages = self.client.get(
            f"/api/messages/conversations/{conversation}/messages/"
        )
        self.assertEqual(recipient_messages.status_code, 200)
        self.assertEqual(len(recipient_messages.data), 1)
        self.assertEqual(recipient_messages.data[0]["sender"]["username"], "alex")

        self.client.force_authenticate(self.carol)
        outsider_messages = self.client.get(
            f"/api/messages/conversations/{conversation}/messages/"
        )
        self.assertEqual(outsider_messages.status_code, 404)

    def test_pending_friendship_cannot_send_messages(self):
        self.friendship.status = Friendship.STATUS_PENDING
        self.friendship.save(update_fields=["status"])

        self.client.force_authenticate(self.alex)
        response = self.client.post(
            "/api/messages/conversations/",
            {"user_id": str(self.bob.pk)},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(DirectConversation.objects.exists())

    def test_websocket_delivers_direct_message_to_connected_friend(self):
        conversation = self.create_conversation().data["id"]
        token = str(AccessToken.for_user(self.alex))

        async def communicate():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/direct/{conversation}/?token={token}",
            )
            connected, _ = await communicator.connect()
            await communicator.send_json_to({"text": "Live hello"})
            message = await communicator.receive_json_from()
            await communicator.disconnect()
            return connected, message

        connected, message = async_to_sync(communicate)()
        self.assertTrue(connected)
        self.assertEqual(message["type"], "message")
        self.assertEqual(message["text"], "Live hello")

    def test_group_websocket_delivers_messages_and_notifies_members(self):
        group = Group.objects.create(
            name="Danube Runners",
            sport="running",
            levels=["beginner"],
            owner=self.alex,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.alex,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.bob,
            status=GroupMembership.STATUS_ACTIVE,
        )
        token = str(AccessToken.for_user(self.alex))

        async def communicate():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/groups/{group.pk}/?token={token}",
            )
            connected, _ = await communicator.connect()
            await communicator.send_json_to({"text": "Group hello"})
            message = await communicator.receive_json_from()
            await communicator.disconnect()
            return connected, message

        connected, message = async_to_sync(communicate)()
        self.assertTrue(connected)
        self.assertEqual(message["type"], "message")
        self.assertEqual(message["text"], "Group hello")
        notification = Notification.objects.get(
            recipient=self.bob,
            type=Notification.TYPE_GROUP_MESSAGE,
        )
        self.assertEqual(notification.payload["group_id"], str(group.pk))


class PresenceWebsocketTests(APITestCase):
    def setUp(self):
        self.alex = User.objects.create_user(
            username="presence-alex",
            email="presence-alex@example.com",
            password="secure-password",
        )
        self.bob = User.objects.create_user(
            username="presence-bob",
            email="presence-bob@example.com",
            password="secure-password",
        )
        user_low, user_high = sorted(
            (self.alex, self.bob),
            key=lambda user: str(user.pk),
        )
        Friendship.objects.create(
            user_low=user_low,
            user_high=user_high,
            requested_by=self.alex,
            status=Friendship.STATUS_ACCEPTED,
        )

    def test_presence_websocket_tracks_session_and_heartbeat(self):
        token = str(AccessToken.for_user(self.alex))

        async def communicate():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/presence/?token={token}",
            )
            connected, _ = await communicator.connect()
            initial = await communicator.receive_json_from()
            await communicator.send_json_to({"type": "heartbeat"})
            heartbeat = await communicator.receive_json_from()
            await communicator.disconnect()
            return connected, initial, heartbeat

        connected, initial, heartbeat = async_to_sync(communicate)()
        self.assertTrue(connected)
        self.assertEqual(initial["type"], "presence_update")
        self.assertEqual(initial["user_id"], str(self.alex.pk))
        self.assertTrue(initial["is_online"])
        self.assertTrue(heartbeat["is_online"])
        self.assertFalse(PresenceSession.objects.filter(user=self.alex).exists())
        self.alex.refresh_from_db()
        self.assertIsNotNone(self.alex.last_seen)

    def test_friends_receive_online_presence_updates(self):
        alex_token = str(AccessToken.for_user(self.alex))
        bob_token = str(AccessToken.for_user(self.bob))

        async def communicate():
            bob_communicator = WebsocketCommunicator(
                application,
                f"/ws/presence/?token={bob_token}",
            )
            bob_connected, _ = await bob_communicator.connect()
            await bob_communicator.receive_json_from()

            alex_communicator = WebsocketCommunicator(
                application,
                f"/ws/presence/?token={alex_token}",
            )
            alex_connected, _ = await alex_communicator.connect()
            await alex_communicator.receive_json_from()
            update = await bob_communicator.receive_json_from()

            await alex_communicator.disconnect()
            await bob_communicator.disconnect()
            return bob_connected, alex_connected, update

        bob_connected, alex_connected, update = async_to_sync(communicate)()
        self.assertTrue(bob_connected)
        self.assertTrue(alex_connected)
        self.assertEqual(update["user_id"], str(self.alex.pk))
        self.assertTrue(update["is_online"])
