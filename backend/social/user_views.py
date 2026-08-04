from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions

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
