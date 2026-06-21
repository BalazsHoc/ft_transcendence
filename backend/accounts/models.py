import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district=models.CharField(max_length=100, blank=True)
    languages=models.JSONField(default=list, blank=True)
    interests=models.JSONField(default=list, blank=True)
    avatar=models.URLField(blank=True, null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.username
