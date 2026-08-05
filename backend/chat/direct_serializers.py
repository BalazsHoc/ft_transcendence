from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserPublicSerializer

from .models import DirectConversation, DirectMessage

User = get_user_model()


class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)

    class Meta:
        model = DirectMessage
        fields = ["id", "conversation", "sender", "text", "created_at"]
        read_only_fields = ["id", "conversation", "sender", "created_at"]


class DirectMessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=5000, trim_whitespace=True)


class DirectConversationSerializer(serializers.ModelSerializer):
    peer = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = DirectConversation
        fields = ["id", "peer", "last_message", "created_at", "updated_at"]
        read_only_fields = fields

    def get_peer(self, obj):
        request = self.context.get("request")
        current_user_id = request.user.pk if request else None
        friendship = obj.friendship
        peer = (
            friendship.user_high
            if friendship.user_low_id == current_user_id
            else friendship.user_low
        )
        return UserPublicSerializer(peer, context=self.context).data

    def get_last_message(self, obj):
        message = (
            obj.direct_messages.select_related("sender")
            .order_by("-created_at")
            .first()
        )
        if message is None:
            return None
        return DirectMessageSerializer(message, context=self.context).data


class DirectConversationCreateSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        source="target_user",
        queryset=User.objects.all(),
    )

    def validate_target_user(self, target):
        request = self.context.get("request")
        if request and target.pk == request.user.pk:
            raise serializers.ValidationError("You cannot start a conversation with yourself.")
        return target
