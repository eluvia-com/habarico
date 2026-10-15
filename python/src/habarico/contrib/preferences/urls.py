from django.urls import path, re_path
from habarico.contrib.preferences.views import UserPreferenceViewSet

user_preferences_collection = UserPreferenceViewSet.as_view(
    {
        "get": "list",
        "delete": "destroy_all",
    }
)
user_preferences_detail = UserPreferenceViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "delete": "destroy",
    }
)

urlpatterns = [
    path("user-preferences/", user_preferences_collection, name="user-preferences-list"),
    re_path(
        r"^user-preferences/(?P<key>[a-zA-Z][a-zA-Z0-9_./-]*)/$",
        user_preferences_detail,
        name="user-preferences-detail",
    ),
]
