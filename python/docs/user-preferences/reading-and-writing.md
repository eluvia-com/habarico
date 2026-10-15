---
title: Reading and Writing
sidebar_position: 9
---

`get_value(user, key)` returns `Optional[ResolvedPreference]`:

| Stored record | Default available | Result                                            |
| ------------- | ----------------- | ------------------------------------------------- |
| valid         | —                 | `ResolvedPreference(value=<stored>, updated_at=ts)` |
| invalid       | yes               | record deleted, `ResolvedPreference(value=<default>, updated_at=None)` |
| invalid       | no                | record deleted, `None`                            |
| none          | yes               | `ResolvedPreference(value=<default>, updated_at=None)` |
| none          | no                | `None`                                            |

Unregistered keys raise `PreferenceNotRegistered`.

`get_values(user)` returns a list of `ResolvedPreference` for the user: stored records
plus the defaults of all explicit registered keys that the user hasn't set. Pattern
keys without stored values are not enumerated. Records for keys no longer registered
(orphans) are deleted as a side effect of the list call.

`set_value(user, key, value)` validates `value` against the schema and persists it.
Returns the `ResolvedPreference` of the stored entry. Invalid values raise
`PreferenceValidationError` and are not stored.
