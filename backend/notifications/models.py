from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_FRIEND_REQUEST = "friend_request"
    TYPE_FRIEND_ACCEPTED = "friend_accepted"
    TYPE_CHOICES = (
        (TYPE_FRIEND_REQUEST, "Friend request"),
        (TYPE_FRIEND_ACCEPTED, "Friend request accepted"),
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
