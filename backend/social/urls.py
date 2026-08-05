from django.urls import path

from .user_views import UserProfileView, UserSearchView

urlpatterns = [
    path("", UserSearchView.as_view(), name="user-search"),
    path("<uuid:pk>/", UserProfileView.as_view(), name="user-profile"),
]
