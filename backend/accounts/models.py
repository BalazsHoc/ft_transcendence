import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import FileExtensionValidator
from core.districts import DISTRICT_CHOICES

class User(AbstractUser):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district=models.CharField(max_length=4, choices=DISTRICT_CHOICES, blank=True)
    bio=models.TextField(blank=True)
    languages=models.JSONField(default=list, blank=True)
    interests=models.JSONField(default=list, blank=True)
    avatar=models.FileField(
        upload_to='avatars/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg','jpeg','png','gif','webp'])],
    )
    last_seen=models.DateTimeField(blank=True, null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.username


class PresenceSession(models.Model):
    """A live authenticated browser connection used to calculate presence."""

    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user=models.ForeignKey(User, on_delete=models.CASCADE, related_name='presence_sessions')
    connected_at=models.DateTimeField(auto_now_add=True)
    last_seen=models.DateTimeField(auto_now=True)

    class Meta:
        indexes=[models.Index(fields=['user', 'last_seen'], name='accounts_presence_user_seen')]

    def __str__(self): return f'{self.user_id} ({self.id})'
