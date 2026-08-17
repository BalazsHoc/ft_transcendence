from django.contrib import admin

from .models import Group, GroupMembership


class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    extra = 0
    exclude = ("status",)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "sport", "owner", "is_active")
    list_filter = ("sport", "is_active")
    search_fields = ("name", "description", "location_name")
    exclude = ("kind", "visibility", "join_policy")
    inlines = [GroupMembershipInline]


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "group", "role", "joined_at")
    list_filter = ("role",)
    exclude = ("status",)
