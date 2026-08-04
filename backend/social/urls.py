from django.urls import path

from .user_views import UserSearchView

urlpatterns = [
    path("", UserSearchView.as_view(), name="user-search"),
]
