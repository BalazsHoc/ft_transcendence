from google_auth_oauthlib.flow import Flow
from django.conf import settings

GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def build_google_flow(*, state=None):
    config = {
        "web": {
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

    flow = Flow.from_client_config(
        config,
        scopes=GOOGLE_SCOPES,
        state=state,
    )
    flow.redirect_uri = settings.GOOGLE_OAUTH_REDIRECT_URI
    return flow





from django.shortcuts import redirect
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class GoogleLoginStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        flow = build_google_flow()

        authorization_url, state = flow.authorization_url(
            access_type="online",
            include_granted_scopes="true",
        )

        request.session["google_oauth_state"] = state
        request.session["google_oauth_code_verifier"] = flow.code_verifier

        return redirect(authorization_url)


import secrets

from django.conf import settings
from django.core.cache import cache
from django.shortcuts import redirect
from google.auth.exceptions import GoogleAuthError, TransportError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from oauthlib.oauth2 import OAuth2Error
from requests.exceptions import RequestException
from rest_framework import status
from rest_framework.exceptions import APIException, AuthenticationFailed


class GoogleProviderUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Google authentication is temporarily unavailable."
    default_code = "google_auth_unavailable"


class GoogleLoginCallbackView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):

        expected_state = request.session.pop("google_oauth_state", None)
        code_verifier = request.session.pop(
            "google_oauth_code_verifier",
            None,
        )
        returned_state = request.query_params.get("state")

        if not expected_state or returned_state != expected_state or not code_verifier:
            raise AuthenticationFailed("Invalid Google OAuth state.")

        flow = build_google_flow(state=expected_state)
        flow.code_verifier = code_verifier
        try:
            flow.fetch_token(authorization_response=request.build_absolute_uri())
        except OAuth2Error as exc:
            raise AuthenticationFailed(
                "Google authorization could not be completed."
            ) from exc
        except RequestException as exc:
            raise GoogleProviderUnavailable() from exc

        try:
            claims = id_token.verify_oauth2_token(
                flow.credentials.id_token,
                GoogleRequest(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except TransportError as exc:
            raise GoogleProviderUnavailable() from exc
        except (GoogleAuthError, ValueError) as exc:
            raise AuthenticationFailed(
                "Google identity verification failed."
            ) from exc

        if not claims.get("email_verified"):
            raise AuthenticationFailed(
                "Google has not verified this email address."
            )

        user = find_or_create_google_user(claims)

        ticket = secrets.token_urlsafe(32)
        cache.set(
            f"google-login:{ticket}",
            str(user.pk),
            timeout=60,
        )

        return redirect(
            f"{settings.FRONTEND_URL}/auth/google/callback"
            f"?ticket={ticket}"
        )





from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


def unique_username(name, email):
    base = (
        slugify(name, allow_unicode=True)
        or slugify(email.split("@", 1)[0], allow_unicode=True)
        or "user"
    )[:140]

    candidate = base
    suffix = 2

    while User.objects.filter(username=candidate).exists():
        suffix_text = f"-{suffix}"
        candidate = f"{base[:150 - len(suffix_text)]}{suffix_text}"
        suffix += 1

    return candidate


def find_or_create_google_user(claims):
    google_sub = claims["sub"]
    email = claims["email"].strip().casefold()

    user = User.objects.filter(google_sub=google_sub).first()
    if user:
        return user

    existing = User.objects.filter(email__iexact=email).first()
    if existing:
        # Project policy: a verified Google email matching an existing local
        # account is sufficient to link Google automatically.
        if existing.google_sub and existing.google_sub != google_sub:
            raise AuthenticationFailed(
                "This email is already connected to another Google account."
            )

        existing.google_sub = google_sub
        existing.save(update_fields=["google_sub"])
        return existing

    user = User(
        username=unique_username(claims.get("name", ""), email),
        email=email,
        first_name=claims.get("given_name", ""),
        last_name=claims.get("family_name", ""),
        google_sub=google_sub,
    )
    user.set_unusable_password()
    user.save()
    return user




from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserPublicSerializer



class GoogleLoginExchangeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        ticket = request.data.get("ticket", "")
        cache_key = f"google-login:{ticket}"

        user_id = cache.get(cache_key)
        if not user_id:
            raise AuthenticationFailed(
                "This Google login has expired or was already used."
            )

        # Consume it before issuing tokens so it cannot be replayed.
        cache.delete(cache_key)

        user = User.objects.filter(pk=user_id, is_active=True).first()
        if not user:
            raise AuthenticationFailed("The account is unavailable.")

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserPublicSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
