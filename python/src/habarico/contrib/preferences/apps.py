from django.apps import AppConfig


class PreferencesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "habarico.contrib.preferences"
    label = "habarico_preferences"
    verbose_name = "Habarico user preferences"

    def ready(self):
        from habarico.contrib.preferences.base import register_base_preferences

        register_base_preferences()
