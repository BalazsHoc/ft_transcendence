from django.contrib import admin
from django.utils import timezone

from .models import PublicAPIKey


@admin.action(description="Revoke selected public API keys")
def revoke_keys(modeladmin, request, queryset):
    queryset.filter(is_active=True).update(
        is_active=False,
        revoked_at=timezone.now(),
    )


@admin.register(PublicAPIKey)
class PublicAPIKeyAdmin(admin.ModelAdmin):
    list_display = ("prefix", "name", "is_active", "created_at", "last_used_at", "revoked_at")
    list_filter = ("is_active", "created_at", "revoked_at")
    search_fields = ("prefix", "name")
    readonly_fields = ("prefix", "key_hash", "created_at", "last_used_at", "revoked_at")
    actions = (revoke_keys,)

    def has_add_permission(self, request):
        # Issuing through the command prints the raw key exactly once.
        return False
