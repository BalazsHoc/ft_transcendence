from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from notifications.models import Notification
from .models import Friendship


User = get_user_model()


class FriendshipApiTests(APITestCase):
    def setUp(self):
        self.alex = User.objects.create_user(
            username="alex",
            email="alex@example.com",
            password="secure-password",
            first_name="Alex",
        )
        self.bob = User.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="secure-password",
            first_name="Bob",
        )
        self.carol = User.objects.create_user(
            username="carol",
            email="carol@example.com",
            password="secure-password",
        )
        self.client.force_authenticate(self.alex)

    def request_friendship(self, actor, target):
        self.client.force_authenticate(actor)
        return self.client.post(
            "/api/friends/requests/",
            {"user_id": str(target.pk)},
            format="json",
        )

    def test_cannot_send_request_to_self(self):
        response = self.request_friendship(self.alex, self.alex)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Friendship.objects.exists())

    def test_duplicate_and_cross_direction_requests_are_rejected(self):
        first = self.request_friendship(self.alex, self.bob)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(
            Notification.objects.filter(
                recipient=self.bob,
                type=Notification.TYPE_FRIEND_REQUEST,
            ).count(),
            1,
        )

        duplicate = self.request_friendship(self.alex, self.bob)
        cross_direction = self.request_friendship(self.bob, self.alex)

        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(cross_direction.status_code, 400)
        self.assertEqual(Friendship.objects.count(), 1)
        friendship = Friendship.objects.get()
        self.assertEqual(str(friendship.user_low_id), min(str(self.alex.pk), str(self.bob.pk)))
        self.assertEqual(str(friendship.user_high_id), max(str(self.alex.pk), str(self.bob.pk)))

    def test_only_recipient_can_accept_and_friendship_is_private(self):
        created = self.request_friendship(self.alex, self.bob)
        friendship_id = created.data["id"]

        requester_accept = self.client.post(f"/api/friends/requests/{friendship_id}/accept/")
        self.assertEqual(requester_accept.status_code, 400)

        self.client.force_authenticate(self.carol)
        outsider_accept = self.client.post(f"/api/friends/requests/{friendship_id}/accept/")
        self.assertEqual(outsider_accept.status_code, 404)
        self.assertEqual(self.client.get("/api/friends/").data, [])

        self.client.force_authenticate(self.bob)
        incoming = self.client.get("/api/friends/requests/incoming/")
        self.assertEqual(incoming.status_code, 200)
        self.assertEqual(len(incoming.data), 1)
        accepted = self.client.post(f"/api/friends/requests/{friendship_id}/accept/")
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.data["status"], Friendship.STATUS_ACCEPTED)
        self.assertEqual(
            Notification.objects.filter(
                recipient=self.alex,
                type=Notification.TYPE_FRIEND_ACCEPTED,
            ).count(),
            1,
        )

        self.client.force_authenticate(self.alex)
        friends = self.client.get("/api/friends/")
        self.assertEqual(friends.status_code, 200)
        self.assertEqual(friends.data[0]["friend"]["username"], "bob")
        self.assertEqual(self.client.get("/api/friends/requests/outgoing/").data, [])

    def test_outsider_cannot_action_accepted_or_rejected_friendships(self):
        accepted = self.request_friendship(self.alex, self.bob)
        accepted_id = accepted.data["id"]
        self.client.force_authenticate(self.bob)
        self.client.post(f"/api/friends/requests/{accepted_id}/accept/")

        self.client.force_authenticate(self.carol)
        self.assertEqual(
            self.client.post(f"/api/friends/requests/{accepted_id}/accept/").status_code,
            404,
        )
        self.assertEqual(
            self.client.post(f"/api/friends/requests/{accepted_id}/reject/").status_code,
            404,
        )

        rejected = self.request_friendship(self.alex, self.carol)
        rejected_id = rejected.data["id"]
        self.client.force_authenticate(self.carol)
        self.client.post(f"/api/friends/requests/{rejected_id}/reject/")

        self.client.force_authenticate(self.bob)
        self.assertEqual(
            self.client.post(f"/api/friends/requests/{rejected_id}/accept/").status_code,
            404,
        )
        self.assertEqual(
            self.client.post(f"/api/friends/requests/{rejected_id}/reject/").status_code,
            404,
        )

    def test_unknown_request_action_does_not_mutate_pending_request(self):
        created = self.request_friendship(self.alex, self.bob)
        friendship_id = created.data["id"]

        self.client.force_authenticate(self.bob)
        response = self.client.post(f"/api/friends/requests/{friendship_id}/archive/")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            Friendship.objects.get(pk=friendship_id).status,
            Friendship.STATUS_PENDING,
        )

    def test_user_search_excludes_self_and_email_and_reports_relationship(self):
        self.request_friendship(self.alex, self.bob)
        self.client.force_authenticate(self.alex)

        response = self.client.get("/api/users/?search=b")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        result = response.data[0]
        self.assertEqual(result["username"], "bob")
        self.assertEqual(result["friendship_status"], "outgoing_pending")
        self.assertNotIn("email", result)
        self.assertNotIn(str(self.alex.pk), {item["id"] for item in response.data})

    def test_public_profile_returns_profile_and_friendship_metadata_without_email(self):
        self.request_friendship(self.alex, self.bob)
        self.client.force_authenticate(self.alex)

        response = self.client.get(f"/api/users/{self.bob.pk}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "bob")
        self.assertEqual(response.data["friendship_status"], "outgoing_pending")
        self.assertEqual(response.data["friendship_id"], Friendship.objects.get().pk)
        self.assertIn("created_at", response.data)
        self.assertIn("languages", response.data)
        self.assertNotIn("email", response.data)

    def test_public_profile_is_available_without_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get(f"/api/users/{self.bob.pk}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "bob")
        self.assertEqual(response.data["friendship_status"], "none")
        self.assertIsNone(response.data["friendship_id"])
        self.assertNotIn("email", response.data)

    def test_remove_friend_is_limited_to_participants(self):
        created = self.request_friendship(self.alex, self.bob)
        friendship_id = created.data["id"]
        self.client.force_authenticate(self.bob)
        self.client.post(f"/api/friends/requests/{friendship_id}/accept/")

        self.client.force_authenticate(self.carol)
        outsider_delete = self.client.delete(f"/api/friends/{friendship_id}/")
        self.assertEqual(outsider_delete.status_code, 404)

        self.client.force_authenticate(self.alex)
        deleted = self.client.delete(f"/api/friends/{friendship_id}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Friendship.objects.exists())


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.alex = User.objects.create_user(username="alex", password="secure-password")
        self.bob = User.objects.create_user(username="bob", password="secure-password")
        self.carol = User.objects.create_user(username="carol", password="secure-password")
        self.notification = Notification.objects.create(
            recipient=self.alex,
            actor=self.bob,
            type=Notification.TYPE_FRIEND_REQUEST,
            payload={"friendship_id": "1"},
            target_url="/friends/requests",
        )
        Notification.objects.create(
            recipient=self.alex,
            actor=self.carol,
            type=Notification.TYPE_FRIEND_ACCEPTED,
            payload={},
            target_url="/friends",
        )

    def test_notifications_are_recipient_only_and_can_be_filtered(self):
        self.client.force_authenticate(self.alex)
        own = self.client.get("/api/notifications/")
        unread = self.client.get("/api/notifications/?unread=true")
        self.assertEqual(own.status_code, 200)
        self.assertEqual(len(own.data), 2)
        self.assertEqual(len(unread.data), 2)
        self.assertEqual(self.client.get("/api/notifications/unread-count/").data["count"], 2)

        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get("/api/notifications/").data, [])
        self.assertEqual(
            self.client.post(f"/api/notifications/{self.notification.pk}/read/").status_code,
            404,
        )

    def test_read_and_read_all_only_change_current_recipient(self):
        self.client.force_authenticate(self.alex)
        marked = self.client.post(f"/api/notifications/{self.notification.pk}/read/")
        self.assertEqual(marked.status_code, 200)
        self.assertIsNotNone(marked.data["read_at"])
        self.assertEqual(len(self.client.get("/api/notifications/?unread=true").data), 1)

        all_read = self.client.post("/api/notifications/read-all/")
        self.assertEqual(all_read.status_code, 200)
        self.assertEqual(all_read.data["updated"], 1)
        self.assertEqual(self.client.get("/api/notifications/unread-count/").data["count"], 0)
