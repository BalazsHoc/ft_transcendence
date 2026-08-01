import uuid

from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class Group(models.Model):
    VISIBILITY_PUBLIC = "public"
    VISIBILITY_PRIVATE = "private"
    VISIBILITY_CHOICES = (
        (VISIBILITY_PUBLIC, "Public"),
        (VISIBILITY_PRIVATE, "Private"),
    )

    JOIN_OPEN = "open"
    JOIN_APPROVAL = "approval"
    JOIN_INVITE_ONLY = "invite_only"
    JOIN_POLICY_CHOICES = (
        (JOIN_OPEN, "Open"),
        (JOIN_APPROVAL, "Requires approval"),
        (JOIN_INVITE_ONLY, "Invite only"),
    )

    KIND_TRAINING = "training"
    KIND_SOCIAL = "social"
    KIND_COMPETITIVE = "competitive"
    KIND_TEAM = "team"
    KIND_CHOICES = (
        (KIND_TRAINING, "Training"),
        (KIND_SOCIAL, "Social"),
        (KIND_COMPETITIVE, "Competitive"),
        (KIND_TEAM, "Team"),
    )

    LEVEL_CHOICES = {"beginner", "intermediate", "advanced", "all"}

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    sport = models.CharField(max_length=50)
    levels = models.JSONField(default=list, blank=True)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default=KIND_TRAINING)
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default=VISIBILITY_PUBLIC,
    )
    join_policy = models.CharField(
        max_length=20,
        choices=JOIN_POLICY_CHOICES,
        default=JOIN_OPEN,
    )
    max_members = models.PositiveIntegerField(
        default=0,
        help_text="0 means the group has no membership limit.",
    )
    languages = models.JSONField(default=list, blank=True)
    location_name = models.CharField(max_length=255, blank=True)
    location_address = models.CharField(max_length=512, blank=True)
    cover_image = models.FileField(
        upload_to="group-images/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "gif", "webp"])],
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_groups",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["sport"], name="groups_grou_sport_8b55b4_idx"),
            models.Index(fields=["visibility"], name="groups_grou_visibil_7d5444_idx"),
            models.Index(fields=["is_active"], name="groups_grou_is_acti_04bc24_idx"),
        ]

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_MEMBER = "member"
    ROLE_CHOICES = (
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_MEMBER, "Member"),
    )

    STATUS_ACTIVE = "active"
    STATUS_PENDING = "pending"
    STATUS_CHOICES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_PENDING, "Pending"),
    )

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["role", "joined_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["group", "user"],
                name="unique_group_membership",
            )
        ]

    def __str__(self):
        return f"{self.user} -> {self.group} ({self.role})"
