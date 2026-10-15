---
title: Installation
sidebar_position: 2
---

Add the app and create its table.

```python
INSTALLED_APPS = [
    ...,
    "habarico",
    "habarico.contrib.preferences",
    ...
]
```

```bash
python manage.py migrate habarico_preferences
```

The frontend picks the endpoints up on its own once a service is flagged with
`syncPreferences: true` — see
[SchemaAdmin](/node/base-components/schema-admin#service-config-map). Until then preferences stay
in the browser's local storage.

## See also

- [Registering a preference](./registering-a-preference.md) — declaring your first key
- [Built-in preferences](./built-in-preferences.md) — the keys the admin UI uses
- [REST endpoints](./rest-endpoints.md) — what the frontend calls
