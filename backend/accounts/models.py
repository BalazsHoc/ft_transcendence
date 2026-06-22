import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import FileExtensionValidator

class User(AbstractUser):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district=models.CharField(max_length=100, blank=True)
    languages=models.JSONField(default=list, blank=True)
    interests=models.JSONField(default=list, blank=True)
    avatar=models.FileField(
        upload_to='avatars/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg','jpeg','png','gif','webp'])],
    )
    created_at=models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.username
