from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from chat.models import GroupMessage
from events.models import Event
from notifications.models import Notification

from .models import Group, GroupMembership


class GroupApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="alex", password="secure-password"
        )
        self.other_user = get_user_model().objects.create_user(
            username="member", password="secure-password"
        )

    def test_authenticated_user_can_create_group_and_becomes_owner(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/groups/",
            {
                "name": "Danube Runners",
                "sport": "running",
                "levels": ["beginner", "intermediate"],
                "visibility": "public",
                "join_policy": "open",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        group = Group.objects.get(name="Danube Runners")
        self.assertTrue(
            GroupMembership.objects.filter(
                group=group,
                user=self.user,
                role=GroupMembership.ROLE_OWNER,
                status=GroupMembership.STATUS_ACTIVE,
            ).exists()
        )

    def test_private_group_is_hidden_from_non_members(self):
        group = Group.objects.create(
            name="Private Climbers",
            sport="climbing",
            levels=["advanced"],
            visibility=Group.VISIBILITY_PRIVATE,
            join_policy=Group.JOIN_INVITE_ONLY,
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group, user=self.user, role=GroupMembership.ROLE_OWNER
        )

        response = self.client.get("/api/groups/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_owner_can_create_private_group_event_hidden_from_non_members(self):
        group = Group.objects.create(
            name="Private Climbers",
            sport="climbing",
            levels=["advanced"],
            visibility=Group.VISIBILITY_PRIVATE,
            join_policy=Group.JOIN_INVITE_ONLY,
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group, user=self.user, role=GroupMembership.ROLE_OWNER
        )
        self.client.force_authenticate(self.user)

        created = self.client.post(
            f"/api/groups/{group.id}/events/",
            {
                "title": "Private bouldering session",
                "description": "Members only",
                "sport": "climbing",
                "level": "advanced",
                "languages": ["en"],
                "location_name": "Climbing hall",
                "location_address": "Vienna",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "start_at": "2026-08-02T18:00:00Z",
                "end_at": "2026-08-02T20:00:00Z",
                "max_slots": 12,
                "visibility": "private",
            },
            format="json",
        )

        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["group"]["id"], str(group.id))
        self.client.force_authenticate(None)
        hidden = self.client.get("/api/events/")
        self.assertEqual(hidden.status_code, 200)
        self.assertEqual(hidden.data, [])

    def test_only_group_owner_can_create_group_event(self):
        group = Group.objects.create(
            name="Saturday Swimmers",
            sport="swimming",
            levels=["intermediate"],
            visibility=Group.VISIBILITY_PUBLIC,
            join_policy=Group.JOIN_OPEN,
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.other_user,
            role=GroupMembership.ROLE_MEMBER,
            status=GroupMembership.STATUS_ACTIVE,
        )

        self.client.force_authenticate(self.other_user)
        response = self.client.post(
            f"/api/groups/{group.id}/events/",
            {
                "title": "Member-created event",
                "description": "Should be rejected",
                "sport": "swimming",
                "level": "intermediate",
                "languages": ["en"],
                "location_name": "Stadthallenbad",
                "location_address": "Vienna",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "start_at": "2026-08-03T18:00:00Z",
                "end_at": "2026-08-03T20:00:00Z",
                "max_slots": 8,
                "visibility": "public",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_group_chat_is_member_only_and_notifies_active_members(self):
        group = Group.objects.create(
            name="Danube Runners",
            sport="running",
            levels=["beginner"],
            visibility=Group.VISIBILITY_PUBLIC,
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.other_user,
            status=GroupMembership.STATUS_ACTIVE,
        )
        pending_user = get_user_model().objects.create_user(
            username="pending",
            password="secure-password",
        )
        GroupMembership.objects.create(
            group=group,
            user=pending_user,
            status=GroupMembership.STATUS_PENDING,
        )

        self.client.force_authenticate(self.other_user)
        history = self.client.get(f"/api/groups/{group.id}/messages/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.data, [])

        created = self.client.post(
            f"/api/groups/{group.id}/messages/",
            {"text": "Hello runners"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["text"], "Hello runners")
        self.assertEqual(GroupMessage.objects.count(), 1)
        self.assertFalse(
            Notification.objects.filter(
                recipient=self.other_user,
                type=Notification.TYPE_GROUP_MESSAGE,
            ).exists()
        )
        notification = Notification.objects.get(
            recipient=self.user,
            type=Notification.TYPE_GROUP_MESSAGE,
        )
        self.assertEqual(notification.payload["group_id"], str(group.id))
        self.assertEqual(
            notification.target_url,
            f"/groups/{group.id}#group-chat",
        )

        self.client.force_authenticate(pending_user)
        pending_response = self.client.get(f"/api/groups/{group.id}/messages/")
        self.assertEqual(pending_response.status_code, 404)

    def test_group_join_and_leave_notify_active_members(self):
        group = Group.objects.create(
            name="Join notifications",
            sport="running",
            levels=["beginner"],
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.other_user,
            status=GroupMembership.STATUS_ACTIVE,
        )
        joiner = get_user_model().objects.create_user(
            username="joiner",
            password="secure-password",
        )

        self.client.force_authenticate(joiner)
        joined = self.client.post(f"/api/groups/{group.id}/join/")
        self.assertEqual(joined.status_code, 201)
        joined_notifications = Notification.objects.filter(
            type=Notification.TYPE_GROUP_MEMBER_JOINED,
            actor=joiner,
        )
        self.assertEqual(joined_notifications.count(), 2)
        self.assertEqual(
            set(joined_notifications.values_list("recipient_id", flat=True)),
            {self.user.id, self.other_user.id},
        )

        left = self.client.post(f"/api/groups/{group.id}/leave/")
        self.assertEqual(left.status_code, 204)
        self.assertEqual(
            Notification.objects.filter(
                type=Notification.TYPE_GROUP_MEMBER_LEFT,
                actor=joiner,
            ).count(),
            2,
        )

    def test_group_join_request_and_cancellation_notify_admins(self):
        group = Group.objects.create(
            name="Approval notifications",
            sport="cycling",
            levels=["all"],
            join_policy=Group.JOIN_APPROVAL,
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        joiner = get_user_model().objects.create_user(
            username="requester",
            password="secure-password",
        )

        self.client.force_authenticate(joiner)
        joined = self.client.post(f"/api/groups/{group.id}/join/")
        self.assertEqual(joined.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                actor=joiner,
                type=Notification.TYPE_GROUP_JOIN_REQUEST,
            ).exists()
        )

        left = self.client.post(f"/api/groups/{group.id}/leave/")
        self.assertEqual(left.status_code, 204)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                actor=joiner,
                type=Notification.TYPE_GROUP_JOIN_REQUEST_CANCELLED,
            ).exists()
        )

    def test_group_update_and_delete_notify_active_members(self):
        group = Group.objects.create(
            name="Lifecycle notifications",
            sport="running",
            levels=["beginner"],
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.other_user,
            status=GroupMembership.STATUS_ACTIVE,
        )

        self.client.force_authenticate(self.user)
        updated = self.client.patch(
            f"/api/groups/{group.id}/",
            {"description": "Updated description"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.other_user,
                actor=self.user,
                type=Notification.TYPE_GROUP_UPDATED,
            ).exists()
        )

        deleted = self.client.delete(f"/api/groups/{group.id}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.other_user,
                actor=self.user,
                type=Notification.TYPE_GROUP_DELETED,
            ).exists()
        )

    def test_group_event_lifecycle_notifies_members(self):
        group = Group.objects.create(
            name="Event lifecycle notifications",
            sport="running",
            levels=["beginner"],
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        GroupMembership.objects.create(
            group=group,
            user=self.other_user,
            status=GroupMembership.STATUS_ACTIVE,
        )

        self.client.force_authenticate(self.user)
        event_data = {
            "title": "Group run",
            "description": "Lifecycle test",
            "sport": "running",
            "level": "beginner",
            "languages": ["en"],
            "location_name": "Prater",
            "location_address": "Vienna",
            "latitude": 48.2,
            "longitude": 16.4,
            "start_at": "2026-09-01T18:00:00Z",
            "end_at": "2026-09-01T20:00:00Z",
            "max_slots": 12,
            "visibility": "public",
        }
        created = self.client.post(
            f"/api/groups/{group.id}/events/",
            event_data,
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        event = Event.objects.get(pk=created.data["id"])
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.other_user,
                actor=self.user,
                type=Notification.TYPE_GROUP_EVENT_CREATED,
            ).exists()
        )

        updated = self.client.patch(
            f"/api/events/{event.id}/",
            {"description": "Updated lifecycle test"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.other_user,
                actor=self.user,
                type=Notification.TYPE_GROUP_EVENT_UPDATED,
            ).exists()
        )

        deleted = self.client.delete(f"/api/events/{event.id}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.other_user,
                actor=self.user,
                type=Notification.TYPE_GROUP_EVENT_DELETED,
            ).exists()
        )
