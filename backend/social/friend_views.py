from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, response, status
from rest_framework.exceptions import ValidationError

from .models import Friendship
from .serializers import FriendshipSerializer, FriendRequestCreateSerializer
from .services import (
    FriendshipError,
    accept_friend_request,
    reject_friend_request,
    remove_friend,
    send_friend_request,
)


class UserFriendshipListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(user_low=self.request.user) | Q(user_high=self.request.user),
            status=Friendship.STATUS_ACCEPTED,
        ).select_related("user_low", "user_high", "requested_by")


class IncomingFriendRequestListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(
                user_low=self.request.user,
                status=Friendship.STATUS_PENDING,
                requested_by__isnull=False,
            )
            | Q(
                user_high=self.request.user,
                status=Friendship.STATUS_PENDING,
                requested_by__isnull=False,
            )
        ).exclude(requested_by=self.request.user).select_related(
            "user_low", "user_high", "requested_by"
        )


class OutgoingFriendRequestListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            requested_by=self.request.user,
            status=Friendship.STATUS_PENDING,
        ).select_related("user_low", "user_high", "requested_by")


class FriendRequestCreateView(generics.CreateAPIView):
    serializer_class = FriendRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            friendship = send_friend_request(
                actor=request.user,
                target=serializer.validated_data["target_user"],
            )
        except FriendshipError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        return response.Response(
            FriendshipSerializer(friendship, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FriendRequestActionView(generics.GenericAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            Friendship.objects.select_related("user_low", "user_high", "requested_by"),
            pk=self.kwargs["pk"],
        )

    def post(self, request, *args, **kwargs):
        friendship = self.get_object()
        try:
            if kwargs["action"] == "accept":
                friendship = accept_friend_request(friendship=friendship, actor=request.user)
            else:
                friendship = reject_friend_request(friendship=friendship, actor=request.user)
        except FriendshipError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        return response.Response(self.get_serializer(friendship).data)


class FriendDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(user_low=self.request.user) | Q(user_high=self.request.user),
            status=Friendship.STATUS_ACCEPTED,
        )

    def destroy(self, request, *args, **kwargs):
        friendship = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])
        try:
            remove_friend(friendship=friendship, actor=request.user)
        except FriendshipError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        return response.Response(status=status.HTTP_204_NO_CONTENT)
