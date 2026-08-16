from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from .models import PresenceSession


PRESENCE_HEARTBEAT_SECONDS = 30
PRESENCE_TIMEOUT_SECONDS = PRESENCE_HEARTBEAT_SECONDS * 3

User = get_user_model()


def _cutoff():
    return timezone.now() - timedelta(seconds=PRESENCE_TIMEOUT_SECONDS)


def is_user_online(user_id):
    return PresenceSession.objects.filter(
        user_id=user_id,
        last_seen__gte=_cutoff(),
    ).exists()


def user_presence(user_id):
    user = User.objects.only("id", "last_seen").get(pk=user_id)
    return {
        "user_id": str(user.pk),
        "is_online": is_user_online(user.pk),
        "last_seen": user.last_seen,
    }


@transaction.atomic
def open_presence_session(user_id):
    """Create one browser session and report whether the user became online."""

    user = User.objects.select_for_update().get(pk=user_id)
    now = timezone.now()
    PresenceSession.objects.filter(user_id=user.pk, last_seen__lt=_cutoff()).delete()
    was_online = PresenceSession.objects.filter(
        user_id=user.pk,
        last_seen__gte=_cutoff(),
    ).exists()
    session = PresenceSession.objects.create(
        user=user,
        connected_at=now,
        last_seen=now,
    )
    User.objects.filter(pk=user.pk).update(last_seen=now)
    return str(session.pk), not was_online


@transaction.atomic
def touch_presence_session(session_id, user_id):
    """Refresh a session heartbeat and return the user's current snapshot."""

    user = User.objects.select_for_update().get(pk=user_id)
    now = timezone.now()
    updated = PresenceSession.objects.filter(
        pk=session_id,
        user_id=user.pk,
    ).update(last_seen=now)
    if not updated:
        return None
    User.objects.filter(pk=user.pk).update(last_seen=now)
    return user_presence(user.pk)


@transaction.atomic
def close_presence_session(session_id, user_id):
    """Delete a browser session and report whether the user went offline."""

    user = User.objects.select_for_update().get(pk=user_id)
    deleted, _ = PresenceSession.objects.filter(
        pk=session_id,
        user_id=user.pk,
    ).delete()
    if not deleted:
        return False

    now = timezone.now()
    User.objects.filter(pk=user.pk).update(last_seen=now)
    PresenceSession.objects.filter(user_id=user.pk, last_seen__lt=_cutoff()).delete()
    still_online = PresenceSession.objects.filter(
        user_id=user.pk,
        last_seen__gte=_cutoff(),
    ).exists()
    return not still_online
