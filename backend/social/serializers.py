from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserPublicSerializer
from accounts.presence import is_user_online
from .models import Friendship

User = get_user_model()


class UserSearchSerializer(serializers.ModelSerializer):
    """Public user payload; deliberately omits email and auth fields."""

    friendship_status = serializers.SerializerMethodField()
    friendship_id = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "district",
            "bio",
            "languages",
            "interests",
            "avatar",
            "is_online",
            "last_seen",
            "created_at",
            "friendship_status",
            "friendship_id",
        ]
        read_only_fields = fields

    def get_friendship_status(self, obj):
        relation_map = self.context.get("friendship_by_user", {})
        friendship = relation_map.get(obj.pk)
        if friendship is None:
            return "none"
        if friendship.status == Friendship.STATUS_PENDING:
            request = self.context.get("request")
            if request and friendship.requested_by_id == request.user.pk:
                return "outgoing_pending"
            return "incoming_pending"
        return friendship.status

    def get_friendship_id(self, obj):
        friendship = self.context.get("friendship_by_user", {}).get(obj.pk)
        return friendship.pk if friendship else None

    def get_is_online(self, obj) -> bool:
        return is_user_online(obj.pk)


class FriendshipSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()
    requester = UserPublicSerializer(source="requested_by", read_only=True)

    class Meta:
        model = Friendship
        fields = [
            "id",
            "friend",
            "requester",
            "requested_by",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_friend(self, obj):
        request = self.context.get("request")
        if request and request.user.pk == obj.user_low_id:
            user = obj.user_high
        else:
            user = obj.user_low
        return UserPublicSerializer(user, context=self.context).data


class FriendRequestCreateSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(source="target_user", queryset=User.objects.all())
