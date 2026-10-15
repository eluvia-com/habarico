"""
Tests for extension point 1 (HAB-811): swappable default ModelAdmin.

``habarico.ModelAdmin`` is resolved lazily, from ``DEFAULT_MODEL_ADMIN_CLASS``, on first
attribute access rather than at package import time (HAB-852) - the same way
``habarico.site.site`` resolves ``DEFAULT_ADMIN_SITE_CLASS`` lazily. This mirrors how a
Django project configures ``INSTALLED_APPS``/settings before anything imports the app - a
pro/enterprise package is enabled by setting ``ADMIN_REST_FRAMEWORK`` before ``habarico`` is
first imported, not by changing settings at runtime - but the resolution itself must wait
for actual use: Django imports the ``habarico`` package while iterating ``INSTALLED_APPS``
during ``AppConfig.create()``, before ``apps.apps_ready`` is set, so eagerly resolving the
configured class right there would force-import whatever dependency graph it pulls in at a
point where e.g. ``django.apps.apps.get_app_configs()`` isn't safe to call yet.
"""

import importlib

import habarico
import pytest
from habarico.admin import ModelAdmin as CoreModelAdmin
from habarico.settings import admin_api_settings


class TestDefaultModelAdminWiring:
    def test_public_export_is_core_class_by_default(self):
        assert habarico.ModelAdmin is CoreModelAdmin

    def test_subclassing_the_public_export_still_auto_registers(self, db):
        class ExtensionPointDemoAdmin(habarico.ModelAdmin):
            abstract = True

        # abstract=True means it must NOT show up in the global registry.
        assert not habarico.site.exists_admin("extensionpointdemo")


class TestModelAdminResolutionIsLazy:
    """Regression tests for HAB-852."""

    def test_not_resolved_as_a_plain_module_attribute(self):
        # A PEP 562 module __getattr__ only fires for names that are NOT already in the
        # module's __dict__ - so ModelAdmin must not be one, confirming resolution happens on
        # access, not at import time.
        assert "ModelAdmin" not in vars(habarico)

    def test_package_import_survives_a_broken_default_class(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_MODEL_ADMIN_CLASS": "app.tests.extension_stubs.broken_import.Anything"
        }
        admin_api_settings.reload()

        # Must not raise even though the configured class can't be imported - reloading the
        # package re-runs habarico/__init__.py, standing in for Django importing it fresh
        # during AppConfig.create(), before apps_ready.
        importlib.reload(habarico)

        # DRF's perform_import() wraps the underlying ModuleNotFoundError in a plain ImportError.
        with pytest.raises(ImportError, match="totally_missing_dependency"):
            habarico.ModelAdmin
