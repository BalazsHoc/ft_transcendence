from django.urls import path

from .direct_views import (
    DirectConversationDetailView,
    DirectConversationListCreateView,
    DirectMessageListCreateView,
)

urlpatterns = [
    path(
        "conversations/",
        DirectConversationListCreateView.as_view(),
        name="direct-conversation-list-create",
    ),
    path(
        "conversations/<uuid:pk>/",
        DirectConversationDetailView.as_view(),
        name="direct-conversation-detail",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        DirectMessageListCreateView.as_view(),
        name="direct-message-list-create",
    ),
]
