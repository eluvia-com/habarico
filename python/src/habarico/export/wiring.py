"""
Wiring of the export into an admin.

The helpers putting an exporting resource together, called by ``ModelAdmin`` and by the export
viewset: the export classes are composed onto the classes the application already uses, and the
export action is appended to the ``list_actions`` slot of the list views. Neither replaces what the
application declares - a viewset that already exports is left as it is, and a list view carrying an
export action of its own keeps it.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from habarico.schema.actions import get_action_name

if TYPE_CHECKING:
    from habarico.schema.actions import ExportActionDescriptor
    from habarico.schema.generators import ListViewSchemaGenerator
    from habarico.views import AdminModelViewSet
    from rest_framework.serializers import Serializer


@lru_cache(maxsize=None)
def compose_export_viewset(export_viewset: type, base_viewset: type) -> type[AdminModelViewSet]:
    """
    Mix the export viewset into the base viewset of a resource.

    Cached: a resource builds its viewset class once, so the composed class is built once per pair
    instead of on every request that reads the viewset of a resource.

    Args:
        export_viewset (type): Export viewset - ``EXPORT_VIEWSET_CLASS``.
        base_viewset (type): Viewset the admin already uses.

    Returns:
        type[AdminModelViewSet]: The base viewset itself when it already derives from the export
        one, otherwise a composed subclass putting the export behaviour in front of it.
    """
    return _compose(export_viewset, base_viewset)


def compose_export_serializer(export_mixin: type, base_serializer: type) -> type[Serializer]:
    """
    Mix the export behaviour into the serializer class of the running export.

    Deliberately not cached, unlike :func:`compose_export_viewset`: ``get_serializer_class()``
    builds the admin serializer class per request (the fields depend on the action and the
    request), so caching by class identity would grow without bound.

    Args:
        export_mixin (type): Mixin narrowing the serializer down to the exported columns.
        base_serializer (type): Serializer class of the resource.

    Returns:
        type[Serializer]: The serializer itself when it already carries the mixin, otherwise a
        composed subclass.
    """
    return _compose(export_mixin, base_serializer)


def _compose(export_class: type, base_class: type) -> type:
    """
    Compose an export class in front of a base class of the same kind.

    Args:
        export_class (type): Export class to mix in.
        base_class (type): Class the application already uses.

    Returns:
        type: The base class itself when it already derives from the export class, otherwise a
        composed subclass.
    """
    if issubclass(base_class, export_class):
        return base_class
    return type(f"Export{base_class.__name__}", (export_class, base_class), {})


def add_export_list_action(generator: ListViewSchemaGenerator, export_action: ExportActionDescriptor) -> None:
    """
    Append the export action to the ``list_actions`` of one list view generator.

    The action declared by hand wins - a list view already carrying an export action (as a
    descriptor or a name reference) keeps it and does not get a second one.

    Args:
        generator (ListViewSchemaGenerator): Per-request copy of a list view generator.
        export_action (ExportActionDescriptor): Action to append.
    """
    actions = list(generator.list_actions or [])
    export_action_name = get_action_name(export_action)
    if any(get_action_name(action) == export_action_name for action in actions):
        return
    generator.list_actions = actions + [export_action]
