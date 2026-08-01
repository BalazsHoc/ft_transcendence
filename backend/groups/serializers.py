from django.db.models import Count, Q
from rest_framework import serializers

from accounts.serializers import UserPublicSerializer
from .models import Group, GroupMembership


class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = GroupMembership
        fields = ["id", "user", "role", "status", "joined_at"]
        read_only_fields = fields


class GroupSerializer(serializers.ModelSerializer):
    owner = UserPublicSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    current_user_membership = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id", "name", "description", "sport", "levels", "kind", "visibility",
            "join_policy", "max_members", "languages", "location_name", "location_address",
            "cover_image", "owner", "is_active", "member_count", "current_user_membership",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "owner", "is_active", "member_count", "current_user_membership",
            "created_at", "updated_at",
        ]

    def get_current_user_membership(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        if not membership:
            return None
        return {"role": membership.role, "status": membership.status}

    def validate_levels(self, levels):
        if not isinstance(levels, list) or not levels:
            raise serializers.ValidationError("Provide at least one level.")
        if len(levels) != len(set(levels)):
            raise serializers.ValidationError("Levels must not contain duplicates.")
        invalid = set(levels) - Group.LEVEL_CHOICES
        if invalid:
            raise serializers.ValidationError(f"Unsupported levels: {', '.join(sorted(invalid))}.")
        return levels

    def validate(self, attrs):
        if attrs.get("visibility") == Group.VISIBILITY_PRIVATE and attrs.get(
            "join_policy"
        ) == Group.JOIN_OPEN:
            raise serializers.ValidationError(
                "Private groups must require approval or be invite only."
            )
        return attrs


class GroupDetailSerializer(GroupSerializer):
    memberships = GroupMembershipSerializer(many=True, read_only=True)

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ["memberships"]


class GroupSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "sport", "visibility"]
