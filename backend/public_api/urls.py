from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    PublicDistrictsView,
    PublicEventViewSet,
    PublicGroupViewSet,
    PublicHealthView,
    PublicSportsView,
    PublicUserViewSet,
)

router = DefaultRouter()
router.register("events", PublicEventViewSet, basename="public-events")
router.register("groups", PublicGroupViewSet, basename="public-groups")
router.register("users", PublicUserViewSet, basename="public-users")

urlpatterns = [
    path("health/", PublicHealthView.as_view(), name="public-api-health"),
    path("sports/", PublicSportsView.as_view(), name="public-api-sports"),
    path("districts/", PublicDistrictsView.as_view(), name="public-api-districts"),
]
urlpatterns += router.urls
