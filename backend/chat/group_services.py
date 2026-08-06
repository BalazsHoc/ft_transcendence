from django.db import transaction

from notifications.models import Notification
from notifications.services import create_notification
from groups.models import Group, GroupMembership

from .models import GroupMessage


class GroupMessageError(ValueError):
    """A user-facing error for group chat access or content."""


def active_group_for_user(*, group_id, user):
    return Group.objects.filter(
        pk=group_id,
        memberships__user=user,
        memberships__status=GroupMembership.STATUS_ACTIVE,
    ).distinct().first()


@transaction.atomic
def create_group_message(*, group, sender, text):
    if not GroupMembership.objects.filter(
        group=group,
        user=sender,
        status=GroupMembership.STATUS_ACTIVE,
    ).exists():
        raise GroupMessageError("Only active group members can send messages.")

    cleaned_text = text.strip()
    if not cleaned_text:
        raise GroupMessageError("Message text is required.")

    message = GroupMessage.objects.create(
        group=group,
        sender=sender,
        text=cleaned_text,
    )
    target_url = f"/groups/{group.pk}#group-chat"
    members = GroupMembership.objects.filter(
        group=group,
        status=GroupMembership.STATUS_ACTIVE,
    ).exclude(user=sender).select_related("user")
    for membership in members:
        create_notification(
            recipient=membership.user,
            actor=sender,
            notification_type=Notification.TYPE_GROUP_MESSAGE,
            payload={
                "group_id": str(group.pk),
                "message_id": str(message.pk),
            },
            target_url=target_url,
        )
    return message
