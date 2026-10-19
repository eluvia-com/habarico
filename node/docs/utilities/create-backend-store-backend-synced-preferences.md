---
title: createBackendStore — backend-synced preferences
sidebar_position: 5
---

`createBackendStore` wraps any React Admin `Store` and mirrors a whitelisted subset of its keys to a backend
API. Reads stay local; writes are debounced and pushed asynchronously. It is what powers cross-device
synchronization of user preferences (theme, locale, dashboard layout, datagrid column setups, saved queries).

```typescript
import {createBackendStore, BackendApi} from 'habarico';
import {localStorageStore} from 'react-admin';

const api: BackendApi = {
  list: () => fetch('/user-preferences/').then((r) => r.json()),
  put: (key, value) => fetch(`/user-preferences/${key}/`, {method: 'PUT', body: JSON.stringify(value)}).then(() => {}),
  delete: (key) => fetch(`/user-preferences/${key}/`, {method: 'DELETE'}).then(() => {}),
  deleteAll: () => fetch('/user-preferences/', {method: 'DELETE'}).then(() => {}),
};

const store = createBackendStore(localStorageStore(), {
  api,
  whitelist: ['theme', 'locale', 'preferences.*.columns'],
  debounceMs: 500,        // default 500ms
  retryBaseMs: 1000,      // default 1s
  retryMaxMs: 30000,      // default 30s
  onError: (err) => console.warn(err),
});
```

Behaviour:
- **Hydrate on setup** — on `store.setup()` the wrapper calls `api.list()` and writes every returned key
  into the base store. On failure it retries with exponential backoff (`retryBaseMs * 2^attempt`, capped at
  `retryMaxMs`), except when the error carries `status` 401 or 403: a rejected credential is not retried.
  `store.teardown()` cancels a pending retry; the next `store.setup()` hydrates afresh.
- **Debounced PUT** — `setItem` writes through to the base store immediately, then schedules a single
  `api.put(key, value)` after `debounceMs`. Repeated writes coalesce.
- **DELETE on remove** — `removeItem`/`removeItems` cancel any pending PUT and call `api.delete(key)` for
  every whitelisted key removed.
- **`reset` stays local** — `store.reset()` cancels pending PUTs and resets the base store; the backend
  keeps its copy, so a logout never removes the user's preferences from the server.
- **One-shot migration** — on the first hydrate, any whitelisted local key that has no remote counterpart is
  PUT to the backend, then a `__backendSync.migrated` guard prevents it from running again.
- **Whitelist is glob-based** — see [`globMatch`](./glob-match.md).

## `PREFERENCES_WHITELIST`

The default whitelist used by `SchemaAdmin` covers:

```typescript
export const PREFERENCES_WHITELIST: string[] = [
  'theme',
  'locale',
  'preferences.dashboard',
  'preferences.layout.app.*',
  'preferences.**.columns',
  'preferences.**.columnWidths',
  '**.savedQueries',
];
```

Note the `**` in the column entries: a column preference key carries the resource name, which itself
contains a dot (`preferences.eshop/product.columns` for a plain list, and a longer path for a list
box), so a single `*` would not reach it.

Anything not listed — `*.listParams`, `*.availableColumns`, `*.omit`, `preferences.layout.filtersCollapsed`,
derived datagrid metadata — stays local-only.

## See also

- [globMatch](./glob-match.md) — how the whitelist patterns are matched
- [Schema provider](../providers/schema-provider.md) — the four optional methods that back `BackendApi`
- [User preferences](/python/user-preferences/) — the backend side
