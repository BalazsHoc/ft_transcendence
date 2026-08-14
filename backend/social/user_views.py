from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions

from events.models import Event, EventParticipant
from events.serializers import EventSerializer
from .models import Friendship
from .serializers import UserSearchSerializer

User = get_user_model()


class UserSearchView(generics.ListAPIView):
    """Search public user profiles without exposing email addresses."""

    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        queryset = User.objects.exclude(pk=self.request.user.pk).order_by("username")
        if query:
            queryset = queryset.filter(
                Q(username__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            )
        return queryset[:50]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        relations = Friendship.objects.filter(
            Q(user_low=self.request.user) | Q(user_high=self.request.user)
        )
        context["friendship_by_user"] = {
            (
                relation.user_high_id
                if relation.user_low_id == self.request.user.pk
                else relation.user_low_id
            ): relation
            for relation in relations
        }
        return context


class UserProfileView(generics.RetrieveAPIView):
    """Return one public profile without exposing email or auth fields."""

    queryset = User.objects.all()
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        request = self.request
        if not request.user.is_authenticated:
            context["friendship_by_user"] = {}
            return context

        relations = Friendship.objects.filter(
            Q(user_low=request.user) | Q(user_high=request.user)
        )
        context["friendship_by_user"] = {
            (
                relation.user_high_id
                if relation.user_low_id == request.user.pk
                else relation.user_low_id
            ): relation
            for relation in relations
            if relation.user_low_id != relation.user_high_id
        }
        return context


class UserActivityView(generics.ListAPIView):
    """Return the public event history for a profile.

    A signed-in user can also see their own private events. Private events of
    another profile are intentionally excluded from this public timeline.
    """

    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        profile_user = get_object_or_404(User, pk=self.kwargs["pk"])
        queryset = (
            Event.objects.select_related("creator", "group")
            .prefetch_related("participants", "participants__user")
            .annotate(
                attending_count=Count(
                    "participants",
                    filter=Q(participants__status=EventParticipant.STATUS_ATTENDING),
                ),
                waiting_count=Count(
                    "participants",
                    filter=Q(participants__status=EventParticipant.STATUS_WAITING),
                ),
            )
            .filter(
                Q(creator=profile_user)
                | Q(participants__user=profile_user)
            )
        )

        request = self.request
        is_own_profile = request.user.is_authenticated and request.user.pk == profile_user.pk
        if not is_own_profile:
            queryset = queryset.filter(visibility=Event.VISIBILITY_PUBLIC)

        return queryset.distinct().order_by("start_at")
