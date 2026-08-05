from django.db import IntegrityError, transaction

from notifications.services import create_notification

from .models import Friendship


class FriendshipError(ValueError):
    """A user-facing friendship state or permission error."""


def _user_key(user):
    return str(user.pk)


def canonical_pair(first, second):
    if first.pk == second.pk:
        raise FriendshipError("You cannot send a friend request to yourself.")
    return (first, second) if _user_key(first) < _user_key(second) else (second, first)


def send_friend_request(*, actor, target):
    user_low, user_high = canonical_pair(actor, target)
    try:
        with transaction.atomic():
            friendship = (
                Friendship.objects.select_for_update()
                .filter(user_low=user_low, user_high=user_high)
                .first()
            )
            if friendship is None:
                friendship = Friendship.objects.create(
                    user_low=user_low,
                    user_high=user_high,
                    requested_by=actor,
                    status=Friendship.STATUS_PENDING,
                )
            elif friendship.status == Friendship.STATUS_REJECTED:
                friendship.requested_by = actor
                friendship.status = Friendship.STATUS_PENDING
                friendship.save(update_fields=["requested_by", "status", "updated_at"])
            elif friendship.status == Friendship.STATUS_PENDING:
                raise FriendshipError("A friend request is already pending.")
            elif friendship.status == Friendship.STATUS_ACCEPTED:
                raise FriendshipError("You are already friends with this user.")
            else:
                raise FriendshipError("This friendship is blocked.")

            create_notification(
                recipient=target,
                actor=actor,
                notification_type="friend_request",
                payload={"friendship_id": str(friendship.pk)},
                target_url="/profile#friends-incoming",
            )
    except IntegrityError as exc:
        raise FriendshipError("A friend request already exists for this user pair.") from exc
    return friendship


def accept_friend_request(*, friendship, actor):
    with transaction.atomic():
        friendship = Friendship.objects.select_for_update().select_related(
            "user_low", "user_high", "requested_by"
        ).get(pk=friendship.pk)
        if actor.pk not in {friendship.user_low_id, friendship.user_high_id}:
            raise FriendshipError("You cannot access this friend request.")
        if friendship.status == Friendship.STATUS_ACCEPTED:
            return friendship
        if friendship.status != Friendship.STATUS_PENDING:
            raise FriendshipError("This friend request is no longer pending.")
        if friendship.requested_by_id == actor.pk:
            raise FriendshipError("Only the recipient can accept this request.")

        friendship.status = Friendship.STATUS_ACCEPTED
        friendship.save(update_fields=["status", "updated_at"])
        create_notification(
            recipient=friendship.requested_by,
            actor=actor,
            notification_type="friend_accepted",
            payload={"friendship_id": str(friendship.pk)},
            target_url="/profile",
            dedupe_key=f"friend-accepted:{friendship.pk}",
        )
    return friendship


def reject_friend_request(*, friendship, actor):
    with transaction.atomic():
        friendship = Friendship.objects.select_for_update().get(pk=friendship.pk)
        if actor.pk not in {friendship.user_low_id, friendship.user_high_id}:
            raise FriendshipError("You cannot access this friend request.")
        if friendship.status == Friendship.STATUS_REJECTED:
            return friendship
        if friendship.status != Friendship.STATUS_PENDING:
            raise FriendshipError("This friend request is no longer pending.")
        if friendship.requested_by_id == actor.pk:
            raise FriendshipError("Only the recipient can reject this request.")
        friendship.status = Friendship.STATUS_REJECTED
        friendship.save(update_fields=["status", "updated_at"])
    return friendship


def remove_friend(*, friendship, actor):
    with transaction.atomic():
        friendship = Friendship.objects.select_for_update().get(pk=friendship.pk)
        if friendship.status != Friendship.STATUS_ACCEPTED:
            raise FriendshipError("Only accepted friendships can be removed.")
        if actor.pk not in {friendship.user_low_id, friendship.user_high_id}:
            raise FriendshipError("You cannot remove this friendship.")
        friendship.delete()
