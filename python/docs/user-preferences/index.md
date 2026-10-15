---
title: User preferences
sidebar_position: 1
---

A per-user, schema-validated key-value store. The admin UI keeps its context in it — dashboard
layout, chosen columns, saved queries — so a user's setup follows them between devices.

Every key is registered together with a JSON Schema (or a Pydantic model) and an optional default.
Only registered keys can be read or written, which is what keeps the store from turning into an
unvalidated dumping ground.

## Pages

| Page | What it covers |
|---|---|
| [Installation](./installation.md) | Adding `habarico.contrib.preferences` |
| [Registering a preference](./registering-a-preference.md) | Declaring a key and its schema |
| [Pydantic schemas](./pydantic-schemas.md) | Using a Pydantic model instead of raw JSON Schema |
| [Pattern keys](./pattern-keys.md) | One declaration covering many keys |
| [Callable defaults](./callable-defaults.md) | Defaults computed per user |
| [Built-in preferences](./built-in-preferences.md) | The keys the admin UI itself uses |
| [Reading and writing](./reading-and-writing.md) | The Python API |
| [Public API](./public-api.md) | What the app exports |
| [REST endpoints](./rest-endpoints.md) | The HTTP surface the frontend uses |
| [Self-healing behaviour](./self-healing-behaviour.md) | What happens when a stored value stops validating |

## See also

- [createBackendStore](/node/utilities/create-backend-store-backend-synced-preferences) — the frontend store that syncs here
- [SchemaAdmin](/node/base-components/schema-admin#service-config-map) — `syncPreferences` on the service config
- [SchemaProvider](/node/providers/schema-provider#user-preferences) — the four methods that talk to these endpoints
