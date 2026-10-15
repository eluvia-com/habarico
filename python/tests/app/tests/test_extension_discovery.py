"""
Tests for extension discovery (HAB-811).

Core imports ``habarico_enterprise.extensions`` by name while resolving its settings, so installing
the package is the whole configuration. The contributions sit between core's ``DEFAULTS`` and the
project's ``ADMIN_REST_FRAMEWORK``: installing switches a feature on, and the project still
overrides any single key.

The extension is not installed in this environment, so the cases below point
``EXTENSION_MODULE`` at a stand-in module instead.
"""

import pytest
from django.core.exceptions import ImproperlyConfigured
from habarico import settings as habarico_settings
from habarico.settings import admin_api_settings

#: Stand-in for ``habarico_enterprise.extensions.CONTRIBUTIONS``; this module plays the extension.
CONTRIBUTIONS = {"DEFAULT_MODEL_ADMIN_CLASS": "app.tests.test_extension_discovery._DemoModelAdmin"}


class _DemoModelAdmin:
    """Stand-in for habarico_enterprise.admin.ModelAdmin."""


class _ProjectModelAdmin:
    """Stand-in for a class the project wires up itself."""


@pytest.fixture
def installed_extension(monkeypatch):
    """Pretend the named module is the installed extension, and restore discovery afterwards."""

    def install(module_name: str):
        monkeypatch.setattr(habarico_settings, "EXTENSION_MODULE", module_name)
        admin_api_settings.reload()

    yield install
    monkeypatch.undo()
    admin_api_settings.reload()


class TestExtensionDiscovery:
    def test_not_installed_keeps_core_defaults(self, installed_extension):
        installed_extension("no_such_package.extensions")

        assert admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS.__module__ == "habarico.admin"

    def test_contribution_replaces_the_core_default(self, installed_extension):
        installed_extension("app.tests.test_extension_discovery")

        assert admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS is _DemoModelAdmin

    def test_project_setting_beats_a_contribution(self, installed_extension, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_MODEL_ADMIN_CLASS": "app.tests.test_extension_discovery._ProjectModelAdmin"
        }
        installed_extension("app.tests.test_extension_discovery")

        assert admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS is _ProjectModelAdmin

    def test_discovery_can_be_switched_off(self, installed_extension, settings):
        settings.ADMIN_REST_FRAMEWORK = {"EXTENSION_DISCOVERY_ENABLED": False}
        installed_extension("app.tests.test_extension_discovery")

        assert admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS.__module__ == "habarico.admin"

    def test_settings_unrelated_to_the_extension_are_untouched(self, installed_extension):
        installed_extension("app.tests.test_extension_discovery")

        assert admin_api_settings.DEFAULT_FILE_FIELD_MIXIN_CLASS is None


class TestExtensionDiscoveryErrors:
    def test_unknown_setting_name_raises(self, installed_extension):
        with pytest.raises(ImproperlyConfigured, match="unknown setting"):
            installed_extension("app.tests.extension_stubs.unknown_setting")
            admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS

    def test_a_broken_extension_keeps_raising(self, installed_extension):
        """It must not fail once and then degrade silently to the core defaults."""
        installed_extension("app.tests.extension_stubs.unknown_setting")

        for _ in range(2):
            with pytest.raises(ImproperlyConfigured, match="unknown setting"):
                admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS

    def test_import_error_inside_the_extension_is_not_swallowed(self, installed_extension):
        """A missing dependency of an installed extension must surface, not disable it silently."""
        with pytest.raises(ModuleNotFoundError, match="totally_missing_dependency"):
            installed_extension("app.tests.extension_stubs.broken_import")
            admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS
