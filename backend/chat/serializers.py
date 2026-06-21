from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Message
class MessageSerializer(serializers.ModelSerializer):
    sender=UserPublicSerializer(read_only=True)
    class Meta:
        model=Message
        fields=['id','event','sender','text','created_at']
        read_only_fields=['id','event','sender','created_at']
