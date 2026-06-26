from django.core.exceptions import ImproperlyConfigured
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import remember_search_result, reverse_geocode, resolve_provider, search_locations


class GeoSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"detail": "q is required."}, status=status.HTTP_400_BAD_REQUEST)
        language = request.query_params.get("language", "").strip()
        provider = request.query_params.get("provider", "").strip() or None
        try:
            data = search_locations(query, language=language, provider=provider)
        except ImproperlyConfigured as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(data)


class GeoReverseView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            latitude = float(request.query_params.get("lat", ""))
            longitude = float(request.query_params.get("lon", ""))
        except ValueError:
            return Response(
                {"detail": "lat and lon are required numeric values."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        language = request.query_params.get("language", "").strip()
        provider = request.query_params.get("provider", "").strip() or None
        try:
            data = reverse_geocode(latitude, longitude, language=language, provider=provider)
        except ImproperlyConfigured as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(data)


class GeoRememberView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = str(request.data.get("query", "")).strip()
        suggestion = request.data.get("suggestion")
        if not query or not isinstance(suggestion, dict):
            return Response(
                {"detail": "query and suggestion are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        language = str(request.data.get("language", "")).strip()
        provider = str(request.data.get("provider", "")).strip() or None
        resolved_provider = resolve_provider(provider)
        try:
            data = remember_search_result(
                provider=resolved_provider,
                query=query,
                language=language,
                suggestion=suggestion,
            )
        except ImproperlyConfigured as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(data, status=status.HTTP_201_CREATED)


class GeoMapStyleView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        maptiler_key = getattr(settings, "MAPTILER_API_KEY", "")
        if maptiler_key:
            light_map_id = getattr(settings, "MAPTILER_LIGHT_MAP_ID", "dataviz-v4-light")
            dark_map_id = getattr(settings, "MAPTILER_DARK_MAP_ID", "dataviz-dark")
            return Response(
                {
                    "provider": "maptiler",
                    "styles": {
                        "light": {
                            "url": (
                                f"https://api.maptiler.com/maps/{light_map_id}/"
                                f"{{z}}/{{x}}/{{y}}.png?key={maptiler_key}"
                            ),
                            "attribution": (
                                '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> '
                                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            ),
                        },
                        "dark": {
                            "url": (
                                f"https://api.maptiler.com/maps/{dark_map_id}/"
                                f"{{z}}/{{x}}/{{y}}.png?key={maptiler_key}"
                            ),
                            "attribution": (
                                '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> '
                                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            ),
                        },
                    },
                }
            )

        return Response(
            {
                "provider": "carto",
                "styles": {
                    "light": {
                        "url": "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
                        "attribution": (
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors '
                            '&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        ),
                    },
                    "dark": {
                        "url": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                        "attribution": (
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors '
                            '&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        ),
                    },
                },
            }
        )
