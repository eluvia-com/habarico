---
title: SchemaSimpleBox
sidebar_position: 3
---

A labelled stack of fields — the plainest container, and the one every unknown box type falls back
to.

Reach for it when a section needs nothing but a heading and its fields underneath. When the fields
should sit side by side, use [SchemaGridBox](./grid-box.md) instead.

## Example

Declared on the backend, not in React:

```python
EditViewSchemaGenerator(box=Box(
    boxes=[
        Box(label="Product", boxes=["name", "sku", "description"]),
        Box(label="Pricing", card=True, collapsible="closed", boxes=["price", "vat_rate"]),
    ]
))
```

## Schema fields

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Section heading; on its own it turns the card frame on |
| `card` | `boolean \| null` | `null` | Three-state card frame — see [Card frame](./index.md#card-frame) |
| `collapsible` | `'open' \| 'closed'` | — | Makes the box collapsible; the value is the initial state |
| `boxes` | `BoxItem[]` | `[]` | Fields, nested boxes, or both |
| `toolbarActions` | `ActionDescriptor[]` | — | Buttons in the header, rendered as contained medium buttons |
| `bottomActions` | `ActionDescriptor[]` | — | Buttons pinned to the bottom of the box |

`excludeFields` removes field children by name before rendering; nested boxes are never filtered
out by it, only passed the list further down.

## Height behaviour

A box whose children are only fields keeps its natural height. A box that contains a **nested box**
grows to fill the available height — but only when it is the last box on its path (last child of
its parent, whose parent is itself last, and so on). That is what lets a tab's innermost list reach
the bottom of the card without earlier sections stretching and pushing the layout toward the centre.

`bottomActions` render in the box footer — the last slot of the box's flex column — so they sit
below the fields without forcing them to stretch.

## See also

- [Box components](./index.md) — the other containers
- [SchemaGridBox](./grid-box.md) — the same stack, arranged in columns
- [Layout primitives](./layout-primitives.md) — `Panel`, the schema-free container underneath
- [Forms and layout](/concepts/guides/forms-and-layout) — composing boxes into a form
