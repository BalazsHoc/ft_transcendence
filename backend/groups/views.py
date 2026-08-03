from django.db import transaction
from django.db.models import Count, Q
from rest_framework import decorators, permissions, response, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from events.models import Event
from events.serializers import EventSerializer
from .models import Group, GroupMembership
from .serializers import GroupDetailSerializer, GroupSerializer, GroupMembershipSerializer


def user_is_group_admin(user, group):
    if not user.is_authenticated:
        return False
    return group.memberships.filter(
        user=user,
        status=GroupMembership.STATUS_ACTIVE,
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
                filter=Q(memberships__status=GroupMembership.STATUS_ACTIVE),
                distinct=True,
            )
        )
        if self.request.user.is_authenticated:
            qs = qs.filter(
                Q(visibility=Group.VISIBILITY_PUBLIC)
                | Q(memberships__user=self.request.user)
            ).distinct()
        else:
            qs = qs.filter(visibility=Group.VISIBILITY_PUBLIC)

        sport = self.request.query_params.get("sport")
        level = self.request.query_params.get("level")
        kind = self.request.query_params.get("kind")
        if sport:
            qs = qs.filter(sport__iexact=sport)
        if level:
            qs = qs.filter(levels__contains=[level])
        if kind:
            qs = qs.filter(kind=kind)
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
                status=GroupMembership.STATUS_ACTIVE,
            )

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        group = self.get_object()
        with transaction.atomic():
            group = Group.objects.select_for_update().get(pk=group.pk)
            existing = GroupMembership.objects.filter(group=group, user=request.user).first()
            if existing:
                return response.Response(
                    {"detail": "You already have a membership request for this group.", "status": existing.status},
                    status=status.HTTP_200_OK,
                )
            if group.join_policy == Group.JOIN_INVITE_ONLY:
                raise PermissionDenied("This group is invite only.")
            member_count = GroupMembership.objects.filter(
                group=group, status=GroupMembership.STATUS_ACTIVE
            ).count()
            if group.max_members and member_count >= group.max_members:
                raise ValidationError("This group has reached its member limit.")
            membership_status = (
                GroupMembership.STATUS_PENDING
                if group.join_policy == Group.JOIN_APPROVAL
                else GroupMembership.STATUS_ACTIVE
            )
            membership = GroupMembership.objects.create(
                group=group, user=request.user, status=membership_status
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
        membership.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    @decorators.action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def members(self, request, pk=None):
        group = self.get_object()
        if group.visibility == Group.VISIBILITY_PRIVATE and not group.memberships.filter(
            user=request.user, status=GroupMembership.STATUS_ACTIVE
        ).exists():
            raise PermissionDenied("Only members can view this group's member list.")
        memberships = group.memberships.select_related("user")
        return response.Response(GroupMembershipSerializer(memberships, many=True, context={"request": request}).data)

    @decorators.action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def events(self, request, pk=None):
        group = self.get_object()
        is_member = group.memberships.filter(
            user=request.user,
            status=GroupMembership.STATUS_ACTIVE,
        ).exists() if request.user.is_authenticated else False

        if request.method == "POST":
            if not user_is_group_admin(request.user, group):
                raise PermissionDenied("Only group owners and admins can create group events.")
            serializer = EventSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save(creator=request.user, group=group)
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)

        events = group.events.select_related("creator", "group").prefetch_related(
            "participants", "participants__user"
        )
        if not is_member:
            events = events.filter(visibility=Event.VISIBILITY_PUBLIC)
        return response.Response(EventSerializer(events, many=True, context={"request": request}).data)
