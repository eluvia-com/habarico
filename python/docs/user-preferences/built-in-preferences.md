---
title: Built-in Preferences
sidebar_position: 8
---

`habarico.contrib.preferences.schemas` ships Pydantic schemas for the standard admin
UI preferences:

| Key                                            | Schema                    | Description                                |
| ---------------------------------------------- | ------------------------- | ------------------------------------------ |
| `locale`                                       | `LocalePreference`        | UI locale code (e.g. `cs`, `en`)           |
| `theme`                                        | `ThemePreference`         | `"light"` or `"dark"`                      |
| `preferences.dashboard`                        | `DashboardPreference`     | Dashboard widget layout                    |
| `preferences.layout.app.pageWidth`             | `AppPageWidthPreference`  | `"full"` or `"centered"` page width        |
| `preferences.layout.app.contrastMode`          | `ContrastModePreference`  | High-contrast mode toggle                  |
| `preferences.layout.app.stripedRows`           | `StripedRowsPreference`   | Datagrid striped-rows toggle               |
| `preferences.layout.app.density`               | `AppDensityPreference`    | `"compact"`, `"standard"`, `"comfortable"` |
| `<any key>.columns`                            | `ColumnsPreference`       | Visible column field names                 |
| `<any key>.columnWidths`                       | `ColumnWidthsPreference`  | Per-column pixel widths                    |
| `<any key>.savedQueries`                       | `SavedQueriesPreference`  | User-saved list view queries               |

The last three are **pattern** keys: the registered regex is
`[a-zA-Z][a-zA-Z0-9_./-]*\.columns` and its two siblings, so any key ending in `.columns`,
`.columnWidths` or `.savedQueries` matches — the frontend's own keys start with `preferences.`,
but the pattern does not require it.

`register_base_preferences()` (called from the app's `AppConfig.ready()`) registers **every** key
above. A default is attached only to the exact keys listed in `HABARICO_PREFERENCES["DEFAULTS"]`;
the rest are registered without one, so a single `GET` returns 404 until a value is stored and the
list endpoint omits the key:

```python
# settings.py
HABARICO_PREFERENCES = {
    "DEFAULTS": {
        "theme": "dark",
        "locale": "cs",
    },
}
```

`HABARICO_PREFERENCES["DEFAULTS"]` is consumed **only at registration time** by
`register_base_preferences`. To make a preference react to runtime changes, register
it explicitly with a [callable default](./callable-defaults.md).
