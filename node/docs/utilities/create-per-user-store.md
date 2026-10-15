---
title: createPerUserStore
sidebar_position: 2
---

A per-user localStorage store for React Admin. Keys are namespaced by the current user's id
(`RaStore.{userId}.{key}`, or `RaStore.{key}` when nobody is signed in), so preferences stay
separate between users on one device and survive a logout / login cycle.

[SchemaAdmin](../base-components/schema-admin.md) builds this store itself — it is not a prop.
Reach for it only when you assemble a React Admin app of your own and want the same behaviour.

In a component, use the `usePerUserStore` hook: it resolves the signed-in user, creates the store
for them and a new one whenever someone else signs in.

```tsx
import {usePerUserStore} from '@eluvia/habarico';
import {AdminContext, AdminUI} from 'react-admin';

const ShopAdmin = () => {
  const {store} = usePerUserStore({
    authProvider,
    clearOnReset: true, // remove the user-scoped keys on store.reset() — default false
  });

  return (
    <AdminContext store={store} authProvider={authProvider} /* … */>
      <AdminUI /* … */ />
    </AdminContext>
  );
};
```

The hook resolves the user through `authProvider.getIdentity()` when the page loads and returns
them as `userIdentity` next to the `store`. To follow a sign-in, a sign-out, a switch to another
user or an impersonation, the returned `setUserIdentity` has to be fed from inside `<AdminContext>`
— on the schema path by [`SchemaIdentitySync`](../base-components/schema-root-context-provider.md).
After a sign-out the identity is `undefined` again and the store is a local one until the next
sign-in, so the login page sends no preference requests.

`createPerUserStore(options)` is the same store without the hook, for code outside a component. Its
scope is fixed when it is created, so a store for another user is another `createPerUserStore`
call.

:::caution
While `identity` is `undefined` the store writes under the unscoped `RaStore.{key}`, and a store
kept after the user changes keeps writing under the previous user's keys. `usePerUserStore` handles
both; with `createPerUserStore`, create the store again whenever the user changes.
:::

## Options

The same for `usePerUserStore` and `createPerUserStore`, except that the hook takes `authProvider`
and `createPerUserStore` takes `identity`:

| Name | Type | Default | Description |
|---|---|---|---|
| `authProvider` | `AuthProvider \| undefined` | — | `usePerUserStore` only. Resolves the signed-in user on page load |
| `identity` | `UserIdentity \| undefined` | `undefined` | `createPerUserStore` only. The signed-in user. Keys are scoped by its `id`, an impersonated session by `{id}__{originalUser.id}`, so it never shares keys with either user's own session. `usePerUserStore` scopes its store the same way and creates a new one when the scope changes, not when the same user is refetched |
| `clearOnReset` | `boolean` | `false` | `store.reset()` removes only the keys scoped to the current user instead of wiping the whole store |
| `backendApi` | `BackendApi` | — | With `whitelist`, wraps the store in [`createBackendStore`](./create-backend-store-backend-synced-preferences.md) once a user is signed in — not while the store is unscoped. Keep it a stable reference for `usePerUserStore` |
| `whitelist` | `string[]` | — | Which keys are mirrored to the backend. `usePerUserStore` compares it by contents, so an inline array is fine |

## Global keys

Some keys are written **both** under the user prefix and globally, so they apply before an identity
is known and survive a logout: `theme`, `locale`, and everything under `preferences.layout.`. That
is what keeps the login screen in the colour scheme and language the user last picked.

:::tip
On the schema path all of this is wired for you: `SchemaAdmin` passes `clearStoreOnLogout` through
as `clearOnReset`, scopes the store by the identity it keeps current across sign-ins (including
the impersonated-user pair), and supplies `PREFERENCES_WHITELIST` together with the backend API of
the service flagged `syncPreferences: true`.
:::

## See also

- [createBackendStore](./create-backend-store-backend-synced-preferences.md) — mirroring whitelisted keys to the backend
- [SchemaAdmin](../base-components/schema-admin.md) — `clearStoreOnLogout` and `serviceConfigMap.syncPreferences`
- [SchemaRootContextProvider](../base-components/schema-root-context-provider.md) — a schema admin assembled by hand, with this store
