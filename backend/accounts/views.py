from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, MeSerializer, UserPublicSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email=attrs.get('email', '').strip().casefold()
        password=attrs.get('password', '')
        user= get_user_model().objects.filter(email__iexact=email).first()
        if not user or not user.is_active or not user.check_password(password):
            raise AuthenticationFailed('No active account found with the given credentials.')
        self.user=user
        refresh=self.get_token(user)
        return {'refresh':str(refresh), 'access':str(refresh.access_token)}


class EmailLoginView(TokenObtainPairView):
    serializer_class=EmailTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class=RegisterSerializer
    permission_classes=[permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        serializer=self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.save()
        refresh=RefreshToken.for_user(user)
        return Response({'user':UserPublicSerializer(user).data,'access':str(refresh.access_token),'refresh':str(refresh)}, status=201)

class MeView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def get(self, request): return Response(MeSerializer(request.user).data)
    def patch(self, request):
        serializer=MeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
