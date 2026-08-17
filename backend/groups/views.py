from django.db import transaction
from django.db.models import Count
from rest_framework import decorators, permissions, response, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from events.models import Event
from events.serializers import EventSerializer
from notifications.models import Notification
from notifications.services import notify_group_members
from .models import Group, GroupMembership
from .serializers import GroupDetailSerializer, GroupSerializer, GroupMembershipSerializer


def user_is_group_admin(user, group):
    if not user.is_authenticated:
        return False
    return group.memberships.filter(
        user=user,
        role__in=[GroupMembership.ROLE_OWNER, GroupMembership.ROLE_ADMIN],
    ).exists()


class IsGroupAdminOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return user_is_group_admin(request.user, obj)


class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsGroupAdminOrReadOnly]

    def get_queryset(self):
        qs = Group.objects.select_related("owner").prefetch_related(
            "memberships", "memberships__user"
        ).annotate(
            member_count=Count(
                "memberships",
                distinct=True,
            )
        )

        sport = self.request.query_params.get("sport")
        level = self.request.query_params.get("level")
        if sport:
            qs = qs.filter(sport__iexact=sport)
        if level:
            qs = qs.filter(levels__contains=[level])
        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return GroupDetailSerializer
        return GroupSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            group = serializer.save(owner=self.request.user)
            GroupMembership.objects.create(
                group=group,
                user=self.request.user,
                role=GroupMembership.ROLE_OWNER,
            )

    def perform_update(self, serializer):
        with transaction.atomic():
            group = serializer.save()
            notify_group_members(
                group=group,
                actor=self.request.user,
                notification_type=Notification.TYPE_GROUP_UPDATED,
                payload={"group_id": str(group.pk)},
                target_url=f"/groups/{group.pk}",
            )

    def perform_destroy(self, instance):
        with transaction.atomic():
            notify_group_members(
                group=instance,
                actor=self.request.user,
                notification_type=Notification.TYPE_GROUP_DELETED,
                payload={"group_id": str(instance.pk), "group_name": instance.name},
                target_url="/groups",
            )
            instance.delete()

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        group = self.get_object()
        with transaction.atomic():
            group = Group.objects.select_for_update().get(pk=group.pk)
            existing = GroupMembership.objects.filter(group=group, user=request.user).first()
            if existing:
                return response.Response(
                    {
                        "detail": "You are already a member of this group.",
                        "id": existing.pk,
                        "role": existing.role,
                    },
                    status=status.HTTP_200_OK,
                )
            member_count = GroupMembership.objects.filter(
                group=group,
            ).count()
            if group.max_members and member_count >= group.max_members:
                raise ValidationError("This group has reached its member limit.")
            membership = GroupMembership.objects.create(
                group=group, user=request.user,
            )
            notify_group_members(
                group=group,
                actor=request.user,
                notification_type=Notification.TYPE_GROUP_MEMBER_JOINED,
                payload={
                    "group_id": str(group.pk),
                    "membership_id": membership.pk,
                },
                target_url=f"/groups/{group.pk}",
            )
        return response.Response(
            GroupMembershipSerializer(membership, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        group = self.get_object()
        membership = GroupMembership.objects.filter(group=group, user=request.user).first()
        if not membership:
            raise ValidationError("You are not a member of this group.")
        if membership.role == GroupMembership.ROLE_OWNER:
            raise ValidationError("Transfer ownership before leaving this group.")
        with transaction.atomic():
            notify_group_members(
                group=group,
                actor=request.user,
                notification_type=Notification.TYPE_GROUP_MEMBER_LEFT,
                payload={
                    "group_id": str(group.pk),
                    "membership_id": membership.pk,
                },
                target_url=f"/groups/{group.pk}",
            )
            membership.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    @decorators.action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def members(self, request, pk=None):
        group = self.get_object()
        memberships = group.memberships.select_related("user")
        return response.Response(GroupMembershipSerializer(memberships, many=True, context={"request": request}).data)

    @decorators.action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def events(self, request, pk=None):
        group = self.get_object()
        is_member = group.memberships.filter(
            user=request.user,
        ).exists() if request.user.is_authenticated else False

        if request.method == "POST":
            if not request.user.is_authenticated or group.owner_id != request.user.id:
                raise PermissionDenied("Only the group owner can create group events.")
            serializer = EventSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            with transaction.atomic():
                event = serializer.save(creator=request.user, group=group)
                notify_group_members(
                    group=group,
                    actor=request.user,
                    notification_type=Notification.TYPE_GROUP_EVENT_CREATED,
                    payload={"group_id": str(group.pk), "event_id": str(event.pk)},
                    target_url=f"/events/{event.pk}",
                )
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)

        events = group.events.select_related("creator", "group").prefetch_related(
            "participants", "participants__user"
        )
        if not is_member:
            events = events.filter(visibility=Event.VISIBILITY_PUBLIC)
        return response.Response(EventSerializer(events, many=True, context={"request": request}).data)
