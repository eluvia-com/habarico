---
title: SchemaRootContextProvider
sidebar_position: 4
---

The schema-driven root of an admin assembled by hand: it fetches the service schemas for the
signed-in user, builds the data provider from them and hands both down through
[`useSchemaRootContext`](../hooks/context-hooks.md#useschemarootcontext).

[SchemaAdmin](./schema-admin.md) renders it for you, together with everything around it. Reach for
it only when the shell has to be put together differently than `SchemaAdmin` does — its props
cover the layout, the login page, the theme and the providers, so check them first.

## Example

A complete admin for the e-shop service, signed in through the same `authProvider` you would pass
to `SchemaAdmin`. The part below the provider is a component of its own, because it reads the
data provider the provider builds.

```tsx
import {useDeferredValue, useMemo} from 'react';
import {AdminContext, AdminUI, CustomRoutes, Store} from 'react-admin';
import {Route} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
  AdminConfigProvider,
  AdminHashRouter,
  AuthPage,
  Loading,
  LocaleProvider,
  LogoutPage,
  NotFound,
  ResetPasswordPage,
  SchemaIdentitySync,
  SchemaLayout,
  SchemaRootContextProvider,
  ServiceAuthProvider,
  createLightTheme,
  defaultBoxProvider,
  defaultButtonProvider,
  defaultFieldProvider,
  defaultInputProvider,
  defaultValidatorProvider,
  defaultViewProvider,
  getDataProviderFactory,
  getSchemaProvider,
  useGetI18nProvider,
  usePerUserStore,
  useResourceElements,
  useSchemaRootContext,
  withRaDefaults,
} from 'habarico';

const queryClient = new QueryClient();
const serviceConfigMap = {
  eshop: {url: 'https://api.example.com/api/v1/eshop/admin', label: 'E-shop'},
};
const lightTheme = withRaDefaults(createLightTheme());

export const ShopAdmin = ({authProvider}: {authProvider: ServiceAuthProvider}) => {
  const {store, userIdentity, setUserIdentity} = usePerUserStore({authProvider});
  const schemaProvider = useMemo(
    () => getSchemaProvider(authProvider.getAuthHeaders),
    [authProvider]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider locale="en">
        <AdminConfigProvider
          menu={{items: []}}
          navigationGuard={false}
          draftEnabled={false}
          defaultPerPage={25}
          notificationAutoHideDuration={10000}
        >
          <SchemaRootContextProvider
            value={{
              serviceConfigMap,
              schemaProvider,
              dataProviderFactory: getDataProviderFactory,
              authProvider,
              defaultFieldProvider,
              defaultInputProvider,
              defaultValidatorProvider,
              defaultBoxProvider,
              defaultButtonProvider,
              defaultViewProvider,
              defaultRowAction: 'click',
              resources: {},
              locale: 'en',
              hasDashboard: false,
              userIdentity,
              setUserIdentity,
            }}
          >
            <ShopAdminUI store={store} />
          </SchemaRootContextProvider>
        </AdminConfigProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
};

const ShopAdminUI = ({store}: {store: Store}) => {
  const {dataProvider, authProvider, isLoaded} = useSchemaRootContext();
  const i18nProvider = useGetI18nProvider();
  const resources = useResourceElements();
  const isRoutesReady = useDeferredValue(isLoaded);

  return (
    <AdminHashRouter>
      <AdminContext
        store={store}
        dataProvider={dataProvider}
        authProvider={authProvider}
        i18nProvider={i18nProvider}
        lightTheme={lightTheme}
        queryClient={queryClient}
      >
        <SchemaIdentitySync />
        <AdminUI
          layout={SchemaLayout}
          loginPage={AuthPage}
          requireAuth
          ready={Loading}
          catchAll={isRoutesReady ? NotFound : Loading}
        >
          {isLoaded && resources}
          <CustomRoutes noLayout>
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/logout" element={<LogoutPage />} />
          </CustomRoutes>
        </AdminUI>
      </AdminContext>
    </AdminHashRouter>
  );
};
```

What each piece is for:

- **`usePerUserStore`** holds the signed-in user above everything else and the React Admin store
  scoped to them, so one identity scopes both the schema fetch and the store. The user starts from
  `authProvider.getIdentity()`; a new store is created when someone else signs in — see
  [createPerUserStore](../utilities/create-per-user-store.md).
- **`SchemaIdentitySync`** keeps the identity current from inside `<AdminContext>`, where React
  Admin resolves it: after a sign-in, a switch to another user or an impersonation, the schemas and
  the store belong to the user who is signed in. A sign-out sets it back to `undefined`, so nothing
  is requested for the schemas or the preferences until someone signs in again.
- **`LocaleProvider`** sets the language of the date and time pickers; the date, date-time and time
  inputs do not render without it.
- **`AdminHashRouter`** gives the admin a hash router created once. Without it, React Admin creates
  one itself and creates it again whenever `<AdminContext>` re-renders — which a sign-in or a
  sign-out does, as the store and the schemas change — and the redirect to the login page after a
  sign-out is lost. Leave it out only when the application renders its own router around the admin.
- **One `queryClient`** is shared by the provider, which fetches the schemas above `<AdminContext>`,
  and React Admin below it.
- **`isRoutesReady`** keeps `NotFound` away for the one render React Admin needs to register the
  resources once the schemas arrive.
- **The `CustomRoutes`** serve the password-reset link and the logout page — and they are also what
  lets React Admin show the login page at all: with no route of any kind before the schemas load,
  it shows its "ready" screen instead.

:::caution
Without `SchemaIdentitySync` the identity stays the one resolved on page load. Signing in, signing
out and in as someone else, or starting an impersonation keeps the previous user's schemas and
store until the next reload. Place it inside `<AdminContext>`, as in the example: that is where
the identity it reads is resolved.
:::

:::caution
Pass `value` the `userIdentity` and `setUserIdentity` that `usePerUserStore` returns with the store.
A store scoped by some other identity — or by none — writes list filters, hidden columns and the
other preferences under keys the user's next session does not read.
:::

## Props

`value` carries the whole configuration:

| Name | Type | Description |
|---|---|---|
| `serviceConfigMap` (required) | `Readonly<ServiceConfigMap>` | The backends — the same map as [SchemaAdmin](./schema-admin.md)'s |
| `schemaProvider` (required) | `SchemaProvider` | Fetches the schemas — `getSchemaProvider(authProvider.getAuthHeaders)` for the Habarico contract |
| `dataProviderFactory` (required) | `(servicesSchema, getAuthHeaders) => ServiceDataProvider` | Builds the data provider once the schemas are known — `getDataProviderFactory` for the Habarico contract. Pass the function itself |
| `authProvider` (required) | `ServiceAuthProvider` | See [AuthProvider](../providers/auth-provider.md) |
| `defaultFieldProvider` (required) | `AdminFieldProvider` | The built-in `defaultFieldProvider` |
| `defaultInputProvider` (required) | `AdminInputProvider` | The built-in `defaultInputProvider` |
| `defaultValidatorProvider` (required) | `AdminValidatorProvider` | The built-in `defaultValidatorProvider` |
| `defaultBoxProvider` (required) | `AdminBoxProvider` | The built-in `defaultBoxProvider` |
| `defaultButtonProvider` (required) | `AdminButtonProvider` | The built-in `defaultButtonProvider` |
| `defaultViewProvider` (required) | `AdminViewProvider` | The built-in `defaultViewProvider` |
| `fieldProvider`, `inputProvider`, `validatorProvider`, `boxProvider`, `buttonProvider` | the matching `Admin*Provider` | Optional overrides, consulted before the defaults |
| `resources` (required) | `{[name: string]: ReactElement}` | `SchemaResource` / `Resource` elements by resource name (`'eshop/product'`), overriding the generated ones. `{}` for none |
| `defaultRowAction` (required) | `'click' \| 'double-click' \| 'none'` | What a list row does when clicked |
| `rowTooltip` | `boolean` | Whether a list row shows its gesture tooltip on hover. Omitted means shown |
| `locale` (required) | `string` | The language the schemas are fetched in (`Accept-Language`) |
| `hasDashboard` (required) | `boolean` | Whether the admin renders a dashboard |
| `userIdentity` (required) | `UserIdentity \| undefined` | The signed-in user, from `usePerUserStore`. No schema is fetched while it is `undefined` |
| `setUserIdentity` (required) | `(identity: UserIdentity \| undefined) => void` | Its setter, which `SchemaIdentitySync` calls |

:::tip
`SchemaAdmin` does more than the example: it syncs preferences with the backend
(`syncPreferences`), switches languages — it reads `locale` from the store, so the schemas are
refetched in the new one — and fills `AdminConfigProvider` from its props. Unless the admin needs
a shell `SchemaAdmin` cannot be configured to render, use [SchemaAdmin](./schema-admin.md).
:::

## See also

- [SchemaAdmin](./schema-admin.md) — the same root, assembled for you
- [Context hooks](../hooks/context-hooks.md) — what `useSchemaRootContext` gives the components below
- [createPerUserStore](../utilities/create-per-user-store.md) — the per-user store and `usePerUserStore`
