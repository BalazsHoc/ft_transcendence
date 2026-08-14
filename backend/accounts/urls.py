from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import EmailLoginView, RegisterView, MeView
urlpatterns=[
	path('register/',RegisterView.as_view()),
	path('login/',EmailLoginView.as_view()),
	path('refresh/',TokenRefreshView.as_view()),
	path('me/',MeView.as_view())
]
