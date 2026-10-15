---
title: Public API
sidebar_position: 3
---

```python
from habarico.contrib.preferences import (
    register_preference,          # Register an exact preference key
    register_preference_pattern,  # Register a regex-pattern key (no default)
    is_registered,                # Check if a key is registered
    get_schema,                   # Get the JSON Schema for a key
    get_default,                  # Resolve the default for a key (None when absent)
    validate,                     # Validate a value against the key's schema
    get_value,                    # Resolve a user's preference -> Optional[ResolvedPreference]
    get_values,                   # Resolve all preferences for a user -> List[ResolvedPreference]
    set_value,                    # Persist a value for a user (validated) -> ResolvedPreference
    delete_value,                 # Remove a user's stored value for a key (no-op if unset)
    delete_values,                # Remove every stored value for a user
    ResolvedPreference,           # Dataclass returned by get_value / get_values / set_value
    PreferenceRegistry,           # The registry class, when a project needs its own instance
)
```

Keys must match `^[a-zA-Z][a-zA-Z0-9_./-]*$` — an ASCII letter, then letters, digits, underscore,
dot, slash or hyphen. Dots namespace a key and slashes appear inside a resource name, e.g.
`preferences.eshop/product.savedQueries`.

`ResolvedPreference` carries `key`, `value`, and `updated_at` (the last successful
write timestamp, or `None` when the value is a default and not a stored record).
