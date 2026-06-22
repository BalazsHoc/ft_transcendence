from django.contrib import admin
from django.db.models import Q

from .models import GeocodeCache


@admin.register(GeocodeCache)
class GeocodeCacheAdmin(admin.ModelAdmin):
    actions = ["delete_transient_searches"]
    list_display = (
        "provider",
        "lookup_type",
        "is_final",
        "query",
        "hit_count",
        "last_used_at",
        "expires_at",
        "updated_at",
    )
    list_filter = ("provider", "lookup_type", "is_final")
    search_fields = ("query", "query_normalized", "cache_key")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.filter(Q(lookup_type=GeocodeCache.LOOKUP_REVERSE) | Q(is_final=True))

    @admin.action(description="Delete transient search rows")
    def delete_transient_searches(self, request, queryset):
        deleted_count, _ = self.model.objects.filter(
            lookup_type=GeocodeCache.LOOKUP_SEARCH,
            is_final=False,
        ).delete()
        self.message_user(
            request,
            f"Deleted {deleted_count} transient search row(s).",
        )
