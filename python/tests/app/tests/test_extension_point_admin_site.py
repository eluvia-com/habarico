"""
Tests for extension point 4 (HAB-811): swappable AdminSite.

The module-level ``site`` singleton wraps ``DEFAULT_ADMIN_SITE_CLASS`` (habarico.settings) in
``django.utils.functional.SimpleLazyObject`` rather than instantiating it directly at import
time (HAB-852) - a pro/enterprise package points this setting at its own ``AdminSite``
subclass (e.g. overriding ``urls`` to append its own routes via ``super().urls``) before
``habarico`` is first imported, but the instance itself is only built - and then cached for
the rest of the process - the first time something actually uses ``site`` (attribute access,
``bool()``, iteration, ...), never while Django is still iterating ``INSTALLED_APPS`` during
``AppConfig.create()``. Because of the wrapper, ``type(site)`` is always ``SimpleLazyObject``;
code that needs the real class checks with ``isinstance()`` instead.
"""

import importlib

import pytest
from django.utils.functional import SimpleLazyObject
from habarico.settings import admin_api_settings
from habarico.site import AdminSite
from habarico.site import site as site_singleton


class _DemoAdminSiteWithExtraRoute(AdminSite):
    @property
    def urls(self):
        urls, namespace = super().urls
        from django.urls import path

        return urls + [path("demo-extension-point/", lambda request: None, name="demo-extension-point")], namespace


class TestDefaultAdminSiteWiring:
    def test_default_is_core_class(self):
        assert admin_api_settings.DEFAULT_ADMIN_SITE_CLASS is AdminSite

    def test_singleton_is_core_class_by_default(self):
        assert isinstance(site_singleton, AdminSite)

    def test_subclass_extends_urls_via_super(self, db):
        subclass_instance = _DemoAdminSiteWithExtraRoute()
        for admin_class in site_singleton._registry.values():
            subclass_instance.register(admin_class)

        urls, namespace = subclass_instance.urls

        url_names = [getattr(url, "name", None) for url in urls]
        assert "admin-schema" in url_names
        assert "demo-extension-point" in url_names


class TestAdminSiteResolutionIsLazy:
    """Regression tests for HAB-852."""

    def test_module_attribute_is_a_lazy_wrapper(self):
        # Proves `site` defers to DEFAULT_ADMIN_SITE_CLASS via SimpleLazyObject rather than
        # holding a directly-instantiated AdminSite - type() (unlike isinstance(), which
        # SimpleLazyObject's __class__ override fools on purpose) still reports the wrapper,
        # so this stays true even once the wrapped instance has been built.
        assert type(site_singleton) is SimpleLazyObject

    def test_building_it_eagerly_is_what_would_crash(self, settings):
        # Confirms _build_site() - the callable the SimpleLazyObject above defers - really does
        # propagate a broken configured class, i.e. it is genuinely unsafe to call at package
        # import time and must stay wrapped. Calls it directly rather than touching the shared
        # `site` singleton, which every other test in this suite depends on staying built.
        #
        # Fetched via sys.modules (importlib.import_module returns the cached entry) rather
        # than `habarico.site`: that attribute now resolves to the SimpleLazyObject singleton
        # itself, since habarico/__init__.py's own `from habarico.site import site` already
        # shadowed the package's auto-bound submodule reference with it.
        site_module = importlib.import_module("habarico.site")
        settings.ADMIN_REST_FRAMEWORK = {"DEFAULT_ADMIN_SITE_CLASS": "app.tests.extension_stubs.broken_import.Anything"}

        # DRF's perform_import() wraps the underlying ModuleNotFoundError in a plain ImportError.
        with pytest.raises(ImportError, match="totally_missing_dependency"):
            site_module._build_site()
