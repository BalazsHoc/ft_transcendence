from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, response, status

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user).select_related("actor")
        unread = self.request.query_params.get("unread")
        if unread is not None and unread.lower() in {"1", "true", "yes"}:
            queryset = queryset.filter(read_at__isnull=True)
        return queryset


class NotificationUnreadCountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        count = Notification.objects.filter(recipient=request.user, read_at__isnull=True).count()
        return response.Response({"count": count})


class NotificationReadView(generics.GenericAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        notification = get_object_or_404(
            Notification.objects.select_related("actor"),
            pk=kwargs["pk"],
            recipient=request.user,
        )
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        return response.Response(self.get_serializer(notification).data)


class NotificationReadAllView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return response.Response({"updated": updated}, status=status.HTTP_200_OK)
