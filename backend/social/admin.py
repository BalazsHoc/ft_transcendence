from django.contrib import admin

from .models import Friendship


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ("id", "user_low", "user_high", "requested_by", "status", "updated_at")
    list_filter = ("status",)
    search_fields = ("user_low__username", "user_high__username", "requested_by__username")
