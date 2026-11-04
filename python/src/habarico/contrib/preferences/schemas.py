"""Pydantic models for standard user-preference values.

These models mirror the named preference schemas declared in `contract/openapi.yaml`
(`LocalePreference`, `ThemePreference`, `SavedQueriesPreference`,
`ColumnsPreference`, `ColumnWidthsPreference`,
`AppPageWidthPreference`, `ContrastModePreference`, `StripedRowsPreference`,
`AppDensityPreference`).

Register a model via `register_preference(key, schema=Model)` — the registry
extracts a JSON Schema via `Model.model_json_schema()` and derives the default
from `Model()` when not explicitly provided.
"""

from typing import Annotated, Any, Literal, Optional

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
