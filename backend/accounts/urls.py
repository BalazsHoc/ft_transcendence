from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import EmailLoginView, RegisterView, MeView

from .google_auth import (
    GoogleLoginStartView,
    GoogleLoginCallbackView,
    GoogleLoginExchangeView,
)

urlpatterns=[
	path('register/',RegisterView.as_view()),
	path('login/',EmailLoginView.as_view()),
	path('refresh/',TokenRefreshView.as_view()),
	path('me/',MeView.as_view()),


    path("google/start/", GoogleLoginStartView.as_view()),
    path("google/callback/", GoogleLoginCallbackView.as_view()),
    path("google/exchange/", GoogleLoginExchangeView.as_view()),
]
