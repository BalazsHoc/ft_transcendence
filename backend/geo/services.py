import json
import logging
import re
import time
from dataclasses import dataclass
from datetime import timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import OperationalError
from django.db.models.functions import Length
from django.utils import timezone

from .models import GeocodeCache


logger = logging.getLogger(__name__)


@dataclass
class GeoSuggestion:
    id: str
    label: str
    address: str
    latitude: float
    longitude: float
    source: str
    raw: dict[str, Any]


def normalize_query(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def build_vienna_query(query: str) -> str:
    normalized = query.strip()
    if not normalized:
        return normalized
    if re.search(r"\b(wien|vienna|vien)\b", normalized, re.IGNORECASE):
        return normalized
    return f"{normalized} Wien"


def build_search_queries(query: str) -> list[str]:
    normalized = query.strip()
    if not normalized:
        return []
    vienna_query = build_vienna_query(normalized)
    if vienna_query == normalized:
        return [normalized]
    return [normalized, vienna_query]


def rounded_coordinate(value: float) -> float:
    return round(float(value), 5)


def safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def build_cache_key(provider: str, lookup_type: str, query: str, language: str = "") -> str:
    return f"{provider}:{lookup_type}:{normalize_query(query)}:{language or 'default'}"


def build_reverse_cache_key(provider: str, latitude: float, longitude: float, language: str = "") -> str:
    return (
        f"{provider}:reverse:{rounded_coordinate(latitude)}:"
        f"{rounded_coordinate(longitude)}:{language or 'default'}"
    )


def cache_ttl() -> timedelta:
    return timedelta(days=getattr(settings, "GEO_CACHE_TTL_DAYS", 30))


def should_log_geo_requests() -> bool:
    return bool(getattr(settings, "DEBUG", False) or getattr(settings, "GEO_DEBUG", False))


def log_geo_request(provider: str, lookup_type: str, query: str, url: str) -> None:
    if not should_log_geo_requests():
        return
    safe_url = url.split("&key=")[0] if "&key=" in url else url
    logger.info("[geo] %s %s query=%r url=%s", provider, lookup_type, query, safe_url)


def resolve_provider(explicit_provider: str | None = None) -> str:
    provider = (explicit_provider or getattr(settings, "GEO_PROVIDER", "auto")).strip().lower()
    if provider and provider != "auto":
        return provider
    if getattr(settings, "MAPTILER_API_KEY", ""):
        return "maptiler"
    if getattr(settings, "GEOAPIFY_API_KEY", ""):
        return "geoapify"
    return "nominatim"


def cache_response(
    *,
    provider: str,
    lookup_type: str,
    query: str,
    language: str,
    latitude: float | None,
    longitude: float | None,
    response_json: dict[str, Any],
    is_final: bool = False,
) -> None:
    cache_key = (
        build_reverse_cache_key(provider, latitude or 0.0, longitude or 0.0, language)
        if lookup_type == GeocodeCache.LOOKUP_REVERSE
        else build_cache_key(provider, lookup_type, query, language)
    )
    expires_at = timezone.now() + cache_ttl()
    defaults = {
        "provider": provider,
        "lookup_type": lookup_type,
        "query": query,
        "query_normalized": normalize_query(query) if query else cache_key,
        "language": language or "",
        "latitude": latitude,
        "longitude": longitude,
            "response_json": response_json,
            "is_final": is_final,
            "expires_at": expires_at,
            "last_used_at": timezone.now(),
        }
    for attempt in range(3):
        try:
            GeocodeCache.objects.update_or_create(
                cache_key=cache_key,
                defaults=defaults,
            )
            return
        except OperationalError as exc:
            if "database is locked" not in str(exc).lower() or attempt == 2:
                logger.warning("[geo] cache write skipped for %s %s query=%r: %s", provider, lookup_type, query, exc)
                return
            time.sleep(0.05 * (attempt + 1))


def get_cached_response(
    *,
    provider: str,
    lookup_type: str,
    query: str,
    language: str,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict[str, Any] | None:
    cache_key = (
        build_reverse_cache_key(provider, latitude or 0.0, longitude or 0.0, language)
        if lookup_type == GeocodeCache.LOOKUP_REVERSE
        else build_cache_key(provider, lookup_type, query, language)
    )
    row = GeocodeCache.objects.filter(cache_key=cache_key).first()
    if not row:
        return None
    if row.expires_at and row.expires_at < timezone.now():
        row.delete()
        return None
    if lookup_type == GeocodeCache.LOOKUP_SEARCH and not row.response_json.get("results"):
        row.delete()
        return None
    row.hit_count += 1
    row.last_used_at = timezone.now()
    try:
        row.save(update_fields=["hit_count", "last_used_at", "updated_at"])
    except OperationalError as exc:
        logger.warning("[geo] cache hit bookkeeping skipped for %s %s query=%r: %s", provider, lookup_type, query, exc)
    return row.response_json


def get_final_search_response(
    *,
    provider: str,
    query: str,
    language: str,
) -> dict[str, Any] | None:
    normalized_query = normalize_query(query)
    rows = (
        GeocodeCache.objects.filter(
            provider=provider,
            lookup_type=GeocodeCache.LOOKUP_SEARCH,
            is_final=True,
            query_normalized__startswith=normalized_query,
        )
        .annotate(query_len=Length("query_normalized"))
        .order_by("query_len", "-updated_at")[:10]
    )
    suggestions: list[GeoSuggestion] = []
    seen_ids: set[str] = set()
    for row in rows:
        for item in row.response_json.get("results", []):
            suggestion = GeoSuggestion(**item)
            if suggestion.id in seen_ids:
                continue
            seen_ids.add(suggestion.id)
            suggestions.append(suggestion)
    if not suggestions:
        return None
    return _normalize_response(
        provider=provider,
        query=query,
        language=language,
        suggestions=suggestions,
    )


def remember_search_result(
    *,
    provider: str,
    query: str,
    language: str,
    suggestion: dict[str, Any],
) -> dict[str, Any]:
    response_json = _normalize_response(
        provider=provider,
        query=query,
        language=language,
        suggestions=[GeoSuggestion(**suggestion)],
    )
    cache_response(
        provider=provider,
        lookup_type=GeocodeCache.LOOKUP_SEARCH,
        query=query,
        language=language,
        latitude=None,
        longitude=None,
        response_json=response_json,
        is_final=True,
    )
    return response_json


def fetch_json(url: str, headers: dict[str, str] | None = None) -> Any:
    request = Request(url, headers=headers or {})
    try:
        with urlopen(request, timeout=10) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise ImproperlyConfigured(f"Geo provider request failed ({exc.code}): {body}") from exc
    except URLError as exc:
        raise ImproperlyConfigured(f"Geo provider request failed: {exc.reason}") from exc


def _suggestion_from_maptiler(feature: dict[str, Any]) -> GeoSuggestion:
    center = feature.get("center") or []
    longitude = safe_float(center[0] if len(center) > 0 else feature.get("lon"))
    latitude = safe_float(center[1] if len(center) > 1 else feature.get("lat"))
    raw_text = str(feature.get("text") or feature.get("name") or feature.get("place_name") or "")
    compact_label = raw_text.split(",")[0].strip() if raw_text else ""
    display_label = compact_label or raw_text
    full_address = str(feature.get("place_name") or raw_text or "")
    return GeoSuggestion(
        id=str(feature.get("id") or feature.get("place_name") or feature.get("text")),
        label=display_label,
        address=full_address,
        latitude=latitude,
        longitude=longitude,
        source="maptiler",
        raw=feature,
    )


def _suggestion_from_geoapify(feature: dict[str, Any]) -> GeoSuggestion:
    lat = safe_float(feature.get("lat"))
    lon = safe_float(feature.get("lon"))
    label = str(feature.get("formatted") or feature.get("name") or feature.get("address_line1") or "")
    return GeoSuggestion(
        id=str(feature.get("place_id") or feature.get("id") or label),
        label=label,
        address=label,
        latitude=lat,
        longitude=lon,
        source="geoapify",
        raw=feature,
    )


def _suggestion_from_nominatim(feature: dict[str, Any]) -> GeoSuggestion:
    lat = safe_float(feature.get("lat"))
    lon = safe_float(feature.get("lon"))
    label = str(feature.get("display_name") or feature.get("name") or "")
    return GeoSuggestion(
        id=str(feature.get("place_id") or feature.get("osm_id") or label),
        label=label,
        address=label,
        latitude=lat,
        longitude=lon,
        source="nominatim",
        raw=feature,
    )


def _normalize_response(
    *,
    provider: str,
    query: str,
    language: str,
    suggestions: list[GeoSuggestion],
) -> dict[str, Any]:
    return {
        "provider": provider,
        "query": query,
        "language": language,
        "results": [suggestion.__dict__ for suggestion in suggestions],
    }


def search_locations(query: str, language: str = "", provider: str | None = None) -> dict[str, Any]:
    normalized_query = query.strip()
    if not normalized_query:
        return {"provider": resolve_provider(provider), "query": "", "language": language, "results": []}

    resolved_provider = resolve_provider(provider)
    search_queries = build_search_queries(normalized_query)
    provider_query = search_queries[-1]
    cached = get_final_search_response(
        provider=resolved_provider,
        query=normalized_query,
        language=language,
    )
    if cached:
        return cached

    suggestions: list[GeoSuggestion] = []
    seen_ids: set[str] = set()

    for current_query in search_queries:
        if resolved_provider == "maptiler":
            api_key = getattr(settings, "MAPTILER_API_KEY", "")
            if not api_key:
                raise ImproperlyConfigured("MAPTILER_API_KEY is not configured.")
            url = (
                "https://api.maptiler.com/geocoding/"
                f"{quote(current_query)}.json?{urlencode({'key': api_key, 'autocomplete': 'true', 'fuzzyMatch': 'true', 'language': language or 'de', 'limit': 6})}"
            )
            log_geo_request(resolved_provider, GeocodeCache.LOOKUP_SEARCH, current_query, url)
            payload = fetch_json(url)
            candidates = [_suggestion_from_maptiler(feature) for feature in payload.get("features", [])]
        elif resolved_provider == "geoapify":
            api_key = getattr(settings, "GEOAPIFY_API_KEY", "")
            if not api_key:
                raise ImproperlyConfigured("GEOAPIFY_API_KEY is not configured.")
            url = (
                "https://api.geoapify.com/v1/geocode/autocomplete?"
                + urlencode({"text": current_query, "apiKey": api_key, "lang": language or "de", "limit": 6})
            )
            log_geo_request(resolved_provider, GeocodeCache.LOOKUP_SEARCH, current_query, url)
            payload = fetch_json(url)
            candidates = [_suggestion_from_geoapify(feature) for feature in payload.get("results", [])]
        else:
            headers = {"User-Agent": getattr(settings, "NOMINATIM_USER_AGENT", "ft-transcendence/1.0")}
            url = (
                "https://nominatim.openstreetmap.org/search?"
                + urlencode({"q": current_query, "format": "jsonv2", "addressdetails": 1, "limit": 6, "accept-language": language or "de"})
            )
            log_geo_request(resolved_provider, GeocodeCache.LOOKUP_SEARCH, current_query, url)
            payload = fetch_json(url, headers=headers)
            candidates = [_suggestion_from_nominatim(feature) for feature in payload]

        for suggestion in candidates:
            if suggestion.id in seen_ids:
                continue
            seen_ids.add(suggestion.id)
            suggestions.append(suggestion)

    response_json = _normalize_response(
        provider=resolved_provider,
        query=provider_query,
        language=language,
        suggestions=suggestions,
    )
    return response_json


def reverse_geocode(latitude: float, longitude: float, language: str = "", provider: str | None = None) -> dict[str, Any]:
    resolved_provider = resolve_provider(provider)
    cached = get_cached_response(
        provider=resolved_provider,
        lookup_type=GeocodeCache.LOOKUP_REVERSE,
        query=f"{latitude},{longitude}",
        language=language,
        latitude=latitude,
        longitude=longitude,
    )
    if cached:
        return cached

    if resolved_provider == "maptiler":
        api_key = getattr(settings, "MAPTILER_API_KEY", "")
        if not api_key:
            raise ImproperlyConfigured("MAPTILER_API_KEY is not configured.")
        url = (
            "https://api.maptiler.com/geocoding/"
            f"{longitude},{latitude}.json?{urlencode({'key': api_key, 'language': language or 'en', 'limit': 1})}"
        )
        log_geo_request(resolved_provider, GeocodeCache.LOOKUP_REVERSE, f"{latitude},{longitude}", url)
        payload = fetch_json(url)
        suggestions = [_suggestion_from_maptiler(feature) for feature in payload.get("features", [])]
    elif resolved_provider == "geoapify":
        api_key = getattr(settings, "GEOAPIFY_API_KEY", "")
        if not api_key:
            raise ImproperlyConfigured("GEOAPIFY_API_KEY is not configured.")
        url = (
            "https://api.geoapify.com/v1/geocode/reverse?"
            + urlencode({"lat": latitude, "lon": longitude, "apiKey": api_key, "lang": language or "en", "limit": 1})
        )
        log_geo_request(resolved_provider, GeocodeCache.LOOKUP_REVERSE, f"{latitude},{longitude}", url)
        payload = fetch_json(url)
        suggestions = [_suggestion_from_geoapify(feature) for feature in payload.get("results", [])]
    else:
        headers = {"User-Agent": getattr(settings, "NOMINATIM_USER_AGENT", "ft-transcendence/1.0")}
        url = (
            "https://nominatim.openstreetmap.org/reverse?"
            + urlencode({"lat": latitude, "lon": longitude, "format": "jsonv2", "accept-language": language or "en"})
        )
        log_geo_request(resolved_provider, GeocodeCache.LOOKUP_REVERSE, f"{latitude},{longitude}", url)
        payload = fetch_json(url, headers=headers)
        suggestions = []
        if payload:
            suggestions = [_suggestion_from_nominatim(payload)] if isinstance(payload, dict) else []

    response_json = _normalize_response(
        provider=resolved_provider,
        query=f"{latitude},{longitude}",
        language=language,
        suggestions=suggestions,
    )
    cache_response(
        provider=resolved_provider,
        lookup_type=GeocodeCache.LOOKUP_REVERSE,
        query=f"{latitude},{longitude}",
        language=language,
        latitude=latitude,
        longitude=longitude,
        response_json=response_json,
    )
    return response_json
