import uuid
from django.conf import settings
from django.db import models
from events.models import Event


class Message(models.Model):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event=models.ForeignKey(Event,on_delete=models.CASCADE,related_name='messages')
    sender=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='messages')
    text=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=['created_at']
        indexes=[models.Index(fields=['event','created_at'])]
    def __str__(self): return f'{self.sender}: {self.text[:40]}'


class DirectConversation(models.Model):
    """One private conversation for an accepted friendship."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    friendship = models.OneToOneField(
        "social.Friendship",
        on_delete=models.CASCADE,
        related_name="direct_conversation",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Direct conversation {self.pk}"


class DirectMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        DirectConversation,
        on_delete=models.CASCADE,
        related_name="direct_messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="direct_messages_sent",
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="chat_direct_conv_created",
            ),
        ]

    def __str__(self):
        return f"{self.sender}: {self.text[:40]}"
