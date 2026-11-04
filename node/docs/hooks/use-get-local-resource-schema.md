---
title: useGetLocalResourceSchema
sidebar_position: 3
---

Fetches a resource's full schema and answers what that resource can do.

Use it when a custom component has to branch on the backend's capabilities — whether a resource
has an edit view, whether the delete endpoint exists. Inside the generated views the schema is
already in context.

## Signature

```typescript
import {useGetLocalResourceSchema} from 'habarico';

const result = useGetLocalResourceSchema({
  resource,     // string — "serviceName/resourceName"; defaults to the resource context
  schema,       // LocalResourceSchema — when given, no request is made
  actionName,   // string — fetches the schema of one action
  recordId,     // string | number — fetches the per-record schema
  params,       // Record<string, string | number | boolean> — extra query params
});
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `resource` | `string` | resource from context | Resource in `"service/resource"` form |
| `schema` | `LocalResourceSchema` | — | Skips the request and uses this schema; its references get the service of `resource` |
| `actionName` | `string` | — | Requests the schema of a specific action |
| `recordId` | `string \| number` | — | Requests the schema for one record — this is how per-record actions and permissions arrive |
| `params` | `Record<string, string \| number \| boolean>` | — | Appended to the schema request |

## Returns

| Name | Type | Description |
|---|---|---|
| `schema` | `LocalResourceSchema \| undefined` | The full schema |
| `isLoading` / `isError` | `boolean` | Request state |
| `error` | `unknown` | The failure, if any |
| `hasListView`, `hasCreateView`, `hasEditView`, `hasShowView` | `boolean` | Whether `schema.views` contains that view |
| `hasListAction`, `hasCreateAction`, `hasEditAction`, `hasShowAction`, `hasDeleteAction` | `boolean` | Whether `schema.actions` exposes that action |
| `hasGetEndpoint`, `hasPostEndpoint`, `hasPutEndpoint`, `hasPatchEndpoint`, `hasDeleteEndpoint` | `boolean` | Whether the backend allows that HTTP method |
| `getViewSchema` | `(name: string) => ViewSchema \| undefined` | One view by name |
| `getMethodSchema` | `(method: RequestMethodType) => MethodSchema \| undefined` | The field set of one method |
| `getFieldSchema` | `(method: RequestMethodType, fieldName: string) => FieldSchema \| undefined` | One field of one method |

## Example

```tsx
const {hasEditView, hasDeleteAction, isLoading} = useGetLocalResourceSchema({
  resource: 'eshop/product',
});

if (isLoading) return <Loading />;

return (
  <>
    {hasEditView && <EditButton />}
    {hasDeleteAction && <DeleteButton />}
  </>
);
```

:::caution
The `has*View` / `has*Action` / `has*Endpoint` flags are derived from the **fetched** schema only.
Pass a `schema` prop and they all stay `false` — the flags describe what the request returned, not
what you handed in.
:::

:::caution
The request is cached per resource, record, locale, action **and identity** — a schema fetched for
one user is never reused for another, because permissions can change what the schema contains.
The query stays disabled until the identity is known, so `isLoading` is `true` for a moment on
every hard reload.
:::

Every `ResourceReference` in the returned schema names its `service`: one the backend left out gets
the service of `resource`, the schema it was sent in. A `schema` handed in with no resource to take
the service from must name it in every reference, otherwise the hook reports `isError`.

A resource that resolves to no entry in the service schemas — a typo, or a resource the backend
does not expose — surfaces as `isError` once the service schemas are loaded, rather than silently
returning an empty schema.

## See also

- [SchemaProvider](../providers/schema-provider.md) — what actually performs the request
- [Service and resource schema](../types-and-schemas/service-schema-and-resource-schema.md) — the returned shape
- [Schema lookup hooks](./schema-lookup-hooks.md) — the lighter global layer
- [REST API reference](/api) — the endpoints behind it
