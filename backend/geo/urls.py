from django.urls import path

from .views import GeoMapStyleView, GeoRememberView, GeoReverseView, GeoSearchView

urlpatterns = [
    path("map-style/", GeoMapStyleView.as_view(), name="geo-map-style"),
    path("search/", GeoSearchView.as_view(), name="geo-search"),
    path("reverse/", GeoReverseView.as_view(), name="geo-reverse"),
    path("remember/", GeoRememberView.as_view(), name="geo-remember"),
]
