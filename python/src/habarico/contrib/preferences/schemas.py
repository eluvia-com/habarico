"""Pydantic models for standard user-preference values.

These models mirror the named preference schemas declared in `contract/openapi.yaml`
(`LocalePreference`, `ThemePreference`, `SavedQueriesPreference`,
`ColumnsPreference`, `ColumnWidthsPreference`, `DashboardPreference`,
`AppPageWidthPreference`, `ContrastModePreference`, `StripedRowsPreference`,
`AppDensityPreference`).

Register a model via `register_preference(key, schema=Model)` — the registry
extracts a JSON Schema via `Model.model_json_schema()` and derives the default
from `Model()` when not explicitly provided.
"""

from typing import Annotated, Any, Literal, Optional, Union

from pydantic import BaseModel, Field, RootModel


class LocalePreference(RootModel[str]):
    """Locale code stored under the `locale` key (e.g. `cs`, `en`)."""


class ThemePreference(RootModel[Literal["light", "dark"]]):
    pass


class SortPreference(BaseModel):
    field: str
    order: Literal["ASC", "DESC"]


class SavedQueryValue(BaseModel):
    filter: dict[str, Any] = Field(default_factory=dict)
    displayedFilters: dict[str, bool] = Field(default_factory=dict)
    sort: Optional[SortPreference] = None
    perPage: Optional[int] = Field(default=None, ge=1)


class SavedQueryPreference(BaseModel):
    label: str
    value: SavedQueryValue = Field(default_factory=SavedQueryValue)


class SavedQueriesPreference(RootModel[list[SavedQueryPreference]]):
    root: list[SavedQueryPreference] = []


class ColumnsPreference(RootModel[list[str]]):
    root: list[str] = []


class ColumnWidthsPreference(RootModel[dict[str, Annotated[float, Field(ge=0)]]]):
    root: dict[str, Annotated[float, Field(ge=0)]] = {}


class AppPageWidthPreference(RootModel[Literal["full", "centered"]]):
    pass


class ContrastModePreference(RootModel[bool]):
    pass


class StripedRowsPreference(RootModel[bool]):
    pass


class AppDensityPreference(RootModel[Literal["compact", "standard", "comfortable"]]):
    pass


class WidgetLayout(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    w: int = Field(ge=1)
    h: int = Field(ge=1)


WidgetColor = Literal["primary", "secondary", "success", "error", "warning", "info", "inherit"]


class TruncBucket(BaseModel):
    """Date/datetime truncation bucket for a group-by field."""

    type: Literal["trunc"]
    granularity: Literal["second", "minute", "hour", "day", "week", "month", "quarter", "year"]


class WidthBucket(BaseModel):
    """Numeric fixed-width bucket for a group-by field."""

    type: Literal["width"]
    size: float


GroupByBucket = Annotated[Union[TruncBucket, WidthBucket], Field(discriminator="type")]


class GroupByItem(BaseModel):
    """One group-by dimension of a chart widget. Omitted ``bucket`` → exact-value grouping."""

    field: str
    bucket: Optional[GroupByBucket] = None


class ChartOptions(BaseModel):
    """Chart-type-specific display options."""

    orientation: Optional[Literal["vertical", "horizontal"]] = None
    variant: Optional[Literal["pie", "doughnut"]] = None


class WidgetConfig(BaseModel):
    id: str
    type: str
    resource: Optional[str] = None
    label: Optional[str] = None
    layout: WidgetLayout
    filters: Optional[dict[str, str]] = None
    sort: Optional[SortPreference] = None
    perPage: Optional[int] = Field(default=None, ge=1)
    columns: Optional[list[str]] = None
    field: Optional[str] = None
    aggregateFunction: Optional[Literal["count", "sum", "avg", "min", "max"]] = None
    color: Optional[WidgetColor] = None
    groupBy: Optional[list[GroupByItem]] = None
    chartOptions: Optional[ChartOptions] = None


class DashboardPreference(BaseModel):
    widgets: list[WidgetConfig] = Field(default_factory=list)
