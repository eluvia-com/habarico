---
title: Registering a Preference
sidebar_position: 4
---

The simplest registration uses a JSON Schema dictionary and an explicit default:

```python
from habarico.contrib.preferences import register_preference, get_value, set_value

register_preference(
    "view_mode",
    schema={"enum": ["table", "cards"]},
    default="table",
)

set_value(request.user, "view_mode", "cards")
get_value(request.user, "view_mode").value  # "cards"
```

A static `default` is validated against the schema at registration — an invalid
default raises `PreferenceValidationError` and the key is not registered.

For dict schemas, `default` is required. For Pydantic schemas, it can be omitted if
the model has defaults for all fields (see [Pydantic schemas](./pydantic-schemas.md)).
