import importlib

from django.apps import AppConfig, apps


class HabaricoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "habarico"

    def ready(self):
        from habarico.checks import register_checks

        register_checks()
        self.autodiscover()

    def autodiscover(self):
        """
        Autodiscover admin modules for all installed apps. It must be run after all apps are loaded.
        """
        for app in apps.get_app_configs():
            admin_module_name = "{}.admin".format(app.name)

            if importlib.util.find_spec(admin_module_name):
                try:
                    importlib.import_module("{}.admin".format(app.name))
                except ValueError as ex:
                    """
                    Ignore django.admin error, because the name of django admin module is the same.
                    """
                    if str(ex) != "site must subclass AdminSite":
                        raise ex
                except LookupError as ex:
                    """
                    Ignore error when the module is not found.
                    """
                    if str(ex) != "No installed app with label 'admin'.":
                        raise ex
