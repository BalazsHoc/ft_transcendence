from django.contrib import admin
from .models import Event, EventParticipant
class EventParticipantInline(admin.TabularInline):
    model=EventParticipant; extra=0
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display=('title','sport','level','start_at','max_slots','creator')
    list_filter=('sport','level','start_at')
    search_fields=('title','description','location_name')
    inlines=[EventParticipantInline]
@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display=('user','event','status','queue_position','joined_at')
    list_filter=('status',)
