---
title: Size limits
sidebar_position: 12
---

Two settings bound what one user can store.

| Setting | Default | What it bounds |
|---|---|---|
| `MAX_VALUE_BYTES` | see below | Serialized size of a single preference value |
| `MAX_KEYS_PER_USER` | `2000` | How many preferences one user may hold |

Both live in `HABARICO_PREFERENCES`, beside `DEFAULTS`:

```python
HABARICO_PREFERENCES = {
    "MAX_VALUE_BYTES": {
        "default": 16 * 1024,
        r"[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries": 32 * 1024,
    },
    "MAX_KEYS_PER_USER": 2000,
}
```

`MAX_VALUE_BYTES` is resolved by the key — or the pattern string — a preference was registered
under, falling back to its `"default"` entry. A pattern entry is keyed by the same string passed
to `register_preference_pattern`.

An entry here outranks a `max_bytes` given at registration: a limit a package ships with its key is
a default, and the deployment has the last word.

It is read **when a preference is registered**, exactly like `DEFAULTS`. Registration happens in
`AppConfig.ready()`, after Django settings are loaded, so a value in `settings.py` always applies;
only a change made at runtime, after startup, does not move a limit already in place. In tests,
register inside the `override_settings` block rather than around it. `MAX_KEYS_PER_USER` belongs to
no single preference and is read on each write, so it has no such constraint.

:::caution
The setting replaces the built-in dict rather than merging into it, so a project that overrides it
restates every entry it wants to keep — including `"default"`.
:::

The defaults sit an order of magnitude above what the frontend actually writes — 100 datagrid
columns are ~2 KB of `columns` or `columnWidths` and 20 saved queries ~11 KB at their fullest — so a
project that stores unusually large preferences is the one that has to raise them. A package
registering its own key brings its own limit with it: `habarico-enterprise` registers
`preferences.dashboard` with 32 KB, which a 30-widget dashboard fills to about two thirds — a
project that needs more raises it by naming the key in `MAX_VALUE_BYTES`.

A key registered by the project takes the `"default"` entry unless it declares its own:

```python
register_preference(
    "preferences.eshop/order.importMapping",
    schema=ImportMappingPreference,
    max_bytes=256 * 1024,
)
```

Leaving `max_bytes` out — or passing `None` — means "not given", and the dict decides. There is no
sentinel for it, unlike the `default` of a preference: a size is never `None`, so `None` is free to
mean "not given". Where the dict names the same key, the dict wins.

`None` means "no limit" where a limit is actually configured — as one entry of the dict, as the
whole `MAX_VALUE_BYTES`, or as `MAX_KEYS_PER_USER`. A key that should be unlimited says so there:

```python
HABARICO_PREFERENCES = {
    "MAX_VALUE_BYTES": {
        "default": 16 * 1024,
        "preferences.eshop/order.importMapping": None,  # unlimited
    },
}
```

`MAX_KEYS_PER_USER` is checked **only when a new key is created**, so a user already past it can
still overwrite or shrink what they have. It is needed because the
[pattern keys](./pattern-keys.md) match an unbounded set of names: without it the per-value limit
would not bound the per-user total. Stored values are never re-checked on read, so lowering a
limit never deletes anything — that is the one case
[self-healing](./self-healing-behaviour.md) deliberately leaves alone.

Both refusals are `422`, the same response a schema mismatch gets. The oversized case is also
caught from `Content-Length` before the body is parsed, so a request already known to be too big
costs nothing to refuse. That measurement includes whitespace, while the registry measures the
compact JSON — a pretty-printed body just under the limit can therefore be refused, which is
deliberate: the bytes on the wire are the cost being bounded. Django's own
`DATA_UPLOAD_MAX_MEMORY_SIZE` (2.5 MB) still applies above these limits: it bounds parsing, these
bound storage.

:::caution
A refused write is silent in the admin UI. The frontend store mirrors preferences to the backend
fire-and-forget: the value stays in the local store, so it looks applied until the page is reloaded
and the server state is hydrated back over it. Pass `onError` to
[`createBackendStore`](/node/utilities/create-backend-store-backend-synced-preferences) to surface
it to the user.
:::

## See also

- [Registering a preference](./registering-a-preference.md) — where `max_bytes` is passed
- [Pattern keys](./pattern-keys.md) — the unbounded key set the count limit exists for
- [User preferences](/ruby/user-preferences#limits) — the Ruby counterpart, setting for setting
