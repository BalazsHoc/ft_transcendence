from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from notifications.models import Notification

from .models import Event, EventParticipant
from groups.models import Group, GroupMembership


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


class EventListTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="event-list-user",
            password="secure-password",
        )
        now = timezone.now()
        Event.objects.create(
            title="Past event",
            description="Should not appear in the feed",
            sport="running",
            level="beginner",
            languages=["en"],
            location_name="Prater",
            location_address="Vienna",
            latitude=48.2,
            longitude=16.4,
            start_at=now - timedelta(days=1),
            end_at=now - timedelta(hours=22),
            max_slots=10,
            creator=self.user,
        )
        Event.objects.create(
            title="Future event",
            description="Should appear in the feed",
            sport="running",
            level="beginner",
            languages=["en"],
            location_name="Prater",
            location_address="Vienna",
            latitude=48.2,
            longitude=16.4,
            start_at=now + timedelta(days=1),
            end_at=now + timedelta(days=1, hours=2),
            max_slots=10,
            creator=self.user,
        )

    def test_feed_excludes_past_events(self):
        response = self.client.get("/api/events/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Future event")


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


class GroupEventCounterRegressionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="group-owner",
            password="secure-password",
        )
        self.viewer = User.objects.create_user(
            username="group-viewer",
            password="secure-password",
        )
        self.attendee_one = User.objects.create_user(
            username="attendee-one",
            password="secure-password",
        )
        self.attendee_two = User.objects.create_user(
            username="attendee-two",
            password="secure-password",
        )
        self.waiting_user = User.objects.create_user(
            username="waiting-user",
            password="secure-password",
        )

        self.group = Group.objects.create(
            name="Counter Club",
            description="Group for counter regressions",
            sport="running",
            levels=["beginner"],
            max_members=50,
            owner=self.owner,
        )
        GroupMembership.objects.create(
            group=self.group,
            user=self.owner,
            role=GroupMembership.ROLE_OWNER,
        )
        GroupMembership.objects.create(
            group=self.group,
            user=self.viewer,
            role=GroupMembership.ROLE_MEMBER,
        )
        for index in range(5):
            member = User.objects.create_user(
                username=f"extra-member-{index}",
                password="secure-password",
            )
            GroupMembership.objects.create(
                group=self.group,
                user=member,
                role=GroupMembership.ROLE_MEMBER,
            )

        start_at = timezone.now() + timedelta(days=3)
        self.event = Event.objects.create(
            title="Group counter event",
            description="Regression event",
            sport="running",
            level="beginner",
            languages=["en"],
            location_name="Prater",
            location_address="Vienna",
            latitude=48.2,
            longitude=16.4,
            start_at=start_at,
            end_at=start_at + timedelta(hours=2),
            max_slots=2,
            creator=self.owner,
            group=self.group,
            visibility=Event.VISIBILITY_PUBLIC,
        )

    def test_event_detail_count_is_not_multiplied_by_group_memberships(self):
        EventParticipant.objects.create(
            user=self.attendee_one,
            event=self.event,
            status=EventParticipant.STATUS_ATTENDING,
            queue_position=0,
        )
        EventParticipant.objects.create(
            user=self.attendee_two,
            event=self.event,
            status=EventParticipant.STATUS_ATTENDING,
            queue_position=0,
        )
        EventParticipant.objects.create(
            user=self.waiting_user,
            event=self.event,
            status=EventParticipant.STATUS_WAITING,
            queue_position=1,
        )

        self.client.force_authenticate(self.viewer)
        response = self.client.get(f"/api/events/{self.event.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["attending_count"], 2)
        self.assertEqual(response.data["waiting_count"], 1)

    def test_group_events_counter_stays_stable_after_waiting_user_promotion(self):
        self.client.force_authenticate(self.attendee_one)
        self.assertEqual(
            self.client.post(f"/api/events/{self.event.id}/join/").data["status"],
            EventParticipant.STATUS_ATTENDING,
        )

        self.client.force_authenticate(self.attendee_two)
        self.assertEqual(
            self.client.post(f"/api/events/{self.event.id}/join/").data["status"],
            EventParticipant.STATUS_ATTENDING,
        )

        self.client.force_authenticate(self.waiting_user)
        self.assertEqual(
            self.client.post(f"/api/events/{self.event.id}/join/").data["status"],
            EventParticipant.STATUS_WAITING,
        )

        self.client.force_authenticate(self.attendee_one)
        leave_response = self.client.post(f"/api/events/{self.event.id}/leave/")
        self.assertEqual(leave_response.status_code, 200)

        self.client.force_authenticate(self.viewer)
        events_response = self.client.get(f"/api/groups/{self.group.id}/events/")
        self.assertEqual(events_response.status_code, 200)
        event_data = events_response.data["results"][0]
        self.assertEqual(event_data["attending_count"], 2)
        self.assertEqual(event_data["waiting_count"], 0)
