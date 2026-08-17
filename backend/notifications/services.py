from django.db import IntegrityError, transaction

from .models import Notification


def create_notification(
    *,
    recipient,
    actor=None,
    notification_type,
    payload=None,
    target_url="",
    dedupe_key=None,
):
    """Create a notification, returning an existing deduped row when present."""

    defaults = {
        "actor": actor,
        "type": notification_type,
        "payload": payload or {},
        "target_url": target_url,
    }
    if dedupe_key is None:
        return Notification.objects.create(recipient=recipient, **defaults)
    try:
        with transaction.atomic():
            notification, _ = Notification.objects.get_or_create(
                recipient=recipient,
                dedupe_key=dedupe_key,
                defaults=defaults,
            )
            return notification
    except IntegrityError:
        return Notification.objects.get(recipient=recipient, dedupe_key=dedupe_key)


def notify_users(
    *,
    users,
    actor=None,
    notification_type,
    payload=None,
    target_url="",
    dedupe_key=None,
):
    """Create one recipient-only notification for each unique user."""

    recipients = {}
    for user in users:
        if actor is not None and user.pk == actor.pk:
            continue
        recipients[user.pk] = user

    notifications = []
    for recipient in recipients.values():
        notifications.append(
            create_notification(
                recipient=recipient,
                actor=actor,
                notification_type=notification_type,
                payload=payload,
                target_url=target_url,
                dedupe_key=dedupe_key,
            )
        )
    return notifications


def notify_group_members(
    *,
    group,
    actor=None,
    notification_type,
    payload=None,
    target_url="",
    roles=None,
):
    """Notify group members, optionally limiting recipients by role."""

    from groups.models import GroupMembership

    memberships = GroupMembership.objects.filter(group=group).select_related("user")
    if roles:
        memberships = memberships.filter(role__in=roles)
    return notify_users(
        users=(membership.user for membership in memberships),
        actor=actor,
        notification_type=notification_type,
        payload=payload,
        target_url=target_url,
    )


def notify_group_admins(
    *,
    group,
    actor=None,
    notification_type,
    payload=None,
    target_url="",
):
    """Notify group owners and admins."""

    from groups.models import GroupMembership

    return notify_group_members(
        group=group,
        actor=actor,
        notification_type=notification_type,
        payload=payload,
        target_url=target_url,
        roles=(GroupMembership.ROLE_OWNER, GroupMembership.ROLE_ADMIN),
    )


def notify_event_audience(
    *,
    event,
    actor=None,
    notification_type,
    payload=None,
    target_url="",
):
    """Notify event participants and members of an optional group."""

    from groups.models import GroupMembership

    users = [participant.user for participant in event.participants.select_related("user")]
    if event.group_id:
        memberships = GroupMembership.objects.filter(
            group_id=event.group_id,
        ).select_related("user")
        users.extend(membership.user for membership in memberships)
    return notify_users(
        users=users,
        actor=actor,
        notification_type=notification_type,
        payload=payload,
        target_url=target_url,
    )
