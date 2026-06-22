from django.db import models


class GeocodeCache(models.Model):
    LOOKUP_SEARCH = "search"
    LOOKUP_REVERSE = "reverse"
    LOOKUP_CHOICES = (
        (LOOKUP_SEARCH, "Search"),
        (LOOKUP_REVERSE, "Reverse"),
    )

    cache_key = models.CharField(max_length=255, unique=True)
    provider = models.CharField(max_length=32)
    lookup_type = models.CharField(max_length=16, choices=LOOKUP_CHOICES)
    query = models.CharField(max_length=512)
    query_normalized = models.CharField(max_length=512)
    language = models.CharField(max_length=32, blank=True, default="")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    response_json = models.JSONField(default=dict)
    is_final = models.BooleanField(default=False)
    hit_count = models.PositiveIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["provider", "lookup_type"]),
            models.Index(fields=["provider", "lookup_type", "is_final"]),
            models.Index(fields=["query_normalized"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.provider}:{self.lookup_type}:{self.query_normalized}"
