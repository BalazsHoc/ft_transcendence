from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_FRIEND_REQUEST = "friend_request"
    TYPE_FRIEND_ACCEPTED = "friend_accepted"
    TYPE_FRIEND_REJECTED = "friend_rejected"
    TYPE_FRIEND_REMOVED = "friend_removed"
    TYPE_DIRECT_MESSAGE = "direct_message"
    TYPE_GROUP_MESSAGE = "group_message"
    TYPE_GROUP_UPDATED = "group_updated"
    TYPE_GROUP_DELETED = "group_deleted"
    TYPE_GROUP_EVENT_CREATED = "group_event_created"
    TYPE_GROUP_EVENT_UPDATED = "group_event_updated"
    TYPE_GROUP_EVENT_DELETED = "group_event_deleted"
    TYPE_GROUP_JOIN_REQUEST = "group_join_request"
    TYPE_GROUP_JOIN_REQUEST_CANCELLED = "group_join_request_cancelled"
    TYPE_GROUP_MEMBER_JOINED = "group_member_joined"
    TYPE_GROUP_MEMBER_LEFT = "group_member_left"
    TYPE_EVENT_UPDATED = "event_updated"
    TYPE_EVENT_DELETED = "event_deleted"
    TYPE_EVENT_PARTICIPANT_JOINED = "event_participant_joined"
    TYPE_EVENT_PARTICIPANT_LEFT = "event_participant_left"
    TYPE_EVENT_PARTICIPANT_PROMOTED = "event_participant_promoted"
    TYPE_CHOICES = (
        (TYPE_FRIEND_REQUEST, "Friend request"),
        (TYPE_FRIEND_ACCEPTED, "Friend request accepted"),
        (TYPE_FRIEND_REJECTED, "Friend request rejected"),
        (TYPE_FRIEND_REMOVED, "Friend removed"),
        (TYPE_DIRECT_MESSAGE, "Direct message"),
        (TYPE_GROUP_MESSAGE, "Group message"),
        (TYPE_GROUP_UPDATED, "Group updated"),
        (TYPE_GROUP_DELETED, "Group deleted"),
        (TYPE_GROUP_EVENT_CREATED, "Group event created"),
        (TYPE_GROUP_EVENT_UPDATED, "Group event updated"),
        (TYPE_GROUP_EVENT_DELETED, "Group event deleted"),
        (TYPE_GROUP_JOIN_REQUEST, "Group join request"),
        (TYPE_GROUP_JOIN_REQUEST_CANCELLED, "Group join request cancelled"),
        (TYPE_GROUP_MEMBER_JOINED, "Group member joined"),
        (TYPE_GROUP_MEMBER_LEFT, "Group member left"),
        (TYPE_EVENT_UPDATED, "Event updated"),
        (TYPE_EVENT_DELETED, "Event deleted"),
        (TYPE_EVENT_PARTICIPANT_JOINED, "Event participant joined"),
        (TYPE_EVENT_PARTICIPANT_LEFT, "Event participant left"),
        (TYPE_EVENT_PARTICIPANT_PROMOTED, "Event participant promoted"),
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications_triggered",
    )
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    payload = models.JSONField(default=dict, blank=True)
    target_url = models.CharField(max_length=255, blank=True)
    dedupe_key = models.CharField(max_length=255, null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["recipient", "dedupe_key"],
                condition=models.Q(dedupe_key__isnull=False),
                name="notifications_unique_recipient_dedupe",
            ),
        ]
        indexes = [
            models.Index(
                fields=["recipient", "read_at", "created_at"],
                name="notif_recipient_read_created",
            ),
            models.Index(
                fields=["recipient", "created_at"],
                name="notif_recipient_created",
            ),
        ]

    def __str__(self):
        return f"{self.type} for {self.recipient_id}"
