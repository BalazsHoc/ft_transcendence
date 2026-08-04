from django.urls import path

from .friend_views import (
    FriendDeleteView,
    FriendRequestActionView,
    FriendRequestCreateView,
    IncomingFriendRequestListView,
    OutgoingFriendRequestListView,
    UserFriendshipListView,
)

urlpatterns = [
    path("", UserFriendshipListView.as_view(), name="friend-list"),
    path("requests/", FriendRequestCreateView.as_view(), name="friend-request-create"),
    path("requests/incoming/", IncomingFriendRequestListView.as_view(), name="friend-request-incoming"),
    path("requests/outgoing/", OutgoingFriendRequestListView.as_view(), name="friend-request-outgoing"),
    path(
        "requests/<int:pk>/<str:action>/",
        FriendRequestActionView.as_view(),
        name="friend-request-action",
    ),
    path("<int:pk>/", FriendDeleteView.as_view(), name="friend-delete"),
]
