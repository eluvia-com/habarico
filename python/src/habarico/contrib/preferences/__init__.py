from habarico.contrib.preferences.registry import (
    PreferenceRegistry,
    ResolvedPreference,
    delete_value,
    delete_values,
    get_default,
    get_schema,
    get_value,
    get_values,
    is_registered,
    register_preference,
    register_preference_pattern,
    set_value,
    validate,
)

default_app_config = "habarico.contrib.preferences.apps.PreferencesConfig"

__all__ = [
    "PreferenceRegistry",
    "ResolvedPreference",
    "register_preference",
    "register_preference_pattern",
    "is_registered",
    "get_schema",
    "get_default",
    "validate",
    "get_value",
    "set_value",
    "get_values",
    "delete_value",
    "delete_values",
]
