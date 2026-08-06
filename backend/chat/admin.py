from django.contrib import admin
from .models import DirectConversation, DirectMessage, GroupMessage, Message
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display=('sender','event','created_at')
    search_fields=('text','sender__username','event__title')


@admin.register(DirectConversation)
class DirectConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "friendship", "created_at", "updated_at")
    search_fields = (
        "friendship__user_low__username",
        "friendship__user_high__username",
    )


@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "conversation", "created_at")
    search_fields = ("text", "sender__username")


@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "group", "created_at")
    search_fields = ("text", "sender__username", "group__name")
