import secrets

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError, models
from django.utils import timezone


class PublicAPIKey(models.Model):
    """A server-managed credential for read-only public API consumers.

    The raw key is returned only by ``issue``/the management command. Only a
    salted Django password hash and a short identifying prefix are stored in
    the database.
    """

    name = models.CharField(max_length=120)
    prefix = models.CharField(max_length=20, unique=True)
    key_hash = models.CharField(max_length=128, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(blank=True, null=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="public_api_keys",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["is_active", "created_at"],
                name="public_api_active_created",
            ),
        ]

    def __str__(self):
        status = "active" if self.is_active and self.revoked_at is None else "revoked"
        return f"{self.prefix} ({self.name}, {status})"

    @classmethod
    def issue(cls, *, name, created_by=None):
        """Create a key and return ``(model_instance, raw_key)``.

        ``raw_key`` must be shown to the consumer immediately and then
        discarded. It cannot be recovered from the database later.
        """

        clean_name = " ".join(str(name or "").split())
        if not clean_name:
            raise ValueError("A name is required when issuing a public API key.")

        for _ in range(5):
            raw_key = f"tr_pub_{secrets.token_urlsafe(32)}"
            try:
                key = cls.objects.create(
                    name=clean_name,
                    prefix=raw_key[:20],
                    key_hash=make_password(raw_key),
                    created_by=created_by,
                )
            except IntegrityError:
                continue
            return key, raw_key

        raise RuntimeError("Could not generate a unique public API key.")

    @classmethod
    def authenticate_raw_key(cls, raw_key):
        """Return the active key for ``raw_key`` or ``None``."""

        candidate = cls.objects.filter(
            prefix=raw_key[:20],
            is_active=True,
            revoked_at__isnull=True,
        ).first()
        if candidate is None or not check_password(raw_key, candidate.key_hash):
            return None
        return candidate

    def mark_used(self):
        now = timezone.now()
        type(self).objects.filter(pk=self.pk).update(last_used_at=now)
        self.last_used_at = now

    def revoke(self):
        if self.is_active or self.revoked_at is None:
            self.is_active = False
            self.revoked_at = timezone.now()
            self.save(update_fields=["is_active", "revoked_at"])
