"""Auto-registration of base user-preference keys.

Exact keys (`theme`, `locale`, `preferences.layout.app.*`)
are always registered. A default is applied only when present in
`HABARICO_PREFERENCES["DEFAULTS"]`; without it the preference is registered
with no default (single GET returns 404 when no value is stored, list endpoint
omits the key).

Pattern keys (`<preferenceKey>.savedQueries`,
`<preferenceKey>.columns`,
`<preferenceKey>.columnWidths`) are registered as regex patterns
with no built-in default. Per-key fallbacks can be supplied via
`HABARICO_PREFERENCES["DEFAULTS"]`.
"""

from typing import Dict, Type

from habarico.contrib.preferences.registry import register_preference, register_preference_pattern
from habarico.contrib.preferences.schemas import (
    AppDensityPreference,
    AppPageWidthPreference,
    ColumnsPreference,
    ColumnWidthsPreference,
    ContrastModePreference,
    LocalePreference,
    SavedQueriesPreference,
    StripedRowsPreference,
    ThemePreference,
)
from habarico.contrib.preferences.settings import preference_settings
from pydantic import BaseModel

BASE_PREFERENCES: Dict[str, Type[BaseModel]] = {
    "theme": ThemePreference,
    "locale": LocalePreference,
    "preferences.layout.app.pageWidth": AppPageWidthPreference,
    "preferences.layout.app.contrastMode": ContrastModePreference,
    "preferences.layout.app.stripedRows": StripedRowsPreference,
    "preferences.layout.app.density": AppDensityPreference,
}

PATTERN_PREFERENCES: Dict[str, Type[BaseModel]] = {
    r"[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries": SavedQueriesPreference,
    r"[a-zA-Z][a-zA-Z0-9_./-]*\.columns": ColumnsPreference,
    r"[a-zA-Z][a-zA-Z0-9_./-]*\.columnWidths": ColumnWidthsPreference,
}


def register_base_preferences() -> None:
    defaults = preference_settings.DEFAULTS or {}
    for key, model in BASE_PREFERENCES.items():
        if key in defaults:
            register_preference(key, schema=model, default=defaults[key])
        else:
            register_preference(key, schema=model)
    for pattern, model in PATTERN_PREFERENCES.items():
        register_preference_pattern(pattern, schema=model)
