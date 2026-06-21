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
