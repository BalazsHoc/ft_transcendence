from django.contrib import admin
from .models import Message
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display=('sender','event','created_at')
    search_fields=('text','sender__username','event__title')
