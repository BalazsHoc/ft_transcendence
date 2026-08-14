from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import PublicAPIKey


class PublicAPIKeyUser:
    """Minimal authenticated principal used for API-key requests."""

    is_authenticated = True
    is_anonymous = False
    is_staff = False
    is_superuser = False
    pk = None

    def __init__(self, api_key):
        self.api_key = api_key
        self.username = f"public-api:{api_key.prefix}"

    def __str__(self):
        return self.username


class PublicAPIKeyAuthentication(BaseAuthentication):
    """Authenticate the X-API-Key header without exposing raw credentials."""

    header_name = "X-API-Key"

    def authenticate(self, request):
        raw_key = request.headers.get(self.header_name)
        if raw_key is None:
            return None

        raw_key = raw_key.strip()
        if not raw_key:
            raise AuthenticationFailed("X-API-Key cannot be empty.")

        api_key = PublicAPIKey.authenticate_raw_key(raw_key)
        if api_key is None:
            raise AuthenticationFailed("Invalid or inactive public API key.")

        api_key.mark_used()
        return PublicAPIKeyUser(api_key), api_key

    def authenticate_header(self, request):
        return "ApiKey"
