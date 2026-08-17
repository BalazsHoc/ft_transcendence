import json
from datetime import timedelta

from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from events.models import Event
from groups.models import Group, GroupMembership

from .models import PublicAPIKey


class PublicAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="public-owner",
            email="owner@example.com",
            password="secure-password",
        )
        self.other_user = get_user_model().objects.create_user(
            username="public-member",
            email="member@example.com",
            password="secure-password",
        )
        self.api_key, self.raw_key = PublicAPIKey.issue(
            name="test-consumer",
            created_by=self.user,
        )
        self.public_group = Group.objects.create(
            name="Public Runners",
            description="Open running group",
            sport="running",
            levels=["beginner"],
            owner=self.user,
        )
        GroupMembership.objects.create(
            group=self.public_group,
            user=self.user,
            role=GroupMembership.ROLE_OWNER,
            status=GroupMembership.STATUS_ACTIVE,
        )
        self.event_group = Group.objects.create(
            name="Advanced Runners",
            sport="running",
            levels=["advanced"],
            owner=self.user,
        )
        start = timezone.now() + timedelta(days=1)
        self.public_event = Event.objects.create(
            title="Public run",
            description="Everyone can see this event",
            sport="running",
            level="beginner",
            languages=["en"],
            location_name="Prater",
            location_address="Vienna",
            latitude=48.2,
            longitude=16.4,
            start_at=start,
            end_at=start + timedelta(hours=1),
            max_slots=20,
            creator=self.user,
            visibility=Event.VISIBILITY_PUBLIC,
        )
        self.private_event = Event.objects.create(
            title="Private run",
            description="Members only",
            sport="running",
            level="advanced",
            languages=["en"],
            location_name="Private gym",
            location_address="Vienna",
            latitude=48.2,
            longitude=16.4,
            start_at=start,
            end_at=start + timedelta(hours=1),
            max_slots=10,
            creator=self.user,
            group=self.event_group,
            visibility=Event.VISIBILITY_PRIVATE,
        )

    def get(self, path, raw_key=None):
        return self.client.get(
            path,
            HTTP_X_API_KEY=raw_key or self.raw_key,
        )

    def test_public_api_requires_a_valid_key(self):
        missing = self.client.get("/api/public/v1/groups/")
        self.assertIn(missing.status_code, (401, 403))

        invalid = self.client.get(
            "/api/public/v1/groups/",
            HTTP_X_API_KEY="tr_pub_invalid",
        )
        self.assertEqual(invalid.status_code, 401)

    def test_key_authenticates_catalogs_and_is_stored_as_a_salted_hash(self):
        self.assertEqual(self.get("/api/public/v1/health/").status_code, 200)
        self.assertEqual(self.get("/api/public/v1/sports/").status_code, 200)
        self.assertEqual(self.get("/api/public/v1/districts/").status_code, 200)

        stored = PublicAPIKey.objects.get(pk=self.api_key.pk)
        self.assertNotEqual(stored.key_hash, self.raw_key)
        self.assertTrue(check_password(self.raw_key, stored.key_hash))
        self.assertIsNotNone(stored.last_used_at)

    def test_public_resources_are_paginated_and_private_data_is_hidden(self):
        groups = self.get("/api/public/v1/groups/")
        self.assertEqual(groups.status_code, 200)
        self.assertIn("results", groups.data)
        self.assertEqual(
            {item["id"] for item in groups.data["results"]},
            {str(self.public_group.id), str(self.event_group.id)},
        )

        events = self.get("/api/public/v1/events/")
        self.assertEqual(events.status_code, 200)
        event_ids = [item["id"] for item in events.data["results"]]
        self.assertIn(str(self.public_event.id), event_ids)
        self.assertNotIn(str(self.private_event.id), event_ids)

        users = self.get("/api/public/v1/users/")
        self.assertEqual(users.status_code, 200)
        self.assertNotIn("email", users.data["results"][0])

        detail = self.get(f"/api/public/v1/groups/{self.public_group.id}/")
        self.assertEqual(detail.status_code, 200)
        open_detail = self.get(f"/api/public/v1/groups/{self.event_group.id}/")
        self.assertEqual(open_detail.status_code, 200)
        self.assertNotIn("visibility", detail.data)
        self.assertNotIn("kind", detail.data)

    def test_public_filters_and_ordering_are_available(self):
        response = self.get("/api/public/v1/events/?sport=running&search=Public&ordering=-start_at")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.public_event.id))

        groups = self.get("/api/public/v1/groups/?sport=running&level=beginner")
        self.assertEqual(groups.status_code, 200)
        self.assertEqual(len(groups.data["results"]), 1)
        self.assertEqual(groups.data["results"][0]["id"], str(self.public_group.id))

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": (
                "rest_framework.permissions.IsAuthenticatedOrReadOnly",
            ),
            "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
            "DEFAULT_THROTTLE_RATES": {
                "public_api": "2/minute",
                "public_api_ip": "120/minute",
            },
        }
    )
    def test_public_api_is_rate_limited(self):
        cache.clear()
        self.assertEqual(self.get("/api/public/v1/health/").status_code, 200)
        self.assertEqual(self.get("/api/public/v1/health/").status_code, 200)
        self.assertEqual(self.get("/api/public/v1/health/").status_code, 429)

    def test_revoked_key_is_rejected(self):
        self.api_key.revoke()
        response = self.get("/api/public/v1/health/")
        self.assertEqual(response.status_code, 401)

    def test_openapi_exposes_api_key_security_scheme(self):
        response = self.client.get(
            "/api/schema/",
            HTTP_ACCEPT="application/json",
        )
        self.assertEqual(response.status_code, 200)
        schema = json.loads(response.content)
        self.assertIn("PublicApiKeyAuth", schema["components"]["securitySchemes"])
        operation = schema["paths"]["/api/public/v1/groups/"]["get"]
        self.assertIn({"PublicApiKeyAuth": []}, operation["security"])
