from django.urls import include, path
from habarico import site

urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/admin/", include(site.urls)),
]
