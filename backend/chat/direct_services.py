from django.db import transaction

from notifications.models import Notification
from notifications.services import create_notification
from social.models import Friendship

from .models import DirectConversation, DirectMessage


class DirectMessageError(ValueError):
    """A user-facing error for private messaging access or content."""


def accepted_friendship_between(*, first, second):
    if first.pk == second.pk:
        return None
    user_low, user_high = sorted(
        (first, second),
        key=lambda user: str(user.pk),
    )
    return Friendship.objects.filter(
        user_low=user_low,
        user_high=user_high,
        status=Friendship.STATUS_ACCEPTED,
    ).first()


@transaction.atomic
def get_or_create_conversation(*, actor, target):
    friendship = accepted_friendship_between(first=actor, second=target)
    if friendship is None:
        raise DirectMessageError("Personal messages are available between friends only.")
    conversation, created = DirectConversation.objects.get_or_create(friendship=friendship)
    return conversation, created


@transaction.atomic
def create_direct_message(*, conversation, sender, text):
    conversation = (
        DirectConversation.objects.select_for_update()
        .select_related("friendship")
        .get(pk=conversation.pk)
    )
    friendship = conversation.friendship
    if friendship.status != Friendship.STATUS_ACCEPTED:
        raise DirectMessageError("Personal messages are available between friends only.")
    if sender.pk not in {friendship.user_low_id, friendship.user_high_id}:
        raise DirectMessageError("You cannot access this conversation.")

    cleaned_text = text.strip()
    if not cleaned_text:
        raise DirectMessageError("Message text is required.")

    message = DirectMessage.objects.create(
        conversation=conversation,
        sender=sender,
        text=cleaned_text,
    )
    conversation.save(update_fields=["updated_at"])

    recipient = (
        friendship.user_high
        if sender.pk == friendship.user_low_id
        else friendship.user_low
    )
    create_notification(
        recipient=recipient,
        actor=sender,
        notification_type=Notification.TYPE_DIRECT_MESSAGE,
        payload={
            "conversation_id": str(conversation.pk),
            "message_id": str(message.pk),
        },
        target_url=f"/chats?conversationId={conversation.pk}",
    )
    return message
