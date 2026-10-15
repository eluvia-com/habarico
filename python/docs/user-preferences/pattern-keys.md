---
title: Pattern Keys
sidebar_position: 7
---

`register_preference_pattern` binds one schema to all keys matching a regex. Useful
when many resources share the same preference shape (per-resource list params, column
selection, etc.).

```python
from habarico.contrib.preferences import register_preference_pattern
from habarico.contrib.preferences.schemas import ColumnsPreference

register_preference_pattern(
    r"preferences\.[a-zA-Z][a-zA-Z0-9_./-]*\.columns",
    schema=ColumnsPreference,
)

# Any "preferences.<key>.columns" key now validates against ColumnsPreference.
# The key charset allows "/" and "-", so a resource name such as "eshop/product" matches.
```

**Pattern entries have no default.** A matched key with no stored value resolves to
`None` (single GET in the API returns `404`; the list endpoint omits the key, because
pattern matches can't be enumerated). To provide a fallback for a specific matching
key, register it explicitly:

```python
from habarico.contrib.preferences import register_preference
from habarico.contrib.preferences.schemas import ColumnsPreference

register_preference("preferences.eshop/product.columns", schema=ColumnsPreference, default=["name", "price"])
```

Exact registrations take precedence over patterns — if both match, the exact entry wins.
