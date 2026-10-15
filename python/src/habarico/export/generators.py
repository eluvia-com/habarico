"""
Schema generator building the export action of a resource.

``ExportActionDescriptorGenerator`` derives the action descriptor rendered in the ``list_actions``
slot of the list views from the export configuration of the bound admin. ``ModelAdmin`` wires it in
(``get_view_schemas()``); declare an instance on the admin only to configure the action itself -
see ``export_action_schema_generator`` there.
"""

from __future__ import annotations

from habarico.export.config import can_export, get_default_export_format
from habarico.schema.actions import ExportActionDescriptor
from habarico.schema.generators import SchemaGenerator
from habarico.schema.types import ColorType
from rest_framework.fields import empty


class ExportActionDescriptorGenerator(SchemaGenerator):
    """
    Generator of the export action of a resource.

    Builds the action descriptor out of the export configuration of the bound admin, or nothing
    when the admin does not allow the export for the bound request. The descriptor carries its own
    action schema instead of referencing a resource action by name: the object schema of a record
    only carries detail actions, so a name reference would not resolve in a list rendered under a
    record.
    """

    #: Descriptor built by the generator. Override to emit a descriptor subclass.
    descriptor_class = ExportActionDescriptor

    name: str | None = None
    label: str | None = None
    icon: str | None = None
    color: ColorType | None = None
    format: str | None = None
    fields: list[str] | None = None

    def __init__(
        self,
        *,
        name: str | None = empty,
        label: str | None = empty,
        icon: str | None = empty,
        color: ColorType | None = empty,
        format: str | None = empty,
        fields: list[str] | None = empty,
    ):
        """
        Initialize the export action schema generator.

        Args:
            name (str, optional): Name of the action. Defaults to the descriptor's own name.
            label (str, optional): Label of the action. Defaults to the descriptor's own label.
            icon (str, optional): Icon of the action. Defaults to the descriptor's own icon.
            color (ColorType, optional): Color of the action. When not set, the button inherits its
                color from the surrounding context. Defaults to None.
            format (str, optional): Format the frontend requests. Defaults to the first format the
                admin offers in ``export_formats``.
            fields (list[str], optional): Columns the frontend requests. Defaults to None - the
                export endpoint then serves the whole column set the admin configures in
                ``export_fields``.
        """
        super().__init__()
        self.name = name if name is not empty else self.name
        self.label = label if label is not empty else self.label
        self.icon = icon if icon is not empty else self.icon
        self.color = color if color is not empty else self.color
        self.format = format if format is not empty else self.format
        self.fields = fields if fields is not empty else self.fields

    def get_name(self) -> str | None:
        return self.name

    def get_label(self) -> str | None:
        return self.label

    def get_icon(self) -> str | None:
        return self.icon

    def get_color(self) -> ColorType | None:
        return self.color

    def get_format(self) -> str | None:
        """
        Get the format the action asks the export endpoint for.

        Returns:
            str | None: The configured format, or the first format the admin offers.
        """
        if self.format is not None:
            return self.format
        return get_default_export_format(self.get_admin())

    def get_fields(self) -> list[str] | None:
        """
        Get the columns the action asks the export endpoint for.

        Returns:
            list[str] | None: The configured columns, or None to let the endpoint serve the whole
            column set of the admin.
        """
        return self.fields

    def can_render(self) -> bool:
        """
        Whether the resource has an export action at all.

        Returns:
            bool: True when the bound admin allows the export for the bound request
            (``can_export``).
        """
        return can_export(self.get_admin(), self.get_request())

    def get_schema(self) -> ExportActionDescriptor | None:
        """
        Get the export action descriptor.

        Returns:
            ExportActionDescriptor | None: Descriptor of the export action, or None when the
            resource does not export.
        """
        if not self.can_render():
            return None
        return self.descriptor_class(
            name=self.get_name(),
            label=self.get_label(),
            icon=self.get_icon(),
            color=self.get_color(),
            format=self.get_format(),
            fields=self.get_fields(),
        )
