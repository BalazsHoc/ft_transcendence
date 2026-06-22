import uuid
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.core.validators import FileExtensionValidator

class Event(models.Model):
    LEVEL_CHOICES=(('beginner','Beginner'),('intermediate','Intermediate'),('advanced','Advanced'),('all','All levels'))
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title=models.CharField(max_length=200)
    description=models.TextField(blank=True)
    image=models.FileField(
        upload_to='event-images/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg','jpeg','png','gif','webp'])],
    )
    sport=models.CharField(max_length=50)
    level=models.CharField(max_length=20, choices=LEVEL_CHOICES, default='all')
    languages=models.JSONField(default=list, blank=True)
    location_name=models.CharField(max_length=255)
    location_address=models.CharField(max_length=512, blank=True)
    latitude=models.FloatField()
    longitude=models.FloatField()
    start_at=models.DateTimeField()
    end_at=models.DateTimeField()
    max_slots=models.PositiveIntegerField(default=0)
    creator=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='created_events')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=['start_at']
        indexes=[models.Index(fields=['sport']),models.Index(fields=['start_at']),models.Index(fields=['level'])]
    def __str__(self): return self.title
    # @property
    # def attending_count(self): return self.participants.filter(status=EventParticipant.STATUS_ATTENDING).count()
    # @property
    # def waiting_count(self): return self.participants.filter(status=EventParticipant.STATUS_WAITING).count()
    def has_free_slots(self):
        return self.participants.filter(
            status=EventParticipant.STATUS_ATTENDING
        ).count() < self.max_slots

class EventParticipant(models.Model):
    STATUS_ATTENDING='attending'
    STATUS_WAITING='waiting'
    STATUS_CHOICES=((STATUS_ATTENDING,'Attending'),(STATUS_WAITING,'Waiting'))
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='event_participations')
    event=models.ForeignKey(Event,on_delete=models.CASCADE,related_name='participants')
    status=models.CharField(max_length=20, choices=STATUS_CHOICES)
    queue_position=models.PositiveIntegerField(default=0)
    joined_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['user','event'],name='unique_user_event_participation'),models.UniqueConstraint(fields=['event','queue_position'],condition=Q(status='waiting'),name='unique_waiting_position_per_event')]
        ordering=['status','queue_position','joined_at']
    def __str__(self): return f'{self.user} -> {self.event} ({self.status})'
