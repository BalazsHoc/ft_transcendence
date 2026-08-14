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
