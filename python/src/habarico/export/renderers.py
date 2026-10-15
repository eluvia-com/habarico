"""
DRF renderers turning admin list data into downloadable export files.

The export viewset swaps its renderers for these on the export action, so DRF content negotiation
resolves ``?format=csv`` / ``?format=xlsx`` to the matching renderer and the endpoint only hands
over the serialized rows.

Renderer context contract: the view passes the columns in ``export_columns`` (:class:`ExportColumn`
instances, plain field names, ``(name, label)`` pairs or a ``{name: label}`` mapping - the keys of
the first row when it is missing) and the document title in ``export_title``. Nested values are
addressed with the habarico lookup path (``author__name``).

:meth:`BaseExportRenderer.write` streams the rows into any binary file object, which is how the
asynchronous export runner builds the document instead of holding it in memory.
"""

from __future__ import annotations

import csv
import datetime
import io
import json
import re
import uuid
from collections.abc import Iterable, Iterator, Mapping, Sequence
from dataclasses import dataclass
from decimal import Decimal
from itertools import chain
from types import SimpleNamespace

from django.utils import timezone
from django.utils.functional import Promise
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy
from habarico.utils import LOOKUP_SEP
from rest_framework.renderers import BaseRenderer

#: Key of the column definition in the DRF renderer context.
EXPORT_COLUMNS_CONTEXT_KEY = "export_columns"

#: Key of the document/sheet title in the DRF renderer context.
EXPORT_TITLE_CONTEXT_KEY = "export_title"

# Leading characters that spreadsheet applications evaluate as a formula. Exported values come
# from user input, so they are prefixed with an apostrophe to be shown as plain text instead
# (CSV/XLSX injection).
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")

# Control characters not allowed in XLSX cell values (mirrors openpyxl's ILLEGAL_CHARACTERS_RE).
ILLEGAL_XLSX_CHARACTERS_RE = re.compile(r"[\000-\010\013\014\016-\037]")

# UTF-8 byte order mark, written as a character into the encoded text stream.
BOM = "\ufeff"


@dataclass(frozen=True)
class ExportColumn:
    """
    One column of an export document.

    Attributes:
        name (str): Name of the field in the exported row. Nested values are addressed with the
            habarico lookup path (e.g. ``author__name``).
        label (str, optional): Human readable column header. Defaults to None (the name is used).
    """

    name: str
    label: str | None = None

    @property
    def header(self) -> str:
        """Column header to write into the document."""
        return str(self.label) if self.label else self.name


#: Everything accepted as the ``export_columns`` renderer context value.
ColumnsSpec = Sequence[ExportColumn | str | tuple[str, str]] | Mapping[str, str]


class BaseExportRenderer(BaseRenderer):
    """
    Base class of the export renderers - resolves the columns, reads and formats the values.

    Subclasses implement :meth:`write`, which writes the document into a binary stream;
    :meth:`render` is only a thin wrapper returning the document as bytes.
    """

    render_style = "binary"

    #: Prefix values that a spreadsheet application would evaluate as a formula.
    escape_formulas = True

    #: Labels used for boolean values.
    true_label = _("Yes")
    false_label = _("No")

    #: Separator of the items of a list value.
    list_separator = ", "

    #: Keys tried when a value is a nested object (a relation serialized as a dict).
    label_keys = ("label", "name", "title")

    def render(self, data, accepted_media_type: str | None = None, renderer_context: dict | None = None) -> bytes:
        """
        Render the serialized rows into an export document.

        Args:
            data: Serialized rows - a list of dicts, a single dict, a paginated
                ``{"results": [...]}`` response or any iterable of dicts.
            accepted_media_type (str, optional): Accepted media type. Unused. Defaults to None.
            renderer_context (dict, optional): DRF renderer context; see the module docstring for
                the recognized keys. Defaults to None.

        Returns:
            bytes: The rendered document.
        """
        context = renderer_context or {}
        stream = io.BytesIO()
        self.write(self.get_rows(data), stream, columns=context.get(EXPORT_COLUMNS_CONTEXT_KEY), context=context)
        return stream.getvalue()

    def write(
        self,
        rows: Iterable[Mapping],
        stream: io.RawIOBase | io.BufferedIOBase,
        columns: ColumnsSpec | None = None,
        context: dict | None = None,
    ) -> None:
        """
        Write the export document into a binary stream.

        Args:
            rows (Iterable[Mapping]): Rows to export. Consumed lazily, so a queryset iterator can
                be streamed into the document without materializing it.
            stream: Binary file object to write into.
            columns (ColumnsSpec, optional): Column definition. Defaults to None (the keys of the
                first row are used).
            context (dict, optional): Renderer context with the format specific options.
                Defaults to None.
        """
        raise NotImplementedError("Export renderers must implement write().")

    def get_filename(self, basename: str) -> str:
        """
        Return the export file name for the given base name.

        Args:
            basename (str): File name without the extension (e.g. the resource name).

        Returns:
            str: File name including the format extension.
        """
        return f"{basename}.{self.format}"

    @staticmethod
    def get_rows(data) -> Iterable[Mapping]:
        """
        Normalize the rendered data into an iterable of rows.

        Args:
            data: Serialized rows, a single row or a paginated response.

        Returns:
            Iterable[Mapping]: Rows to export.
        """
        if data is None:
            return []
        if isinstance(data, Mapping):
            results = data.get("results")
            return results if results is not None else [data]
        return data

    @staticmethod
    def normalize_columns(columns: ColumnsSpec | None) -> list[ExportColumn] | None:
        """
        Normalize the column definition into :class:`ExportColumn` instances.

        Args:
            columns (ColumnsSpec, optional): Columns as descriptors, names, ``(name, label)`` pairs
                or a ``{name: label}`` mapping.

        Returns:
            list[ExportColumn] | None: Normalized columns, or None when nothing was provided.
        """
        if columns is None:
            return None
        if isinstance(columns, Mapping):
            return [ExportColumn(name, label=label) for name, label in columns.items()]

        normalized = []
        for column in columns:
            if isinstance(column, ExportColumn):
                normalized.append(column)
            elif isinstance(column, str):
                normalized.append(ExportColumn(column))
            else:
                name, label = column
                normalized.append(ExportColumn(name, label=label))
        return normalized

    def resolve_columns(
        self, rows: Iterable[Mapping], columns: ColumnsSpec | None
    ) -> tuple[list[ExportColumn], Iterator[Mapping]]:
        """
        Resolve the columns to write, falling back to the keys of the first row.

        Args:
            rows (Iterable[Mapping]): Rows to export.
            columns (ColumnsSpec, optional): Column definition from the renderer context.

        Returns:
            tuple[list[ExportColumn], Iterator[Mapping]]: The resolved columns and the rows. The
            rows are returned as an iterator because the first one may have been consumed to read
            its keys.
        """
        normalized = self.normalize_columns(columns)
        rows = iter(rows)
        if normalized is not None:
            return normalized, rows

        first_row = next(rows, None)
        if first_row is None:
            return [], rows
        return [ExportColumn(name) for name in first_row], chain([first_row], rows)

    def get_value(self, row: Mapping, column: ExportColumn):
        """
        Read the raw value of one column from a row.

        Args:
            row (Mapping): Serialized row.
            column (ExportColumn): Column to read.

        Returns:
            The raw value, or None when the row does not contain it.
        """
        if column.name in row:
            return row[column.name]

        value = row
        for part in column.name.split(LOOKUP_SEP):
            if not isinstance(value, Mapping) or part not in value:
                return None
            value = value[part]
        return value

    def format_value(self, value, column: ExportColumn | None = None):
        """
        Convert a serialized value into a value the document can hold.

        Types a concrete format handles natively (numbers, dates) are returned unchanged and
        converted by :meth:`render_cell`.

        Args:
            value: Raw value read from the row.
            column (ExportColumn, optional): Column the value belongs to. Defaults to None.

        Returns:
            The formatted value.
        """
        if value is None:
            return None
        if isinstance(value, bool):
            return str(self.true_label if value else self.false_label)
        if isinstance(value, Promise):
            return str(value)
        if isinstance(value, uuid.UUID):
            return str(value)
        if isinstance(value, Mapping):
            return self.format_mapping(value)
        if isinstance(value, (list, tuple, set)):
            items = (self.format_value(item, column) for item in value)
            return self.list_separator.join("" if item is None else str(item) for item in items)
        return value

    def format_mapping(self, value: Mapping) -> str:
        """
        Format a nested object - its label when it has one, its JSON otherwise.

        Args:
            value (Mapping): Nested object (typically a serialized relation).

        Returns:
            str: Text representation of the object.
        """
        for key in self.label_keys:
            label = value.get(key)
            if isinstance(label, (str, Promise)) and str(label):
                return str(label)
        return json.dumps(value, ensure_ascii=False, default=str)

    def escape_value(self, text: str) -> str:
        """
        Prefix a value a spreadsheet application would evaluate as a formula.

        Args:
            text (str): Value to check.

        Returns:
            str: The value, prefixed with an apostrophe when it is dangerous.
        """
        if self.escape_formulas and text.startswith(FORMULA_PREFIXES):
            return f"'{text}"
        return text

    def render_cell(self, value):
        """
        Convert a formatted value into the representation written into the document.

        Args:
            value: Value returned by :meth:`format_value`.

        Returns:
            The value to write.
        """
        raise NotImplementedError("Export renderers must implement render_cell().")

    def render_row(self, row: Mapping, columns: Sequence[ExportColumn]) -> list:
        """
        Convert one row into the cells written into the document.

        Args:
            row (Mapping): Serialized row.
            columns (Sequence[ExportColumn]): Columns to write.

        Returns:
            list: Cell values of the row.
        """
        return [self.render_cell(self.format_value(self.get_value(row, column), column)) for column in columns]


class CsvRenderer(BaseExportRenderer):
    """
    Renders the rows as a CSV file (RFC 4180).

    The defaults target both spreadsheet applications and machine processing: UTF-8 with a BOM
    (without it Excel does not detect the encoding and breaks non-ASCII characters), a comma
    delimiter and CRLF line endings. All of it is overridable on a subclass.
    """

    media_type = "text/csv"
    format = "csv"
    charset = "utf-8"

    #: Field delimiter (e.g. ``";"`` for spreadsheet applications with a European locale).
    delimiter = ","
    quotechar = '"'
    quoting = csv.QUOTE_MINIMAL
    line_terminator = "\r\n"

    #: Prepend the UTF-8 byte order mark so spreadsheet applications detect the encoding.
    use_bom = True

    def write(
        self,
        rows: Iterable[Mapping],
        stream: io.RawIOBase | io.BufferedIOBase,
        columns: ColumnsSpec | None = None,
        context: dict | None = None,
    ) -> None:
        """See :meth:`BaseExportRenderer.write`."""
        resolved_columns, rows = self.resolve_columns(rows, columns)

        # The csv module writes text, so rows are buffered per line and flushed encoded. This
        # keeps the memory footprint flat and works with any binary file object (a wrapping
        # TextIOWrapper would require the full file protocol from it).
        buffer = io.StringIO()
        writer = csv.writer(
            buffer,
            delimiter=self.delimiter,
            quotechar=self.quotechar,
            quoting=self.quoting,
            lineterminator=self.line_terminator,
        )

        def flush() -> None:
            stream.write(buffer.getvalue().encode(self.charset))
            buffer.seek(0)
            buffer.truncate(0)

        if self.use_bom:
            buffer.write(BOM)
        if resolved_columns:
            writer.writerow([column.header for column in resolved_columns])
        flush()
        for row in rows:
            writer.writerow(self.render_row(row, resolved_columns))
            flush()

    def render_cell(self, value) -> str:
        """See :meth:`BaseExportRenderer.render_cell`."""
        if value is None:
            return ""
        if isinstance(value, str):
            return self.escape_value(value)
        if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
            return value.isoformat()
        return str(value)


class XlsxRenderer(BaseExportRenderer):
    """
    Renders the rows as an XLSX workbook.

    Requires the optional ``openpyxl`` dependency (``pip install 'habarico[export-xlsx]'``); it is
    imported lazily so that :class:`CsvRenderer` works without it. The workbook is built in the
    write-only mode, so memory consumption does not grow with the number of exported rows.
    """

    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    format = "xlsx"
    charset = None

    #: Default sheet title, used when the renderer context carries none. Its own catalog entry:
    #: the plain ``Export`` is the action label and is translated as a verb.
    sheet_title = pgettext_lazy("spreadsheet sheet title", "Export")

    #: Spreadsheet limits.
    max_cell_length = 32767
    max_title_length = 31
    invalid_title_characters = "[]:*?/\\"

    #: Write the header row in bold and keep it visible while scrolling.
    bold_header = True
    freeze_header = True

    def write(
        self,
        rows: Iterable[Mapping],
        stream: io.RawIOBase | io.BufferedIOBase,
        columns: ColumnsSpec | None = None,
        context: dict | None = None,
    ) -> None:
        """See :meth:`BaseExportRenderer.write`."""
        openpyxl = self.import_openpyxl()
        resolved_columns, rows = self.resolve_columns(rows, columns)

        workbook = openpyxl.Workbook(write_only=True)
        sheet = workbook.create_sheet(title=self.get_sheet_title(context))
        if resolved_columns:
            # The sheet view is serialized with the first appended row, so freeze before writing.
            if self.freeze_header:
                sheet.freeze_panes = "A2"
            sheet.append(self.render_header(sheet, resolved_columns, openpyxl))
        for row in rows:
            sheet.append(self.render_row(row, resolved_columns))
        workbook.save(stream)

    def render_header(self, sheet, columns: Sequence[ExportColumn], openpyxl: SimpleNamespace) -> list:
        """
        Build the header cells of the sheet.

        Args:
            sheet: Worksheet the cells belong to.
            columns (Sequence[ExportColumn]): Columns to write.
            openpyxl (SimpleNamespace): Imported openpyxl parts.

        Returns:
            list: Header cells.
        """
        if not self.bold_header:
            return [column.header for column in columns]

        font = openpyxl.Font(bold=True)
        cells = []
        for column in columns:
            cell = openpyxl.WriteOnlyCell(sheet, value=column.header)
            cell.font = font
            cells.append(cell)
        return cells

    def render_cell(self, value):
        """See :meth:`BaseExportRenderer.render_cell`."""
        if isinstance(value, datetime.datetime) and timezone.is_aware(value):
            # Excel has no notion of time zones - store the value in the current one.
            value = timezone.localtime(value).replace(tzinfo=None)
        if isinstance(value, str):
            text = self.escape_value(ILLEGAL_XLSX_CHARACTERS_RE.sub("", value))
            return text[: self.max_cell_length]
        if value is None or isinstance(value, (int, float, Decimal, datetime.datetime, datetime.date, datetime.time)):
            return value
        return str(value)

    def get_sheet_title(self, context: dict | None = None) -> str:
        """
        Return the sheet title from the renderer context, sanitized for the spreadsheet format.

        Args:
            context (dict, optional): Renderer context. Defaults to None.

        Returns:
            str: Sheet title.
        """
        title = str((context or {}).get(EXPORT_TITLE_CONTEXT_KEY) or "")
        for character in self.invalid_title_characters:
            title = title.replace(character, "")
        return title.strip()[: self.max_title_length] or str(self.sheet_title)

    @staticmethod
    def import_openpyxl() -> SimpleNamespace:
        """
        Import the openpyxl parts needed to build the workbook.

        Returns:
            SimpleNamespace: The imported ``Workbook``, ``WriteOnlyCell`` and ``Font``.

        Raises:
            ImportError: When the optional dependency is not installed.
        """
        try:
            from openpyxl import Workbook
            from openpyxl.cell.cell import WriteOnlyCell
            from openpyxl.styles import Font
        except ImportError as error:
            raise ImportError(
                "The xlsx export format requires the 'openpyxl' package. Install habarico with the "
                "'export-xlsx' extra: pip install 'habarico[export-xlsx]'."
            ) from error
        return SimpleNamespace(Workbook=Workbook, WriteOnlyCell=WriteOnlyCell, Font=Font)
