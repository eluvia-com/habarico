"""
Tests for the habarico system checks and the permission defaults they guard.
"""

from django.core.checks.registry import registry
from habarico.checks import check_default_permission_classes
from habarico.settings import admin_api_settings
from rest_framework.permissions import IsAuthenticated


class TestDefaultPermissionClasses:
    def test_default_permission_classes_is_is_authenticated(self, settings):
        settings.REST_FRAMEWORK = {}
        settings.ADMIN_REST_FRAMEWORK = {}

        assert admin_api_settings.DEFAULT_PERMISSION_CLASSES == [IsAuthenticated]


class TestCheckDefaultPermissionClasses:
    def test_warns_when_allow_any_is_active(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
        }

        warnings = check_default_permission_classes(app_configs=None)

        assert [warning.id for warning in warnings] == ["habarico.W001"]

    def test_warns_when_allow_any_is_combined_with_other_classes(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_PERMISSION_CLASSES": [
                "rest_framework.permissions.IsAuthenticated",
                "rest_framework.permissions.AllowAny",
            ],
        }

        warnings = check_default_permission_classes(app_configs=None)

        assert [warning.id for warning in warnings] == ["habarico.W001"]

    def test_warns_when_allow_any_is_inherited_from_rest_framework_setting(self, settings):
        settings.REST_FRAMEWORK = {
            "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
        }
        settings.ADMIN_REST_FRAMEWORK = {}

        warnings = check_default_permission_classes(app_configs=None)

        assert [warning.id for warning in warnings] == ["habarico.W001"]

    def test_warns_when_permission_classes_are_empty(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {"DEFAULT_PERMISSION_CLASSES": []}

        warnings = check_default_permission_classes(app_configs=None)

        assert [warning.id for warning in warnings] == ["habarico.W001"]

    def test_silent_on_the_default(self, settings):
        settings.REST_FRAMEWORK = {}
        settings.ADMIN_REST_FRAMEWORK = {}

        assert check_default_permission_classes(app_configs=None) == []

    def test_silent_when_allow_any_is_not_used(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAdminUser"],
        }

        assert check_default_permission_classes(app_configs=None) == []

    def test_check_is_registered(self):
        assert check_default_permission_classes in registry.registered_checks
