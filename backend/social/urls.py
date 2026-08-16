from django.urls import path

from .user_views import UserActivityView, UserPresenceView, UserProfileView, UserSearchView

urlpatterns = [
    path("", UserSearchView.as_view(), name="user-search"),
    path("<uuid:pk>/activities/", UserActivityView.as_view(), name="user-activities"),
    path("<uuid:pk>/presence/", UserPresenceView.as_view(), name="user-presence"),
    path("<uuid:pk>/", UserProfileView.as_view(), name="user-profile"),
]
