from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, response, serializers, status

from social.models import Friendship

from .direct_serializers import (
    DirectConversationCreateSerializer,
    DirectConversationSerializer,
    DirectMessageCreateSerializer,
    DirectMessageSerializer,
)
from .direct_services import (
    DirectMessageError,
    create_direct_message,
    get_or_create_conversation,
)
from .models import DirectConversation, DirectMessage

def accessible_conversations(user):
    return DirectConversation.objects.filter(
        Q(friendship__user_low=user) | Q(friendship__user_high=user),
        friendship__status=Friendship.STATUS_ACCEPTED,
    ).select_related(
        "friendship",
        "friendship__user_low",
        "friendship__user_high",
    )


class DirectConversationListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectConversationSerializer

    def get_queryset(self):
        return accessible_conversations(self.request.user)

    def create(self, request, *args, **kwargs):
        input_serializer = DirectConversationCreateSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        input_serializer.is_valid(raise_exception=True)
        try:
            conversation, created = get_or_create_conversation(
                actor=request.user,
                target=input_serializer.validated_data["target_user"],
            )
        except DirectMessageError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc

        output_serializer = DirectConversationSerializer(
            conversation,
            context=self.get_serializer_context(),
        )
        return response.Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class DirectConversationDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectConversationSerializer

    def get_queryset(self):
        return accessible_conversations(self.request.user)


class DirectMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self):
        return get_object_or_404(
            accessible_conversations(self.request.user),
            pk=self.kwargs["conversation_id"],
        )

    def get_queryset(self):
        return DirectMessage.objects.filter(
            conversation=self.get_conversation(),
        ).select_related("sender")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return DirectMessageSerializer
        return DirectMessageCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            message = create_direct_message(
                conversation=self.get_conversation(),
                sender=request.user,
                text=serializer.validated_data["text"],
            )
        except DirectMessageError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc
        return response.Response(
            DirectMessageSerializer(message, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )
