from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers
from core.districts import DISTRICT_CODES
from .presence import is_user_online
User=get_user_model()

class UserPublicSerializer(serializers.ModelSerializer):
    is_online=serializers.SerializerMethodField()
    class Meta:
        model=User
        fields=['id','username','first_name','last_name','district','bio','languages','interests','avatar','is_online','last_seen','created_at']
        read_only_fields=['id','is_online','last_seen','created_at']
    def get_is_online(self, obj) -> bool:
        return is_user_online(obj.pk)

class RegisterSerializer(serializers.ModelSerializer):
    name=serializers.CharField(source='first_name', write_only=True, max_length=150)
    password=serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    password_confirm=serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    email=serializers.EmailField(required=True)
    district=serializers.ChoiceField(choices=DISTRICT_CODES, required=True)
    class Meta:
        model=User
        fields=['id','email','name','password','password_confirm','district','languages','interests']
        read_only_fields=['id']
    def validate_email(self, value):
        normalized=value.strip().casefold()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return normalized
    def validate_name(self, value):
        normalized=' '.join(value.split())
        if len(normalized) < 2:
            raise serializers.ValidationError('Name must contain at least 2 characters.')
        return normalized
    def validate(self, attrs):
        password=attrs.get('password')
        if password != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm':'Passwords do not match.'})
        validate_password(password, User(
            email=attrs.get('email'),
            first_name=attrs.get('first_name'),
        ))
        attrs.pop('password_confirm', None)
        return attrs
    def _unique_username(self, name, email):
        base=slugify(name, allow_unicode=True) or slugify(email.split('@', 1)[0], allow_unicode=True) or 'user'
        base=base[:140]
        candidate=base
        suffix=2
        while User.objects.filter(username=candidate).exists():
            candidate=f'{base[:max(1, 150-len(str(suffix))-1)]}-{suffix}'
            suffix += 1
        return candidate
    def create(self, validated_data):
        password=validated_data.pop('password')
        name=validated_data.get('first_name', '')
        email=validated_data.get('email', '')
        return User.objects.create_user(
            username=self._unique_username(name, email),
            password=password,
            **validated_data,
        )

class MeSerializer(serializers.ModelSerializer):
    is_online=serializers.SerializerMethodField()
    class Meta:
        model=User
        fields=['id','username','email','first_name','last_name','district','bio','languages','interests','avatar','is_online','last_seen','created_at']
        read_only_fields=['id','username','email','is_online','last_seen','created_at']
    def get_is_online(self, obj) -> bool:
        return is_user_online(obj.pk)


class UserPresenceSerializer(serializers.ModelSerializer):
    user_id=serializers.UUIDField(source='id', read_only=True)
    is_online=serializers.SerializerMethodField()
    class Meta:
        model=User
        fields=['user_id','is_online','last_seen']
        read_only_fields=fields
    def get_is_online(self, obj) -> bool:
        return is_user_online(obj.pk)
