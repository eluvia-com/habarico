"""
Tests for the extension-point settings introduced in HAB-811.

Each DEFAULT_*_CLASS setting resolves to the core implementation by default and can
be pointed at a subclass (e.g. shipped by a pro/enterprise package) via
``ADMIN_REST_FRAMEWORK`` in Django settings - no registry, no import of that package
from core.
"""

from habarico.settings import admin_api_settings


class TestExtensionPointSettingsDefaults:
    """Defaults must resolve to today's core implementation - zero behavior change."""

    def test_default_model_admin_class(self):
        from habarico.admin import ModelAdmin

        assert admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS is ModelAdmin

    def test_default_viewset_class(self):
        from habarico.views import AdminModelViewSet

        assert admin_api_settings.DEFAULT_VIEWSET_CLASS is AdminModelViewSet

    def test_default_field_schema_generator_class(self):
        from habarico.schema.generators import FieldSchemaGenerator

        assert admin_api_settings.DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS is FieldSchemaGenerator

    def test_default_admin_site_class(self):
        from habarico.site import AdminSite

        assert admin_api_settings.DEFAULT_ADMIN_SITE_CLASS is AdminSite

    def test_default_field_type_resolver_class(self):
        from habarico.schema.generators import FieldTypeResolver

        assert admin_api_settings.DEFAULT_FIELD_TYPE_RESOLVER_CLASS is FieldTypeResolver

    def test_default_file_field_mixin_class(self):
        # Chunked uploads moved to habarico_enterprise (HAB-845) - unset by default.
        assert admin_api_settings.DEFAULT_FILE_FIELD_MIXIN_CLASS is None


class TestExtensionPointSettingsOverride:
    """A setting override (as a pro/enterprise package would configure) must take effect."""

    def test_override_model_admin_class(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {"DEFAULT_MODEL_ADMIN_CLASS": "habarico.admin.Admin"}
        from habarico.admin import Admin

        assert admin_api_settings.DEFAULT_MODEL_ADMIN_CLASS is Admin
