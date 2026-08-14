from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class _PublicAPIThrottle(SimpleRateThrottle):
    def get_rate(self):
        rates = getattr(settings, "REST_FRAMEWORK", {}).get(
            "DEFAULT_THROTTLE_RATES", {}
        )
        return rates.get(self.scope)


class PublicAPIKeyThrottle(_PublicAPIThrottle):
    """Limit each API key independently.

    The rate is configured through ``PUBLIC_API_RATE`` and defaults to 60
    requests per minute. The cache backend should be shared (Redis in
    production) when multiple backend workers are used.
    """

    scope = "public_api"

    def get_cache_key(self, request, view):
        api_key = getattr(request, "auth", None)
        if api_key is None or not getattr(api_key, "pk", None):
            return None
        return f"throttle_public_api_key_{api_key.pk}"


class PublicAPIIPThrottle(_PublicAPIThrottle):
    """Add a second limit so one key cannot be distributed across clients."""

    scope = "public_api_ip"

    def get_cache_key(self, request, view):
        if getattr(request, "auth", None) is None:
            return None
        return f"throttle_public_api_ip_{self.get_ident(request)}"
