---
title: Callable Defaults
sidebar_position: 6
---

`default` may also be a callable that is invoked at read time. The returned value is
normalised, validated against the schema and used as the default for that lookup.

```python
from django.conf import settings
from habarico.contrib.preferences import register_preference
from habarico.contrib.preferences.schemas import ThemePreference

register_preference(
    "theme",
    schema=ThemePreference,
    default=lambda: getattr(settings, "DEFAULT_THEME", "light"),
)
```

Use this when the default depends on runtime state (settings, feature flags, current
tenant). Return the `EMPTY` sentinel from
`habarico.contrib.preferences.registry` to signal "no default available right now"; if
the callable returns a value that fails schema validation, the lookup also resolves to
"no default" (no exception is raised — the caller gets `None`).
