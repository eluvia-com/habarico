---
title: REST Endpoints
sidebar_position: 11
---

When `habarico.contrib.preferences` is in `INSTALLED_APPS`, the admin site mounts a
ViewSet under the admin URL namespace:

| Method | Path                              | Description                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/admin/user-preferences/`        | All explicit registered keys (default-or-stored) plus stored pattern-matched keys |
| DELETE | `/admin/user-preferences/`        | Remove every stored value for the current user; `204` always |
| GET    | `/admin/user-preferences/{key}/`  | Single preference; `404` if registered but no value, `404` if not registered |
| PUT    | `/admin/user-preferences/{key}/`  | Set the value (schema-validated); `422` on invalid input |
| DELETE | `/admin/user-preferences/{key}/`  | Remove the stored value (`204`); `404` if the key is not registered |

Response body shape:

```json
{
  "key": "theme",
  "value": "dark",
  "updated_at": "2026-05-25T12:34:56Z"
}
```

`updated_at` is `null` when the response carries the registered default (no stored
record). All endpoints require an authenticated user; preferences are isolated
per-user. The `{key}` URL parameter is constrained to the registered key pattern, so
malformed keys return `404` without reaching the view. See the repo-root
`contract/openapi.yaml` for the full schema.
