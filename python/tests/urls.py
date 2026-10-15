"""
URL configuration for habarico test application.
"""

from app.views import OutsideArticleViewSet
from django.urls import include, path
from habarico import site
from rest_framework.routers import DefaultRouter

outside_router = DefaultRouter()
outside_router.register("article", OutsideArticleViewSet, basename="outside-article")

urlpatterns = [
    path("admin/", include(site.urls)),
    # Deliberately outside the habarico namespace - see app/views.py.
    path("outside/", include(outside_router.urls)),
]
