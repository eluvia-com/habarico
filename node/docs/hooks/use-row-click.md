---
title: useRowClick
sidebar_position: 11
---

Gives a datagrid row two independent activations — one for a single click, one for a double click —
and resolves the modifier keys into "same tab", "new tab" or "new window".

The generated list wires it up from `singleClickAction` and `doubleClickAction` in the schema. Use
it directly on a datagrid you assembled yourself.

## Signature

```typescript
import {useRowClick} from 'habarico';

const {handleClickStart, getRowClickWithData, handleDoubleClick} = useRowClick(
  (record, mode) => `/eshop/product/${record.id}/show`,
  (record, mode) => `/eshop/product/${record.id}`
);
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `onSingleClick` | `(record, navigationMode) => void \| string` | Runs on a single click; return a URL to navigate, or nothing to handle it yourself |
| `onDoubleClick` | `(record, navigationMode) => void \| string` | The same, for a double click |

Either may be omitted. `navigationMode` is `'same'`, `'tab'` or `'window'`, derived from the
modifier keys and mouse button on the original event — a returned URL is opened accordingly, so
ctrl-click keeps working without any extra code.

## Returns

Bind all three to the row:

| Name | Bind to | Purpose |
|---|---|---|
| `handleClickStart` | `onMouseDown` | Records the timestamp and the modifier keys |
| `getRowClickWithData` | react-admin's `rowClick` | Runs the activation and returns `false` to suppress react-admin's own navigation |
| `handleDoubleClick` | `onDoubleClick` | Cancels a pending single click and runs the double-click activation |

## Behaviour

- **Both slots set:** the single click is deferred by `DOUBLE_CLICK_DELAY` so a double click can
  cancel it. Only one of the two ever runs.
- **One slot set:** it fires immediately on its gesture, with no added latency.
- A press held longer than `DOUBLE_CLICK_DELAY` is treated as the start of a drag and activates
  nothing — that is what keeps drag-and-drop row sorting from opening records.
- The pending timer is cleared on unmount.

:::tip
The activations are read from a ref, so passing new closures on every render does not restart a
pending click.
:::

## See also

- [Datagrid components](../datagrid-components.md) — where the row handlers are bound
- [SchemaList](../view-components/schema-list-component.md) — the generated list using it
- [SchemaListBox](../box-components/list-box.md) — the same actions on an embedded list
