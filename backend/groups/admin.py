from django.contrib import admin

from .models import Group, GroupMembership


class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    extra = 0


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "sport", "visibility", "join_policy", "owner", "is_active")
    list_filter = ("sport", "visibility", "join_policy", "kind", "is_active")
    search_fields = ("name", "description", "location_name")
    inlines = [GroupMembershipInline]


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "group", "role", "status", "joined_at")
    list_filter = ("role", "status")
