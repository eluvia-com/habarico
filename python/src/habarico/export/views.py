"""
Admin viewset serving list data as a downloadable export document.

``ExportAdminModelViewSet`` adds a ``GET <resource>/export/`` endpoint to the regular admin
viewset, with the same queryset, filters and ordering as the list view. It is not wired in by
hand - ``ModelAdmin.get_base_viewset()`` mixes it into the base viewset of every resource that
exports, and a resource that does not export (``export_enabled`` / ``can_export``) has no endpoint
at all. The query parameters are documented in ``contract/openapi.yaml``.
"""

from __future__ import annotations

from collections.abc import Iterable

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.utils.translation import gettext_lazy as _
from eluvia_base.integrations.fieldset import DEFAULT_FIELDS, RFS
from habarico.config import EXPORT_ACTION
from habarico.export.config import can_export, get_export_formats, get_export_renderer_classes
from habarico.export.renderers import (
    EXPORT_COLUMNS_CONTEXT_KEY,
    EXPORT_TITLE_CONTEXT_KEY,
    BaseExportRenderer,
    ExportColumn,
)
from habarico.export.wiring import compose_export_serializer
from habarico.schema.fields import Field
from habarico.utils import LOOKUP_SEP, cap_first, walk_to_leaf_field
from habarico.views import AdminModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

#: Number of rows the free library still exports synchronously. A constant rather than a setting:
#: the synchronous export builds the whole document in the request, so a project raising the limit
#: would only trade the error for a blocked worker. Bigger exports are what the asynchronous
#: export of ``habarico_enterprise`` (HAB-628) is for - it answers with 202 and builds the document
#: in the background.
EXPORT_ROW_LIMIT = 10000


def build_fieldset_string(names: Iterable[str]) -> str:
    """
    Turn export column names into the fieldset string the admin serializer understands.

    Args:
        names (Iterable[str]): Column names, nested values addressed with the habarico lookup
            path (e.g. ``author__name``).

    Returns:
        str: Fieldset string, e.g. ``"code,author(name,email)"`` for
        ``["code", "author__name", "author__email"]``.
    """
    tree: dict[str, dict] = {}
    for name in names:
        node = tree
        for part in name.split(LOOKUP_SEP):
            node = node.setdefault(part, {})
    return _render_fieldset(tree)


def _render_fieldset(node: dict[str, dict]) -> str:
    """
    Render one level of the fieldset tree built by :func:`build_fieldset_string`.

    Args:
        node (dict[str, dict]): Mapping of a field name to its nested fields.

    Returns:
        str: Comma separated fieldset of this level.
    """
    return ",".join(f"{name}({_render_fieldset(children)})" if children else name for name, children in node.items())


class ExportSerializerMixin:
    """
    Narrows the admin serializer down to the exported columns.

    The admin serializer builds a full per-object schema into ``meta``; an export of thousands of
    rows must not pay for it. The mixin replaces the requested fieldset with the one the view
    derived from the export columns, so nothing but those columns is serialized.
    """

    def _get_requested_fieldset(self) -> RFS | None:
        """
        Return the fieldset of the exported columns, or the requested one outside an export.

        Returns:
            RFS | None: Fieldset to serialize.
        """
        fieldset = getattr(self.context.get("view"), "export_fieldset", None)
        return fieldset if fieldset is not None else super()._get_requested_fieldset()


class ExportAdminModelViewSet(AdminModelViewSet):
    """
    Admin viewset with a synchronous export endpoint. See the module docstring for the usage.
    """

    #: Query parameter carrying the primary keys of the explicitly selected rows.
    ids_query_param = "ids"

    #: Query parameter carrying the exported subset of the columns.
    fields_query_param = "fields"

    #: Separator of the values of the list query parameters.
    query_param_separator = ","

    #: Status codes whose body is the exported document. Everything else - errors, and the 202 of
    #: the asynchronous branch - is rendered as JSON, which is what the frontend reads.
    export_file_status_codes = (status.HTTP_200_OK,)

    #: Columns of the running export. Filled by the export action, read by the renderer context.
    export_columns: list[ExportColumn] | None = None

    #: Serializer fieldset of the running export. Filled by the export action, read by
    #: :class:`ExportSerializerMixin`.
    export_fieldset: RFS | None = None

    @action(detail=False, methods=["get"], url_path=EXPORT_ACTION)
    def export(self, request, *args, **kwargs) -> Response:
        """
        Export endpoint - serves the filtered list data as a downloadable document.

        Available only on resources whose admin allows the export for the request
        (``export_enabled`` / ``can_export``); otherwise returns 404. Reuses ``filter_queryset``,
        so the same filters, ordering and row level restrictions as on the list endpoint apply.

        Returns:
            Response: The rendered document with a ``Content-Disposition`` attachment header.

        Raises:
            Http404: When the resource does not enable exports.
            ValidationError: When the export is bigger than the resource allows, or the query
                parameters are not valid.
        """
        if not self.get_export_enabled():
            raise Http404

        self.export_columns = self.get_export_columns()
        self.export_fieldset = self.get_export_fieldset()

        queryset = self.get_export_queryset()
        row_limit = self.get_export_row_limit()
        row_count = queryset.count()
        if row_count > row_limit:
            # The asynchronous export of habarico_enterprise (HAB-628) overrides this branch with
            # a background run answered with 202.
            raise ValidationError(
                _("The export has %(count)d rows, which is over the limit of %(limit)d. Narrow the filter down.")
                % {"count": row_count, "limit": row_limit}
            )

        serializer = self.get_serializer(queryset, many=True)
        response = Response(serializer.data)
        response["Content-Disposition"] = f'attachment; filename="{self.get_export_filename()}"'
        return response

    def get_export_enabled(self) -> bool:
        """
        Whether the resource exposes the export endpoint to the current request.

        Returns:
            bool: True when the admin opts in via ``export_enabled`` and allows the request
            (``can_export``).
        """
        return can_export(self.admin, self.request)

    def get_export_formats(self) -> list[str]:
        """
        Get the document formats the resource offers.

        Returns:
            list[str]: Format names, from the admin's ``export_formats`` or the module default.
        """
        return get_export_formats(self.admin)

    def get_export_renderer_classes(self) -> list[type[BaseExportRenderer]]:
        """
        Resolve the offered formats into renderer classes.

        Returns:
            list[type[BaseExportRenderer]]: Renderers in the order the formats are offered; the
            first one is the default of the content negotiation.

        Raises:
            ImproperlyConfigured: When a format has no registered renderer.
        """
        return get_export_renderer_classes(self.admin)

    def get_renderers(self) -> list[BaseExportRenderer]:
        """
        Get the renderers of the current action.

        The export action serves documents, so ``?format=csv`` has to resolve to an export
        renderer; every other action keeps the regular admin renderers.

        Returns:
            list[BaseExportRenderer]: Renderer instances for the content negotiation.
        """
        if getattr(self, "action", None) == EXPORT_ACTION:
            return [renderer_class() for renderer_class in self.get_export_renderer_classes()]
        return super().get_renderers()

    def get_allowed_export_field_names(self) -> list[str]:
        """
        Get the names of the fields the resource is allowed to export.

        Returns:
            list[str]: The admin's ``export_fields``, or its serializer fields when the admin does
            not narrow the export down.
        """
        fields = self.admin.export_fields or self.admin.get_fields(self.action, self.request)
        return [
            field.get_name() if isinstance(field, Field) else str(field)
            for field in fields
            if not isinstance(field, Field) or field.is_serializer_field
        ]

    def get_export_field_names(self) -> list[str]:
        """
        Get the names of the exported columns.

        Returns:
            list[str]: The requested subset of the allowed fields, or all of them when the request
            does not ask for a subset.

        Raises:
            ValidationError: When a requested field is not allowed for export.
        """
        allowed = self.get_allowed_export_field_names()
        raw = self.request.query_params.get(self.fields_query_param, "")
        requested = [name.strip() for name in raw.split(self.query_param_separator) if name.strip()]
        if not requested:
            return allowed

        unknown = [name for name in requested if name not in allowed]
        if unknown:
            raise ValidationError(
                {
                    self.fields_query_param: _("Fields not available for export: %(fields)s.")
                    % {"fields": ", ".join(unknown)}
                }
            )
        return requested

    def get_export_columns(self) -> list[ExportColumn]:
        """
        Build the column definition handed over to the renderer.

        Returns:
            list[ExportColumn]: Exported columns with their human readable headers.
        """
        return [ExportColumn(name, label=self.get_export_column_label(name)) for name in self.get_export_field_names()]

    def get_export_column_label(self, name: str) -> str:
        """
        Get the document header of one column.

        Args:
            name (str): Column name, nested values addressed with the habarico lookup path.

        Returns:
            str: The model field's verbose name, or the column name when it has none.
        """
        verbose_name = getattr(walk_to_leaf_field(self.model, name), "verbose_name", None)
        return cap_first(str(verbose_name)) if verbose_name else name

    def get_export_fieldset(self) -> RFS | None:
        """
        Build the serializer fieldset of the exported columns.

        Returns:
            RFS | None: Fieldset limiting the serializer to the exported columns, or None when
            there is no column to export.
        """
        fieldset_string = build_fieldset_string(column.name for column in self.export_columns or [])
        if not fieldset_string:
            return None
        return RFS.create_from_string(fieldset_string, default_field_fieldset_string=DEFAULT_FIELDS)

    def get_export_ids(self) -> list | None:
        """
        Get the primary keys of the explicitly selected rows.

        Returns:
            list | None: Primary keys, or None when the request exports everything matching the
            filters.

        Raises:
            ValidationError: When a value is not a valid primary key of the model.
        """
        raw = self.request.query_params.get(self.ids_query_param, "")
        values = [value.strip() for value in raw.split(self.query_param_separator) if value.strip()]
        if not values:
            return None

        pk_field = self.model._meta.pk
        try:
            return [pk_field.to_python(value) for value in values]
        except (DjangoValidationError, ValueError, TypeError):
            raise ValidationError({self.ids_query_param: _("Invalid record identifiers.")})

    def get_export_queryset(self):
        """
        Get the queryset to export - the list queryset narrowed down to the selected rows.

        Returns:
            QuerySet: Rows to export.
        """
        queryset = self.filter_queryset(self.get_queryset())
        ids = self.get_export_ids()
        return queryset if ids is None else queryset.filter(pk__in=ids)

    def get_export_row_limit(self) -> int:
        """
        Get the number of rows the resource still exports synchronously.

        Returns:
            int: :data:`EXPORT_ROW_LIMIT`. The asynchronous export of ``habarico_enterprise``
            overrides this together with the branch that refuses a bigger export.
        """
        return EXPORT_ROW_LIMIT

    def get_export_filename(self) -> str:
        """
        Get the file name offered to the browser.

        Returns:
            str: Resource name with the extension of the negotiated format.
        """
        return self.request.accepted_renderer.get_filename(self.admin.name)

    def get_serializer_class(self):
        """
        Get the serializer class of the current action.

        Returns:
            Serializer: The admin serializer, narrowed down to the exported columns during an
            export.
        """
        serializer_class = super().get_serializer_class()
        if getattr(self, "action", None) != EXPORT_ACTION:
            return serializer_class
        return compose_export_serializer(ExportSerializerMixin, serializer_class)

    def get_renderer_context(self) -> dict:
        """
        Get the renderer context, extended with the export column definition.

        Returns:
            dict: DRF renderer context.
        """
        context = super().get_renderer_context()
        if self.export_columns is not None:
            context[EXPORT_COLUMNS_CONTEXT_KEY] = self.export_columns
            context[EXPORT_TITLE_CONTEXT_KEY] = self.admin.get_label()
        return context

    def finalize_response(self, request, response, *args, **kwargs) -> Response:
        """
        Finalize the response, keeping non-document bodies in JSON.

        The export renderers only know how to build a document, but error bodies (and the 202 of
        the asynchronous branch) must reach the client as JSON.

        Args:
            request (Request): DRF request.
            response (Response): Response to finalize.

        Returns:
            Response: The finalized response.
        """
        response = super().finalize_response(request, response, *args, **kwargs)
        if getattr(self, "action", None) == EXPORT_ACTION and response.status_code not in self.export_file_status_codes:
            response.accepted_renderer = JSONRenderer()
            response.accepted_media_type = JSONRenderer.media_type
            response.renderer_context = self.get_renderer_context()
        return response
