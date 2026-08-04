from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "actor", "type", "read_at", "created_at")
    list_filter = ("type", "read_at")
    search_fields = ("recipient__username", "actor__username", "target_url")
