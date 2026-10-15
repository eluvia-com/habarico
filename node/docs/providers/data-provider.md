---
title: Data provider
sidebar_position: 3
---

Performs every data call the admin makes: CRUD, actions and exports.

`getDataProviderFactory` **is** the factory `dataProviderFactory` expects — `SchemaAdmin` calls it
directly, as `dataProviderFactory(servicesSchema, authProvider.getAuthHeaders)`, once the schemas
are known. Pass the function itself; no pre-binding needed, since `getAuthHeaders` comes from
[`authProvider`](./auth-provider.md) rather than being supplied here.

## Signature

```typescript
const dataProvider = getDataProviderFactory(servicesSchema, getAuthHeaders);
// servicesSchema: ServicesSchema
// getAuthHeaders: () => {[headerName: string]: string}
// dataProvider: ServiceDataProvider
```

## Methods

`ServiceDataProvider` is React Admin's `DataProvider` — `getList`, `getOne`, `getMany`, `create`,
`update`, `delete`, … — plus:

| Method | Signature | Purpose |
|---|---|---|
| `callAction` | `(resource, method, path?, params?) => Promise<{data: unknown}>` | Calls an action endpoint on a resource or a record |
| `export` | `(resource, params) => Promise<ExportResult>` | Calls the `/export/` endpoint and returns the file as a blob, with the filename from `Content-Disposition` |

## Extending it

`habarico-enterprise` adds `search` (fulltext across a service) and `aggregate` (the `/aggregate`
endpoint behind the dashboard widgets) — both call endpoints only a paid backend serves. Pass
`dataProviderFactory={getEnterpriseDataProviderFactory}`, or render `EnterpriseSchemaAdmin`, which
does it for you. Both methods are optional at the point of use: with the free provider the
features behind them report themselves unavailable rather than failing.

Reading code asks for those methods as optional, because the application may have wired the
built-in factory instead:

```ts
const {aggregate} = useDataProvider<MaybeEnterpriseDataProvider>();
if (!aggregate) {
  // the built-in provider is wired — report the feature unavailable
}
```

React Admin's `useDataProvider<T>()` returns `T` exactly as declared, so the optionality comes from
the type asked for — the counterpart of what [`useSchemaProvider`](./schema-provider.md) does for
the schema provider.

Its factory builds on `createHttpClient` and `getSchemaFromResource`, exported here so an extension
reaches its endpoints exactly the way the built-in methods reach theirs — same auth headers, same
`Accept-Language`.

## Example

```tsx
import {getDataProviderFactory, SchemaAdmin} from 'habarico';

<SchemaAdmin
  dataProviderFactory={getDataProviderFactory}
  authProvider={authProvider}
  serviceConfigMap={SERVICES}
>
  <SchemaResource name="eshop/product" />
</SchemaAdmin>
```

`authProvider.getAuthHeaders` — required on [`ServiceAuthProvider`](./auth-provider.md) — is what
`SchemaAdmin` forwards as the second argument above. Writing your own factory instead of
`getDataProviderFactory`? Match the same two-argument signature:

```tsx
const dataProviderFactory = (servicesSchema, getAuthHeaders) => ({
  getList: async (resource, params) => {
    const res = await fetch(url, {headers: getAuthHeaders()});
    // ...
  },
  // ...the rest of react-admin's DataProvider methods
});
```

## Record identifier

Every record the provider returns gets React Admin's `id` from the field the resource schema names
in `pkFieldName`, so a resource keyed by `name` or `uuid` routes and refetches by that value.

The derived identifier wins over an `id` field in the payload itself: a backend that serves
`{"id": 2, "name": "consumable"}` for a resource keyed by `name` still yields a record with
`id: 'consumable'`. A raw `id` is used only as a fallback, for a partial record that does not carry
the primary-key field at all.

:::note
`id` is therefore reserved in the frontend. A resource keyed by something else should not serialize
its own `id` field — it cannot be displayed in the admin and only duplicates data under a name that
means something different here.
:::

## Field selection

List and detail requests carry a field selection, so a list fetches the columns it shows rather
than whole records. Pass it through `meta.fields`:

```tsx
import {FIELD_DEFAULT} from 'habarico';

const {data} = useGetList('eshop/product', {
  meta: {fields: {id: FIELD_DEFAULT, name: FIELD_DEFAULT, category: {meta: {repr: FIELD_DEFAULT}}}},
});
```

Each value is either the sentinel `FIELD_DEFAULT` (the literal `'__default__'` — the field's
default representation) or a nested selection object for sub-fields.

`id` is rewritten to the resource's actual primary key name, so a resource keyed by `uuid` still
takes `id` here.

:::tip
Auth headers are read per request through `getAuthHeaders`, not captured once. A token refreshed
in the background therefore reaches the next call without rebuilding the provider.
:::

## See also

- [SchemaAdmin](../base-components/schema-admin.md) — where the factory is passed in
- [useCallAction](../hooks/use-call-action.md) — the hook wrapping `callAction`
- [REST API reference](/api) — the endpoints this provider speaks to
