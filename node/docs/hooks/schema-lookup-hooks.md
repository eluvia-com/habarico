---
title: Schema lookup hooks
sidebar_position: 12
---

Small hooks around the schemas the admin has already fetched: the service-level list of
resources, one resource's entry in it, and a way to throw the cache away.

Use them when a component needs to know something about a resource without fetching its full schema
— whether it exists, whether it may be aggregated, what its base URL is.

## useGetGlobalResourceSchema

Returns a lookup function into the service schemas held by [SchemaAdmin](../base-components/schema-admin.md).

```typescript
import {useGetGlobalResourceSchema} from '@eluvia/habarico';

const getGlobalResourceSchema = useGetGlobalResourceSchema();
const base = getGlobalResourceSchema('eshop/product');

if (base?.globalFulltextSearchEnabled) {
  // offer this resource in the search overlay
}
```

The returned function takes a `"service/resource"` string and gives back that resource's
`GlobalResourceSchema` — its `url`, `label`, `pkFieldName`, `menu`, the views and actions it exposes,
and the `globalFulltextSearchEnabled` flag — or `undefined` when the service or the resource is
unknown. A paid backend also sends `aggregateEnabled` and `dashboardEnabled`; those are typed by
`habarico-enterprise` on `DashboardResourceSchema`, since no free backend emits them. It reads from context and performs no
request, so it is cheap to call in a render.

## useGlobalResourceSchemaContext

The same lookup, already resolved for one resource and enriched with the capability flags — without
a request. Called with no argument it takes the resource from the surrounding resource context.

```typescript
import {useGlobalResourceSchemaContext} from '@eluvia/habarico';

const {schema, getGlobalViewSchema, hasEditView, hasDeleteAction} =
  useGlobalResourceSchemaContext('eshop/product');
```

| Name | Type | Description |
|---|---|---|
| `schema` | `GlobalResourceSchema \| undefined` | The resource's global entry |
| `getGlobalViewSchema` | `(name?: string) => GlobalViewSchema \| undefined` | One view by name |
| `hasListView`, `hasCreateView`, `hasEditView`, `hasShowView` | `boolean` | Whether the resource exposes that view |
| `hasListAction`, `hasCreateAction`, `hasEditAction`, `hasShowAction`, `hasDeleteAction` | `boolean` | Whether the resource exposes that action |

`useGetGlobalResourceSchemaContext()` is the uncurried form — it returns
`(resource?: string) => …` so one component can inspect several resources.

:::tip
Prefer this over [useGetLocalResourceSchema](./use-get-local-resource-schema.md) when all you need
is "does this resource have an edit view". The global layer is already in memory; the local one
costs a request per resource, per record and per locale.
:::

## useGetServiceSchemas

Fetches the service-level schema of every service in a `ServiceConfigMap`. `SchemaAdmin` calls it
once and puts the result in context; call it yourself only when you build an admin shell of your
own.

```typescript
const {isLoading, isLoaded, isError, servicesSchema, refetch} = useGetServiceSchemas(
  serviceConfigMap,
  schemaProvider,
  locale,
  identity,
  () => authProvider.isAuthenticated()
);
```

| Name | Type | Description |
|---|---|---|
| `servicesSchema` | `ServicesSchema` | Resources per service key; a service still loading is simply absent |
| `isLoading` / `isError` | `boolean` | True when **any** of the services is loading or failed |
| `isLoaded` | `boolean` | Everything resolved and a signed-in identity is known |
| `refetch` | `() => void` | Refetches every service schema |

Queries are keyed by service, locale and user id, and are skipped entirely until an identity
exists. The optional fifth argument, `isAuthenticated`, is read on every render; while it returns
`false` the queries are skipped too. Pass it so that a render after a sign-out, which may still
hold the last identity, does not refetch the schemas without credentials.

## useLocalResourceSchemaRefresh

Returns a function that invalidates every cached **resource** schema, so the next screen fetches a
fresh one.

```typescript
import {useLocalResourceSchemaRefresh} from '@eluvia/habarico';

const refreshSchemas = useLocalResourceSchemaRefresh();

// after an action that changes what the user may do
await callAction(...);
refreshSchemas();
```

Reach for it when a backend change alters the schema rather than the data — a role change, a
workflow transition that unlocks new actions. Plain record edits need no refresh; the data provider
already invalidates those.

:::caution
It invalidates the `resourceSchema` queries only. Service-level schemas — the menu, the resource
list — are not touched; use `refetch` from `useGetServiceSchemas` for those.
:::

## See also

- [useGetLocalResourceSchema](./use-get-local-resource-schema.md) — the full schema of one resource
- [Schema provider](../providers/schema-provider.md) — where these schemas come from
- [Service and resource schema](../types-and-schemas/service-schema-and-resource-schema.md) — their shapes
