from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from notifications.models import Notification

from .models import Event, EventParticipant


User = get_user_model()


class EventParticipantNotificationTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="event-creator",
            password="secure-password",
        )
        self.attendee = User.objects.create_user(
            username="event-attendee",
            password="secure-password",
        )
        self.waiting_user = User.objects.create_user(
            username="event-waiting",
            password="secure-password",
        )
        start_at = timezone.now() + timedelta(days=7)
        self.event = Event.objects.create(
            title="Participant notifications",
            description="Test event",
            sport="running",
            level="beginner",
            languages=["en"],
            location_name="Prater",
            location_address="Vienna",
            latitude=48.2,
            longitude=16.4,
            start_at=start_at,
            end_at=start_at + timedelta(hours=2),
            max_slots=1,
            creator=self.creator,
        )

    def test_join_leave_and_waiting_list_promotion_notify_users(self):
        self.client.force_authenticate(self.attendee)
        joined = self.client.post(f"/api/events/{self.event.id}/join/")
        self.assertEqual(joined.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.creator,
                actor=self.attendee,
                type=Notification.TYPE_EVENT_PARTICIPANT_JOINED,
            ).exists()
        )

        self.client.force_authenticate(self.waiting_user)
        waiting = self.client.post(f"/api/events/{self.event.id}/join/")
        self.assertEqual(waiting.status_code, 201)
        self.assertEqual(waiting.data["status"], EventParticipant.STATUS_WAITING)

        self.client.force_authenticate(self.attendee)
        left = self.client.post(f"/api/events/{self.event.id}/leave/")
        self.assertEqual(left.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.creator,
                actor=self.attendee,
                type=Notification.TYPE_EVENT_PARTICIPANT_LEFT,
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.waiting_user,
                actor=self.attendee,
                type=Notification.TYPE_EVENT_PARTICIPANT_PROMOTED,
            ).exists()
        )


class EventValidationTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="event-validation-creator",
            password="secure-password",
        )
        self.client.force_authenticate(self.creator)

    def payload(self, **overrides):
        start_at = timezone.now() + timedelta(days=2)
        payload = {
            "title": "Evening run",
            "description": "A validation test event",
            "sport": "running",
            "level": "beginner",
            "languages": ["en"],
            "location_name": "Prater",
            "location_address": "Prater Hauptallee, Vienna",
            "latitude": 48.2167,
            "longitude": 16.395,
            "start_at": start_at.isoformat().replace("+00:00", "Z"),
            "end_at": (start_at + timedelta(hours=2)).isoformat().replace("+00:00", "Z"),
            "max_slots": 12,
            "visibility": "public",
        }
        payload.update(overrides)
        return payload

    def test_event_rejects_missing_required_fields(self):
        payload = self.payload()
        payload.pop("location_address")
        payload.pop("languages")
        payload.pop("max_slots")

        response = self.client.post("/api/events/", payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("location_address", response.data)
        self.assertIn("languages", response.data)
        self.assertIn("max_slots", response.data)

    def test_event_rejects_past_start_time(self):
        start_at = timezone.now() - timedelta(minutes=1)
        response = self.client.post(
            "/api/events/",
            self.payload(
                start_at=start_at.isoformat().replace("+00:00", "Z"),
                end_at=(start_at + timedelta(hours=2)).isoformat().replace("+00:00", "Z"),
            ),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("start_at", response.data)
