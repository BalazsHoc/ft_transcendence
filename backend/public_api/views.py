from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Count, Q
from django.utils.dateparse import parse_datetime
from rest_framework import filters, serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, extend_schema_view, inline_serializer

from core.districts import district_catalog
from core.sports import sport_catalog
from events.models import Event, EventParticipant
from groups.models import Group

from .authentication import PublicAPIKeyAuthentication
from .pagination import PublicAPIPagination
from .permissions import HasPublicAPIKey
from .serializers import PublicEventSerializer, PublicGroupSerializer, PublicUserSerializer
from .throttling import PublicAPIIPThrottle, PublicAPIKeyThrottle

User = get_user_model()


class PublicAPIEndpointMixin:
    authentication_classes = [PublicAPIKeyAuthentication]
    permission_classes = [HasPublicAPIKey]
    throttle_classes = [PublicAPIKeyThrottle, PublicAPIIPThrottle]
    pagination_class = PublicAPIPagination


class PublicHealthView(PublicAPIEndpointMixin, APIView):
    @extend_schema(
        tags=["Public API"],
        summary="Check public API availability",
        responses=inline_serializer(
            name="PublicAPIHealthResponse",
            fields={
                "status": serializers.CharField(),
                "version": serializers.CharField(),
            },
        ),
    )
    def get(self, request):
        return Response({"status": "ok", "version": "v1"})


class PublicSportsView(PublicAPIEndpointMixin, APIView):
    @extend_schema(
        tags=["Public API"],
        summary="List supported sports",
        responses=inline_serializer(
            name="PublicAPISport",
            many=True,
            fields={"code": serializers.CharField()},
        ),
    )
    def get(self, request):
        return Response(sport_catalog())


class PublicDistrictsView(PublicAPIEndpointMixin, APIView):
    @extend_schema(
        tags=["Public API"],
        summary="List supported Vienna districts",
        responses=inline_serializer(
            name="PublicAPIDistrict",
            many=True,
            fields={
                "code": serializers.CharField(),
                "name": serializers.CharField(),
            },
        ),
    )
    def get(self, request):
        return Response(district_catalog())


def _parse_datetime_parameter(value, parameter_name):
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        raise ValidationError({parameter_name: "Use a valid ISO 8601 datetime."})
    return parsed


def _filter_json_array_contains(queryset, field_name, value):
    """Keep catalog filters usable with both PostgreSQL and local SQLite."""

    if connection.vendor == "sqlite":
        return queryset.filter(**{f"{field_name}__icontains": f'"{value}"'})
    return queryset.filter(**{f"{field_name}__contains": [value]})


PUBLIC_EVENT_PARAMETERS = [
    OpenApiParameter("sport", OpenApiTypes.STR, description="Filter by sport code."),
    OpenApiParameter("level", OpenApiTypes.STR, description="Filter by level."),
    OpenApiParameter("language", OpenApiTypes.STR, description="Filter by event language."),
    OpenApiParameter("start_after", OpenApiTypes.DATETIME, description="Only events starting after this time."),
    OpenApiParameter("start_before", OpenApiTypes.DATETIME, description="Only events starting before this time."),
    OpenApiParameter("search", OpenApiTypes.STR, description="Search title, description, location or sport."),
    OpenApiParameter("ordering", OpenApiTypes.STR, description="start_at, -start_at, title or created_at."),
    OpenApiParameter("page", OpenApiTypes.INT),
    OpenApiParameter("page_size", OpenApiTypes.INT),
]


@extend_schema_view(
    list=extend_schema(
        tags=["Public API"],
        summary="List public events",
        parameters=PUBLIC_EVENT_PARAMETERS,
    ),
    retrieve=extend_schema(tags=["Public API"], summary="Retrieve a public event"),
)
class PublicEventViewSet(PublicAPIEndpointMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicEventSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "location_name", "sport"]
    ordering_fields = ["start_at", "created_at", "title"]
    ordering = ["start_at"]

    def get_queryset(self):
        queryset = (
            Event.objects.filter(visibility=Event.VISIBILITY_PUBLIC)
            .filter(
                Q(group__isnull=True)
                | Q(group__is_active=True)
            )
            .select_related("creator", "group")
            .annotate(
                attending_count=Count(
                    "participants",
                    filter=Q(participants__status=EventParticipant.STATUS_ATTENDING),
                ),
                waiting_count=Count(
                    "participants",
                    filter=Q(participants__status=EventParticipant.STATUS_WAITING),
                ),
            )
            .distinct()
        )
        sport = self.request.query_params.get("sport")
        level = self.request.query_params.get("level")
        language = self.request.query_params.get("language")
        if sport:
            queryset = queryset.filter(sport__iexact=sport)
        if level:
            queryset = queryset.filter(level=level)
        if language:
            queryset = _filter_json_array_contains(queryset, "languages", language)

        start_after = _parse_datetime_parameter(
            self.request.query_params.get("start_after"), "start_after"
        )
        start_before = _parse_datetime_parameter(
            self.request.query_params.get("start_before"), "start_before"
        )
        if start_after:
            queryset = queryset.filter(start_at__gte=start_after)
        if start_before:
            queryset = queryset.filter(start_at__lte=start_before)
        return queryset


PUBLIC_GROUP_PARAMETERS = [
    OpenApiParameter("sport", OpenApiTypes.STR, description="Filter by sport code."),
    OpenApiParameter("level", OpenApiTypes.STR, description="Filter by supported group level."),
    OpenApiParameter("search", OpenApiTypes.STR, description="Search group name or description."),
    OpenApiParameter("ordering", OpenApiTypes.STR, description="name, -name, created_at or -created_at."),
    OpenApiParameter("page", OpenApiTypes.INT),
    OpenApiParameter("page_size", OpenApiTypes.INT),
]


@extend_schema_view(
    list=extend_schema(
        tags=["Public API"],
        summary="List public groups",
        parameters=PUBLIC_GROUP_PARAMETERS,
    ),
    retrieve=extend_schema(tags=["Public API"], summary="Retrieve a public group"),
)
class PublicGroupViewSet(PublicAPIEndpointMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicGroupSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "location_name", "sport"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = (
            Group.objects.filter(is_active=True)
            .select_related("owner")
            .annotate(
                member_count=Count(
                    "memberships",
                    distinct=True,
                )
            )
        )
        sport = self.request.query_params.get("sport")
        level = self.request.query_params.get("level")
        if sport:
            queryset = queryset.filter(sport__iexact=sport)
        if level:
            queryset = _filter_json_array_contains(queryset, "levels", level)
        return queryset


@extend_schema_view(
    list=extend_schema(
        tags=["Public API"],
        summary="List public user profiles",
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Search username or name."),
            OpenApiParameter("ordering", OpenApiTypes.STR, description="username, first_name or created_at."),
            OpenApiParameter("page", OpenApiTypes.INT),
            OpenApiParameter("page_size", OpenApiTypes.INT),
        ],
    ),
    retrieve=extend_schema(tags=["Public API"], summary="Retrieve a public user profile"),
)
class PublicUserViewSet(PublicAPIEndpointMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicUserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "first_name", "last_name"]
    ordering_fields = ["username", "first_name", "created_at"]
    ordering = ["username"]

    def get_queryset(self):
        return User.objects.filter(is_active=True, is_staff=False).order_by("username")
