from django.db import transaction
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework.exceptions import NotFound
from notifications.models import Notification
from notifications.services import create_notification, notify_event_audience
from .models import Event, EventParticipant
from .serializers import EventSerializer
from chat.models import Message
from chat.serializers import MessageSerializer

class IsCreatorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS: return True
        if obj.creator == request.user:
            return True
        if not obj.group:
            return False
        return obj.group.memberships.filter(
            user=request.user,
            role__in=['owner', 'admin'],
        ).exists()

class EventViewSet(viewsets.ModelViewSet):
    serializer_class=EventSerializer
    permission_classes=[permissions.IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]
    def get_queryset(self):
        qs=Event.objects.select_related('creator','group').prefetch_related('participants','participants__user').annotate(attending_count=Count('participants', filter=Q(participants__status=EventParticipant.STATUS_ATTENDING)), waiting_count=Count('participants', filter=Q(participants__status=EventParticipant.STATUS_WAITING)))
        if self.request.user.is_authenticated:
            qs=qs.filter(Q(visibility=Event.VISIBILITY_PUBLIC) | Q(creator=self.request.user) | Q(group__memberships__user=self.request.user)).distinct()
        else:
            qs=qs.filter(visibility=Event.VISIBILITY_PUBLIC)
        sport=self.request.query_params.get('sport'); level=self.request.query_params.get('level'); language=self.request.query_params.get('language')
        if sport: qs=qs.filter(sport__iexact=sport)
        if level: qs=qs.filter(level=level)
        if language: qs=qs.filter(languages__contains=[language])
        return qs
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            event = serializer.save()
            notification_type = (
                Notification.TYPE_GROUP_EVENT_UPDATED
                if event.group_id
                else Notification.TYPE_EVENT_UPDATED
            )
            notify_event_audience(
                event=event,
                actor=self.request.user,
                notification_type=notification_type,
                payload={
                    "event_id": str(event.pk),
                    "group_id": str(event.group_id) if event.group_id else None,
                },
                target_url=f"/events/{event.pk}",
            )

    def perform_destroy(self, instance):
        with transaction.atomic():
            notification_type = (
                Notification.TYPE_GROUP_EVENT_DELETED
                if instance.group_id
                else Notification.TYPE_EVENT_DELETED
            )
            notify_event_audience(
                event=instance,
                actor=self.request.user,
                notification_type=notification_type,
                payload={
                    "event_id": str(instance.pk),
                    "event_title": instance.title,
                    "group_id": str(instance.group_id) if instance.group_id else None,
                },
                target_url=(f"/groups/{instance.group_id}" if instance.group_id else "/discover"),
            )
            instance.delete()

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        event=self.get_object()
        if event.visibility == Event.VISIBILITY_PRIVATE and event.group and not event.group.memberships.filter(user=request.user).exists():
            return response.Response({'detail':'Join the group before joining this private event.'}, status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            event=Event.objects.select_for_update().get(pk=event.pk)
            existing=EventParticipant.objects.filter(user=request.user,event=event).first()
            if existing: return response.Response({'detail':'You have already joined this event.','status':existing.status}, status=200)
            attending_count=EventParticipant.objects.filter(event=event,status=EventParticipant.STATUS_ATTENDING).count()
            if attending_count < event.max_slots:
                p=EventParticipant.objects.create(user=request.user,event=event,status=EventParticipant.STATUS_ATTENDING,queue_position=0)
            else:
                last=EventParticipant.objects.filter(event=event,status=EventParticipant.STATUS_WAITING).order_by('-queue_position').first()
                next_pos=(last.queue_position+1) if last else 1
                p=EventParticipant.objects.create(user=request.user,event=event,status=EventParticipant.STATUS_WAITING,queue_position=next_pos)
            if event.creator_id != request.user.id:
                create_notification(
                    recipient=event.creator,
                    actor=request.user,
                    notification_type=Notification.TYPE_EVENT_PARTICIPANT_JOINED,
                    payload={
                        "event_id": str(event.pk),
                        "participant_id": p.pk,
                        "status": p.status,
                    },
                    target_url=f"/events/{event.pk}",
                )
        return response.Response({'success':True,'status':p.status,'queue_position':p.queue_position}, status=201)
    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        event=self.get_object(); promoted_user_id=None
        with transaction.atomic():
            event=Event.objects.select_for_update().get(pk=event.pk)
            p=EventParticipant.objects.filter(user=request.user,event=event).first()
            if not p: raise NotFound('You are not participating in this event.')
            was_attending=p.status==EventParticipant.STATUS_ATTENDING
            p.delete()
            if was_attending:
                next_w=EventParticipant.objects.filter(event=event,status=EventParticipant.STATUS_WAITING).order_by('queue_position','joined_at').first()
                if next_w:
                    next_w.status=EventParticipant.STATUS_ATTENDING; next_w.queue_position=0; next_w.save(update_fields=['status','queue_position'])
                    promoted_user_id=str(next_w.user_id)
                    waiting=EventParticipant.objects.filter(event=event,status=EventParticipant.STATUS_WAITING).order_by('queue_position','joined_at')
                    for i,item in enumerate(waiting,start=1):
                        if item.queue_position != i:
                            item.queue_position=i; item.save(update_fields=['queue_position'])
                    promoted_user = next_w.user
                else:
                    promoted_user = None
            else:
                promoted_user = None
            if event.creator_id != request.user.id:
                create_notification(
                    recipient=event.creator,
                    actor=request.user,
                    notification_type=Notification.TYPE_EVENT_PARTICIPANT_LEFT,
                    payload={
                        "event_id": str(event.pk),
                        "participant_id": p.pk,
                    },
                    target_url=f"/events/{event.pk}",
                )
            if promoted_user is not None and promoted_user.pk != request.user.pk:
                create_notification(
                    recipient=promoted_user,
                    actor=request.user,
                    notification_type=Notification.TYPE_EVENT_PARTICIPANT_PROMOTED,
                    payload={
                        "event_id": str(event.pk),
                        "participant_id": promoted_user.pk,
                    },
                    target_url=f"/events/{event.pk}",
                )
        return response.Response({'success':True,'promoted_user_id':promoted_user_id})
    @decorators.action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def messages(self, request, pk=None):
        event=self.get_object()
        qs=Message.objects.filter(event=event).select_related('sender').order_by('created_at')
        return response.Response(MessageSerializer(qs,many=True).data)
