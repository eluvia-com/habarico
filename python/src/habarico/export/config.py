"""
Reading of the export configuration a resource declares.

A resource configures its export on the ``ModelAdmin`` (``export_enabled``, ``export_fields``,
``export_formats``), with ``EXPORT_RENDERER_CLASSES`` of ``ADMIN_REST_FRAMEWORK`` as the fallback
of the formats. Both the export endpoint and the schema generator have to resolve the very same
values - the endpoint to serve the document, the generator to describe the export action in the
schema - so the accessors live here instead of on one of them.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ImproperlyConfigured
from habarico.settings import admin_api_settings

if TYPE_CHECKING:
    from habarico.admin import ModelAdmin
    from habarico.export.renderers import BaseExportRenderer
    from rest_framework.request import Request


def can_export(admin: ModelAdmin, request: Request | None) -> bool:
    """
    Whether the request may export the resource.

    Asks the admin's ``can_export()``, which defaults to its ``export_enabled`` flag and is the hook
    restricting the export per user.

    Args:
        admin (ModelAdmin): Admin of the resource.
        request (Request | None): Current request, or None outside the request cycle.

    Returns:
        bool: True when the resource may be exported.
    """
    return bool(admin.can_export(request))


def get_registered_renderer_classes() -> list[type[BaseExportRenderer]]:
    """
    Get the renderers of the installation, in the order their formats are offered.

    Returns:
        list[type[BaseExportRenderer]]: Renderer classes from ``EXPORT_RENDERER_CLASSES``.
    """
    return list(admin_api_settings.EXPORT_RENDERER_CLASSES)


def get_export_formats(admin: ModelAdmin) -> list[str]:
    """
    Get the document formats the resource offers.

    Args:
        admin (ModelAdmin): Admin of the resource.

    Returns:
        list[str]: Format names in the offered order - the admin's ``export_formats``, or every
        registered format when the admin does not narrow them down.
    """
    formats = admin.export_formats
    if formats:
        return list(formats)
    return [renderer_class.format for renderer_class in get_registered_renderer_classes()]


def get_default_export_format(admin: ModelAdmin) -> str | None:
    """
    Get the format the resource serves when the request does not ask for one.

    The order of the offered formats is what decides it - the first one is both the default of the
    DRF content negotiation and the one the export action advertises in the schema.

    Args:
        admin (ModelAdmin): Admin of the resource.

    Returns:
        str | None: The first offered format, or None when the resource offers none.
    """
    formats = get_export_formats(admin)
    return formats[0] if formats else None


def get_export_renderer_classes(admin: ModelAdmin) -> list[type[BaseExportRenderer]]:
    """
    Resolve the formats the resource offers into renderer classes.

    Args:
        admin (ModelAdmin): Admin of the resource.

    Returns:
        list[type[BaseExportRenderer]]: Renderers in the order the formats are offered; the first
        one is the default of the content negotiation.

    Raises:
        ImproperlyConfigured: When the admin offers a format no registered renderer serves.
    """
    available = {renderer_class.format: renderer_class for renderer_class in get_registered_renderer_classes()}
    renderer_classes = []
    for export_format in get_export_formats(admin):
        renderer_class = available.get(export_format)
        if renderer_class is None:
            raise ImproperlyConfigured(
                f"Export format '{export_format}' of the '{admin.name}' admin has no renderer. "
                f"Registered formats: {', '.join(sorted(available)) or '-'}. Add the renderer to "
                "ADMIN_REST_FRAMEWORK['EXPORT_RENDERER_CLASSES']."
            )
        renderer_classes.append(renderer_class)
    return renderer_classes
