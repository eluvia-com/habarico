---
title: useExporter
sidebar_position: 8
---

Runs a backend export (`GET <resource>/export/`) and downloads the returned file in the browser.

The `export` list action already wires it up through
[ExportButton](../providers/button-provider.md). Use it directly when a custom control should
trigger the same backend export.

## Signature

```typescript
import {useExporter} from 'habarico';

const exporter = useExporter('eshop/product');
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `resource` (required) | `string` | — | Resource in `"service/resource"` form; also names the fallback file (`/` becomes `_`) |

## Returns

`(params: ExportParams) => Promise<void>` — calls the export endpoint and triggers the download:

```tsx
await exporter({format: 'csv', fields: ['name', 'price'], ids: [1, 2]});
```

`ExportParams`:

| Name | Type | Description |
|---|---|---|
| `format` (required) | `string` | Export format, e.g. `csv` |
| `fields` | `string[]` | Restricts and orders the exported columns |
| `ids` | `Identifier[]` | Exports exactly these records |
| `filter` | `FiltersConfiguration` | Exports everything matching this filter (the `getList` filter format) |
| `sort` | `SortPayload` | Row order, serialized like `getList`'s `order_by` |

## Behaviour

- The file is downloaded under the name from the response's `Content-Disposition` header
  (RFC 5987 `filename*` included); without one it falls back to `<resource>.<format>`.
- A `202 Accepted` response means the export exceeded the synchronous threshold and runs in the
  background — the hook only shows the `ra.notification.export_running` info notification.

:::caution
The backend must expose `Content-Disposition` to the browser (CORS `Access-Control-Expose-Headers`),
otherwise every download falls back to the generic `<resource>.<format>` name.
:::

## See also

- [Data provider](../providers/data-provider.md) — the `export` method this hook wraps
- [Button provider](../providers/button-provider.md) — the `export` action rendering `ExportButton`
- [SchemaList](../view-components/schema-list-component.md) — the list the export button sits on
