from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Event, EventParticipant

class EventParticipantSerializer(serializers.ModelSerializer):
    user=UserPublicSerializer(read_only=True)
    class Meta:
        model=EventParticipant
        fields=['id','user','status','queue_position','joined_at']

class EventSerializer(serializers.ModelSerializer):
    creator=UserPublicSerializer(read_only=True)
    participants=EventParticipantSerializer(many=True, read_only=True)
    attending_count=serializers.IntegerField(read_only=True)
    waiting_count=serializers.IntegerField(read_only=True)
    user_status=serializers.SerializerMethodField()
    class Meta:
        model=Event
        fields=['id','title','description','image','sport','level','languages','location_name','location_address','latitude','longitude','start_at','end_at','max_slots','creator','participants','attending_count','waiting_count','user_status','created_at','updated_at']
        read_only_fields=['id','creator','created_at','updated_at']
    def get_user_status(self,obj):
        request=self.context.get('request')
        if not request or not request.user.is_authenticated: return None
        p=obj.participants.filter(user=request.user).first()
        return None if not p else {'status':p.status,'queue_position':p.queue_position}
    def validate(self, attrs):
        start_at=attrs.get('start_at', getattr(self.instance,'start_at',None))
        end_at=attrs.get('end_at', getattr(self.instance,'end_at',None))
        if start_at and end_at and end_at <= start_at:
            raise serializers.ValidationError('end_at must be later than start_at.')
        return attrs
