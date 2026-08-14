from rest_framework.permissions import BasePermission

from .models import PublicAPIKey


class HasPublicAPIKey(BasePermission):
    message = "A valid X-API-Key header is required for the public API."

    def has_permission(self, request, view):
        return isinstance(request.auth, PublicAPIKey)
