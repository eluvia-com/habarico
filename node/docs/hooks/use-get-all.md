---
title: useGetAll
sidebar_position: 4
---

Fetches every record of a resource, walking the pages for you.

Use it where a complete set is genuinely needed — a select box, an export, a chart. For anything
the user browses, use React Admin's paginated `useGetList` instead: this hook keeps requesting
until the resource is exhausted.

## Signature

```typescript
import {useGetAll} from '@eluvia/habarico';

const {data, total, isLoading, isError, refetch} = useGetAll<Product>('eshop/product', {
  sort: {field: 'name', order: 'ASC'},
  filter: {is_available: true},
  perPage: 50,
});
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `resource` (required) | `string` | — | Resource in `"service/resource"` form |
| `params.sort` | `SortPayload` | `{field: 'id', order: 'DESC'}` | Sort passed to every page request |
| `params.filter` | `DataType` | `{}` | Filter passed to every page request |
| `params.perPage` | `number` | `50` | Page size — how many requests the walk takes |
| `params.meta` | `DataType` | — | Passed through to the data provider, e.g. field selection |
| `options` | `UseQueryOptions` | — | React Query options, e.g. `enabled` |

## Returns

The React Query result, with `data` and `total` lifted to the top level:

| Name | Type | Description |
|---|---|---|
| `data` | `RecordType[] \| undefined` | All records, in the requested order |
| `total` | `number \| undefined` | Number of records fetched |
| `isLoading` / `isError` / `refetch` | — | Standard React Query fields |

## Example

```tsx
const {data: categories = [], isLoading} = useGetAll<Category>('eshop/category', {
  sort: {field: 'name', order: 'ASC'},
});
```

:::caution
The query key covers `resource`, `sort`, `filter` and `perPage` — not `meta`. Two calls that
differ only in `meta` share one cache entry, so pass a distinct `filter` (or your own
`queryKey` via `options`) when the field selection has to differ.
:::

## See also

- [DataProvider](../providers/data-provider.md) — the `getList` call this hook repeats
- [useExporter](./use-exporter.md) — exporting a list on the backend instead of fetching it
