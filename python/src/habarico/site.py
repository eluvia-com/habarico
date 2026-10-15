from __future__ import annotations

from typing import TYPE_CHECKING, Type

from django.core.exceptions import ImproperlyConfigured
from django.urls import path
from django.utils.functional import SimpleLazyObject
from habarico.config import NAMESPACE
from habarico.settings import admin_api_settings
from rest_framework.request import Request

if TYPE_CHECKING:
    from habarico.admin import Admin
    from habarico.views import AdminSchemaView


class AdminSite:
    """
    Class that stores all registered admin classes and provides methods to access them.
    """

    def __init__(self):
        self._registry = {}
        self._routers = []

    def exists_admin(self, name: str) -> bool:
        """
        Check if an admin class is registered.
        :param name: admin name.
        :return: True if the admin is registered, False otherwise.
        """
        return name in self._registry

    def get_admin(self, name: str) -> Admin:
        """
        Get the admin class by name.
        :param name: admin name.
        :return: Admin instance.
        """
        return self._registry[name]()

    def register(self, admin_class: Type[Admin]):
        """
        Register an admin class.

        The admin declaration is validated here — once per class, when it is registered at app
        startup — and not on every instantiation: ``get_admin`` / ``get_schema`` build a fresh
        admin instance for each request.

        :param admin_class: Admin class to register.
        """
        admin_instance = admin_class()
        admin_instance.validate_configuration()

        name = admin_instance.name

        if name in self._registry:
            raise ImproperlyConfigured(f"Admin class {admin_class} is already registered.")

        self._registry[name] = admin_class
        self._routers.append(admin_instance.get_router())

    def get_schema(self, request: Request) -> list[dict]:
        """
        Return the schema of all registered admins.
        :param request: DRF request.
        :return: list of schemas.
        """
        schema = []
        for admin_class in self._registry.values():
            admin_instance = admin_class()
            admin_schemas = admin_instance.get_schema(request)
            if not isinstance(admin_schemas, list):
                admin_schemas = [admin_schemas]
            schema.extend([schema.to_dict(request=request) for schema in admin_schemas])
        return schema

    def get_schema_view(self) -> AdminSchemaView:
        """
        Creates a view for the admin entrypoint that returns the schema of the admin.
        """
        from habarico.views import AdminSchemaView

        return path("schema/", AdminSchemaView.as_view(), name="admin-schema")

    @property
    def urls(self) -> list:
        """
        Returns the router urlconf object, appname, and url namespace
        """
        from django.apps import apps

        urls = []
        for router in self._routers:
            urls.extend(router.urls)

        extra = [self.get_schema_view()]

        if apps.is_installed("habarico.contrib.preferences"):
            from habarico.contrib.preferences.urls import urlpatterns as preferences_urls

            extra.extend(preferences_urls)

        return urls + extra, NAMESPACE


def _build_site() -> AdminSite:
    """
    Build the ``DEFAULT_ADMIN_SITE_CLASS`` singleton.

    Called lazily via the ``SimpleLazyObject`` below, never directly at module import time:
    Django imports ``habarico`` (and therefore this module, via ``habarico/__init__.py``)
    while iterating ``INSTALLED_APPS`` during ``AppConfig.create()``, before
    ``apps.apps_ready`` is set. Calling this eagerly there would force-import whatever
    dependency graph the configured class (core or a pro/enterprise override) pulls in at
    that moment - see HAB-852, where the sibling eager resolution of ``ModelAdmin`` crashed
    with ``AppRegistryNotReady`` for exactly this reason.
    """
    return admin_api_settings.DEFAULT_ADMIN_SITE_CLASS()


# A true singleton once built, unlike the bare class reference `habarico.ModelAdmin`:
# `AdminSite` accumulates registrations via `register()` as admin modules import `site`, so
# re-running `_build_site()` on every access would hand each caller its own empty registry.
# `SimpleLazyObject` defers the call until `site` is first actually used (attribute access,
# `bool()`, iteration, ...) and then caches the result for the rest of the process - `site`
# itself stays a real module attribute the whole time, so this needs no module `__getattr__`.
site = SimpleLazyObject(_build_site)
