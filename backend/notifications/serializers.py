from rest_framework import serializers

from accounts.serializers import UserPublicSerializer
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserPublicSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "actor",
            "type",
            "payload",
            "target_url",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields
