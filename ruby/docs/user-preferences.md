---
title: User preferences
sidebar_position: 14
---

A per-user, JSON-Schema-validated preference store — theme, locale, dashboard layout, saved
queries, column selection — served over the same REST endpoints the frontend already knows.

It mirrors the [Python user-preferences app](/python/user-preferences/) key for key, so the same
frontend build syncs against either backend.

## Installation

The module is **not** loaded by `require "habarico"`. Its dependency is optional, so add it to the
`Gemfile` and require the module explicitly:

```ruby
# Gemfile
gem "habarico"
gem "json_schemer"
```

```ruby
# config/initializers/habarico.rb
require "habarico/contrib/preferences"
```

Then copy and run the migration:

```bash
bin/rails generate habarico:preferences:install
bin/rails db:migrate
```

It creates `habarico_user_preferences` (`user_id`, `key`, `value` as `jsonb`, `updated_at`) with a
unique index on `(user_id, key)`.

:::caution
`user_id` is a plain string — the auth token's subject, not a foreign key. In the token-based
multi-service setup the user often has no local row to reference. Add the foreign key yourself in
the copied migration if your application does have a users table.
:::

Requiring the module also registers its routes (through `RoutingService`'s extension hook) and its
translations, and calls `register_base_preferences`. Nothing has to be added to
`config/routes.rb`.

## Defaults

A base key gets a default only when one is configured. Because the base keys are registered the
moment `habarico/contrib/preferences` is required, set the defaults **before** that require — the
`defaults` accessor lives in a config file that can be loaded on its own:

```ruby
# config/initializers/habarico.rb
require "habarico/contrib/preferences/config"

Habarico::Contrib::Preferences.defaults = {
  "theme" => "light",
  "locale" => "cs",
}

require "habarico/contrib/preferences"
```

This mirrors the Python `HABARICO_PREFERENCES["DEFAULTS"]` setting and, like it, is read **at
registration time** — defaults assigned after the module is required are silently ignored. A
preference that has to react to something at runtime needs an explicit registration with a
callable default.

## Public API

Everything hangs off `Habarico::Contrib::Preferences`:

| Method | Purpose |
|---|---|
| `register_preference(key, schema:, default:, migrate_value:)` | Register an exact key |
| `register_preference_pattern(pattern, schema:)` | Register a regex key; patterns never carry a default |
| `registered?(key)` | Whether a key resolves |
| `get_schema(key)` / `get_default(key)` | The JSON Schema and the resolved default |
| `validate(key, value)` | Validate a value against the key's schema |
| `get_value(user_id, key)` / `get_values(user_id)` | Resolve one or all preferences of a user |
| `set_value(user_id, key, value)` | Persist a validated value |
| `delete_value(user_id, key)` / `delete_values(user_id)` | Remove one or all stored values |

```ruby
Habarico::Contrib::Preferences.register_preference(
  "preferences.eshop/order.defaultWarehouse",
  schema: {"type" => "string"},
  default: -> { Warehouse.default&.code },
)
```

`get_value` / `get_values` / `set_value` return a `ResolvedPreference` struct with `key`, `value`
and `updated_at`; `updated_at` is `nil` when the value came from a default rather than a stored
row.

A default may be a callable — it is resolved on every read, which is how a preference follows
runtime state. Returning the `EMPTY` sentinel from it means "no default after all".

### Repairing a stored value

A stored value that no longer validates — the schema was tightened, or the shape it describes
changed — is deleted on the next read and the default takes over. `migrate_value` is the chance to
keep it instead: a callable given at registration, called with the stored value before anything is
deleted, whose result is validated and saved. The repair therefore runs once per record, on the
first read after the deploy, and no data migration is needed:

```ruby
Habarico::Contrib::Preferences.register_preference(
  "preferences.eshop/order.columns",
  schema: {"type" => "object", "required" => ["columns"]},
  migrate_value: ->(value) { {"columns" => [value["column"]]} },
)
```

A result that does not validate, and a callable that raises, both leave the record to be deleted as
before — a schema's own bug must not make reading preferences fail. A value the schema still accepts
never reaches the callable, so a shape change usually needs the schema to refuse the old one:
`"not" => {"required" => ["old_name"]}` refuses exactly that key, where forbidding every unknown one
would throw a value away over any stray field.

Keys must match `\A[a-zA-Z][a-zA-Z0-9_./-]*\z` — a letter, then letters, digits, underscore, dot,
slash or hyphen.

## Built-in keys

Registered on load, exactly as on the Python side:

| Key | Holds |
|---|---|
| `theme` | `"light"` or `"dark"` |
| `locale` | UI locale code |
| `preferences.layout.app.pageWidth` | `"full"` or `"centered"` |
| `preferences.layout.app.contrastMode` | High-contrast toggle |
| `preferences.layout.app.stripedRows` | Datagrid striped rows |
| `preferences.layout.app.density` | `"compact"`, `"standard"` or `"comfortable"` |
| `<any key>.savedQueries` | Saved list queries — pattern key |
| `<any key>.columns` | Visible columns — pattern key |
| `<any key>.columnWidths` | Column widths — pattern key |

The preference store itself is free. The dashboard is stored in one too, under
`preferences.dashboard`, but its key is registered by `habarico-enterprise`: a widget is defined and
drawn there, so its shape is validated there as well. Without the paid gem the key is not registered
and writing it is refused.

## Limits

Two settings bound what one user can store.

| Setting | Default | What it bounds |
|---|---|---|
| `max_value_bytes` | see below | Serialized size of a single preference value |
| `max_keys_per_user` | `2000` | How many preferences one user may hold |

`max_value_bytes` is a hash resolved by the key — or the pattern — a preference was registered
under, falling back to its `"default"` entry:

```ruby
Habarico::Contrib::Preferences.max_value_bytes = {
  "default" => 16 * 1024,
  %r{[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries} => 32 * 1024,
}
```

A pattern may be written as a `Regexp` or as its source string; both resolve to the same entry.

An entry here outranks a `max_bytes:` given at registration: a limit a gem ships with its key is a
default, and the deployment has the last word.

:::caution
`max_value_bytes` is read **when a preference is registered**, exactly like
[`defaults`](#defaults) — and requiring `habarico/contrib/preferences` registers the built-in keys
immediately. Set it before that require, from the config file that can be loaded on its own:

```ruby
# config/initializers/habarico.rb
require "habarico/contrib/preferences/config"

Habarico::Contrib::Preferences.max_value_bytes = {"default" => 32 * 1024}

require "habarico/contrib/preferences"
```

Assigned after the require, it is silently ignored for every built-in key. `max_keys_per_user`
has no such constraint — it belongs to no single preference and is read on each write.
:::

The defaults sit an order of magnitude above what the frontend actually writes — 100 datagrid
columns are ~2 KB of `columns` or `columnWidths` and 20 saved queries ~11 KB at their fullest — so
an application that stores unusually large preferences is the one that has to raise them. A gem
registering its own key brings its own limit with it: `habarico-enterprise` registers
`preferences.dashboard` with 32 KB, which a 30-widget dashboard fills to about two thirds — an
application that needs more raises it by naming the key in `max_value_bytes`.

A key registered by the host app takes the `"default"` entry unless it declares its own:

```ruby
Habarico::Contrib::Preferences.register_preference(
  "preferences.eshop/order.importMapping",
  schema: {"type" => "object"},
  max_bytes: 256 * 1024,
)
```

Leaving `max_bytes:` out — or passing `nil` — means "not given", and the hash decides. There is no
sentinel for it, unlike the `default:` of a preference: a size is never `nil`, so `nil` is free to
mean "not given". Where the hash names the same key, the hash wins.

`nil` means "no limit" where a limit is actually configured — as one entry of the hash, as the
whole `max_value_bytes`, or as `max_keys_per_user`. A key that should be unlimited says so there:

```ruby
Habarico::Contrib::Preferences.max_value_bytes = {
  "default" => 16 * 1024,
  "preferences.eshop/order.importMapping" => nil, # unlimited
}
```

`max_keys_per_user` is checked **only when a new key is created**, so a user already past it can
still overwrite or shrink what they have. It is needed because the pattern keys match an unbounded
set of names: without it the per-value limit would not bound the per-user total. Stored values are
never re-checked on read, so lowering a limit never deletes anything.

Both refusals are `422`, the same response a schema mismatch gets. The oversized case is caught
from the raw request body before it is parsed, so a request already known to be too big costs
nothing to refuse. That measurement includes whitespace, while the registry measures the compact
JSON — a pretty-printed body just under the limit can therefore be refused, which is deliberate:
the bytes on the wire are the cost being bounded.

:::caution
A refused write is silent in the admin UI. The frontend store mirrors preferences to the backend
fire-and-forget: the value stays in the local store, so it looks applied until the page is reloaded
and the server state is hydrated back over it. Pass `onError` to
[`createBackendStore`](/node/utilities/create-backend-store-backend-synced-preferences) to surface
it to the user.
:::

## REST endpoints

Drawn at the admin-site root, beside `schema` and `search`:

| Method | Path |
|---|---|
| GET | `/user-preferences` |
| DELETE | `/user-preferences` |
| GET | `/user-preferences/*key` |
| PUT | `/user-preferences/*key` |
| DELETE | `/user-preferences/*key` |

The `key` segment is a glob with the format suffix disabled, because a key may contain dots and
slashes (`preferences.eshop/product.columns`).

## See also

- [Configuration](./configuration.md) — the initializer these lines go into
- [User preferences](/python/user-preferences/) — the Python counterpart, endpoint for endpoint
- [createBackendStore](/node/utilities/create-backend-store-backend-synced-preferences) — the frontend store that syncs against these endpoints
- [SchemaAdmin](/node/base-components/schema-admin#service-config-map) — the `syncPreferences` flag that switches syncing on
