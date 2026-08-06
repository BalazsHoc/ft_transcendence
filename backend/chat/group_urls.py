from django.urls import path

from .group_views import GroupMessageListCreateView

urlpatterns = [
    path(
        "<uuid:group_id>/messages/",
        GroupMessageListCreateView.as_view(),
        name="group-message-list-create",
    ),
]
