from rest_framework import serializers

from accounts.serializers import UserPublicSerializer
from events.models import Event
from groups.models import Group


class PublicUserSerializer(UserPublicSerializer):
    """Public profile data; deliberately excludes email and auth fields."""

    class Meta(UserPublicSerializer.Meta):
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
            "created_at",
        ]
        read_only_fields = fields


class PublicGroupSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "sport", "visibility"]
        read_only_fields = fields


class PublicGroupSerializer(serializers.ModelSerializer):
    owner = PublicUserSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "description",
            "sport",
            "levels",
            "kind",
            "visibility",
            "languages",
            "location_name",
            "location_address",
            "cover_image",
            "owner",
            "member_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PublicEventSerializer(serializers.ModelSerializer):
    creator = PublicUserSerializer(read_only=True)
    group = PublicGroupSummarySerializer(read_only=True)
    attending_count = serializers.IntegerField(read_only=True)
    waiting_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "image",
            "sport",
            "level",
            "languages",
            "location_name",
            "location_address",
            "latitude",
            "longitude",
            "start_at",
            "end_at",
            "max_slots",
            "creator",
            "group",
            "visibility",
            "attending_count",
            "waiting_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
