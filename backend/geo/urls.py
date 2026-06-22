from django.urls import path

from .views import GeoRememberView, GeoReverseView, GeoSearchView

urlpatterns = [
    path("search/", GeoSearchView.as_view(), name="geo-search"),
    path("reverse/", GeoReverseView.as_view(), name="geo-reverse"),
    path("remember/", GeoRememberView.as_view(), name="geo-remember"),
]
