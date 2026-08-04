from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Friendship(models.Model):
    """A canonical, bidirectional relationship between two users.

    ``user_low`` and ``user_high`` are always stored in deterministic order by
    the service layer. Keeping one row per pair makes duplicate requests and
    privacy checks straightforward.
    """

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_BLOCKED = "blocked"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_BLOCKED, "Blocked"),
    )

    user_low = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_as_low",
    )
    user_high = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_as_high",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendship_requests_created",
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user_low", "user_high"],
                name="social_unique_friendship_pair",
            ),
            models.CheckConstraint(
                condition=~models.Q(user_low=models.F("user_high")),
                name="social_friendship_users_differ",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(requested_by=models.F("user_low"))
                    | models.Q(requested_by=models.F("user_high"))
                ),
                name="social_requester_is_participant",
            ),
        ]
        indexes = [
            models.Index(fields=["user_low", "status"], name="social_friend_low_status"),
            models.Index(fields=["user_high", "status"], name="social_friend_high_status"),
            models.Index(fields=["requested_by", "status"], name="social_friend_requester_status"),
        ]

    def clean(self):
        if self.user_low_id == self.user_high_id:
            raise ValidationError("A user cannot be friends with themselves.")
        if self.requested_by_id not in {self.user_low_id, self.user_high_id}:
            raise ValidationError("The requester must be one of the friendship participants.")

    def __str__(self):
        return f"{self.user_low_id} ↔ {self.user_high_id} ({self.status})"
