from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

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
