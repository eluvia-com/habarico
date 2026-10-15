"""
Tests for extension point 8 (HAB-811): the swappable file-field mixin.

``serializers/fields.py`` (AdminFileSerializer/AdminImageFileSerializer base classes)
and ``serializers/__init__.py`` (isinstance/issubclass checks) no longer import any
upload-specific class directly - both resolve DEFAULT_FILE_FIELD_MIXIN_CLASS instead.
Chunked uploads moved to habarico_enterprise (HAB-845), so the default is empty here - a
free-only install never imports it.
"""

from habarico.serializers import AdminFileSerializer, AdminImageFileSerializer, _file_field_mixin_classes
from habarico.settings import admin_api_settings


class _DemoChunkedUploadFieldMixin:
    """Stand-in for habarico_enterprise.uploads.fields.ChunkedUploadFieldMixin."""


class TestDefaultUploadFieldMixinWiring:
    def test_default_is_unset(self):
        assert admin_api_settings.DEFAULT_FILE_FIELD_MIXIN_CLASS is None

    def test_default_serializers_do_not_include_any_mixin(self):
        assert _file_field_mixin_classes() == ()
        assert issubclass(AdminFileSerializer, _file_field_mixin_classes()) is False
        assert issubclass(AdminImageFileSerializer, _file_field_mixin_classes()) is False

    def test_overridden_setting_is_picked_up(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_FILE_FIELD_MIXIN_CLASS": (
                "app.tests.test_extension_point_upload_field_mixin._DemoChunkedUploadFieldMixin"
            )
        }

        assert _file_field_mixin_classes() == (_DemoChunkedUploadFieldMixin,)
