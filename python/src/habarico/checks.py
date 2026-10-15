"""
Django system checks guarding the admin API configuration.

Registered by :class:`habarico.apps.HabaricoConfig`, so they run with ``manage.py check`` and on
every ``runserver``/``migrate`` start.
"""

from django.core.checks import Tags, Warning, register
from rest_framework.permissions import AllowAny


def check_default_permission_classes(app_configs, **kwargs) -> list[Warning]:
    """
    Warn when the admin API is effectively open to anonymous requests.

    Reads the *effective* ``DEFAULT_PERMISSION_CLASSES`` — core default, extension contributions
    and the project's ``REST_FRAMEWORK`` / ``ADMIN_REST_FRAMEWORK`` overrides already folded in —
    and flags a configuration that contains ``AllowAny`` or is empty. Either one hands anonymous
    CRUD over every registered model (plus any extension endpoints) to the world, which is a
    deployment accident far more often than a decision (HAB-894).

    Args:
        app_configs: App configs Django asks to check; unused — the setting is global.
        **kwargs: Extra arguments passed by the check framework.

    Returns:
        list[Warning]: A single ``habarico.W001`` warning, or an empty list.
    """
    # Imported lazily so importing this module never triggers settings/extension resolution.
    from habarico.settings import admin_api_settings

    permission_classes = admin_api_settings.DEFAULT_PERMISSION_CLASSES
    if permission_classes and AllowAny not in permission_classes:
        return []
    return [
        Warning(
            "The habarico admin API allows anonymous access: the effective "
            "DEFAULT_PERMISSION_CLASSES is empty or contains rest_framework.permissions.AllowAny.",
            hint=(
                'Set ADMIN_REST_FRAMEWORK = {"DEFAULT_PERMISSION_CLASSES": [...]} to a permission '
                "class matching your project's roles (or at least "
                '"rest_framework.permissions.IsAuthenticated"). If anonymous access is intended, '
                'silence this check with SILENCED_SYSTEM_CHECKS = ["habarico.W001"].'
            ),
            id="habarico.W001",
        )
    ]


def register_checks() -> None:
    """
    Register the habarico system checks. Called from ``HabaricoConfig.ready()``.
    """
    register(check_default_permission_classes, Tags.security)
