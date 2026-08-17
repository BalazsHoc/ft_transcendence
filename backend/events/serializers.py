import math

from django.utils import timezone
from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from core.languages import LANGUAGE_CODES
from groups.serializers import GroupSummarySerializer
from .models import Event, EventParticipant

class EventParticipantSerializer(serializers.ModelSerializer):
    user=UserPublicSerializer(read_only=True)
    class Meta:
        model=EventParticipant
        fields=['id','user','status','queue_position','joined_at']

class EventSerializer(serializers.ModelSerializer):
    creator=UserPublicSerializer(read_only=True)
    group=GroupSummarySerializer(read_only=True)
    languages=serializers.JSONField(required=True)
    location_address=serializers.CharField(required=True, allow_blank=False)
    max_slots=serializers.IntegerField(required=True, min_value=1)
    participants=EventParticipantSerializer(many=True, read_only=True)
    attending_count=serializers.IntegerField(read_only=True)
    waiting_count=serializers.IntegerField(read_only=True)
    user_status=serializers.SerializerMethodField()
    class Meta:
        model=Event
        fields=['id','title','description','image','sport','level','languages','location_name','location_address','latitude','longitude','start_at','end_at','max_slots','creator','group','visibility','participants','attending_count','waiting_count','user_status','created_at','updated_at']
        read_only_fields=['id','creator','created_at','updated_at']
    def get_user_status(self,obj):
        request=self.context.get('request')
        if not request or not request.user.is_authenticated: return None
        p=obj.participants.filter(user=request.user).first()
        return None if not p else {'status':p.status,'queue_position':p.queue_position}

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Title must contain at least 2 characters.')
        return value

    def validate_description(self, value):
        return value.strip()

    def validate_languages(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('Choose at least one event language.')
        normalized = [str(language).strip().casefold() for language in value]
        invalid = sorted(set(normalized) - set(LANGUAGE_CODES))
        if invalid:
            raise serializers.ValidationError(
                f'Unsupported languages: {", ".join(invalid)}.'
            )
        if len(normalized) != len(set(normalized)):
            raise serializers.ValidationError('Languages must not contain duplicates.')
        return normalized

    def validate_location_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Location is required.')
        return value

    def validate_location_address(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Address is required.')
        return value

    def validate_latitude(self, value):
        if not math.isfinite(value) or not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value

    def validate_longitude(self, value):
        if not math.isfinite(value) or not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value

    def validate_max_slots(self, value):
        if value < 1:
            raise serializers.ValidationError('Maximum slots must be greater than zero.')
        return value

    def validate(self, attrs):
        start_at=attrs.get('start_at', getattr(self.instance,'start_at',None))
        end_at=attrs.get('end_at', getattr(self.instance,'end_at',None))
        if not self.instance and start_at and start_at < timezone.now():
            raise serializers.ValidationError({'start_at': 'Start time cannot be in the past.'})
        if start_at and end_at and end_at <= start_at:
            raise serializers.ValidationError('end_at must be later than start_at.')
        return attrs
