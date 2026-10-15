from django.utils.translation import gettext_lazy as _
from django_filters.conf import DEFAULTS
from habarico.admin import Admin
from habarico.settings import admin_api_settings
from habarico.site import site

__all__ = [
    "Admin",
    "ModelAdmin",
    "site",
]


def __getattr__(name):
    # Resolved lazily via DEFAULT_MODEL_ADMIN_CLASS (habarico.settings), on first attribute
    # access - never as a module-level assignment. Django imports this package while iterating
    # INSTALLED_APPS during AppConfig.create(), before apps.apps_ready is set, so an eager
    # assignment here would force-import whatever dependency graph the configured class (core or
    # a pro/enterprise override) pulls in at that moment - see HAB-852, where
    # habarico_enterprise.admin.ModelAdmin's import chain reached DRF's schema machinery and
    # crashed with AppRegistryNotReady. Admin and site stay eager imports above: Admin is shallow
    # and core-only, and site.py itself defers building its DEFAULT_ADMIN_SITE_CLASS singleton the
    # same way (see habarico.site._build_site) - importing the *module* here is cheap.
    if name == "ModelAdmin":
        return admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


DEFAULTS["VERBOSE_LOOKUPS"]["in"] = _("list")
