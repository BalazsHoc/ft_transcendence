from rest_framework import generics, permissions, response, serializers, status
from rest_framework.exceptions import NotFound

from .direct_serializers import GroupMessageCreateSerializer, GroupMessageSerializer
from .group_services import GroupMessageError, active_group_for_user, create_group_message
from .models import GroupMessage


class GroupMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_group(self):
        group = active_group_for_user(
            group_id=self.kwargs["group_id"],
            user=self.request.user,
        )
        if group is None:
            raise NotFound("Only group members can access this chat.")
        return group

    def get_queryset(self):
        return GroupMessage.objects.filter(
            group=self.get_group(),
        ).select_related("sender")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return GroupMessageSerializer
        return GroupMessageCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            message = create_group_message(
                group=self.get_group(),
                sender=request.user,
                text=serializer.validated_data["text"],
            )
        except GroupMessageError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc
        return response.Response(
            GroupMessageSerializer(message, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )
