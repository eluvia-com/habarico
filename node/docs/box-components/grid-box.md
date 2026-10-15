---
title: SchemaGridBox
sidebar_position: 6
---

Arranges its children side by side on a responsive 12-column grid.

Use it whenever a section reads better in columns than as one long stack. Nest a `grid-item` box
inside it to control the widths yourself; leave them out and the widths are computed.

## Example

```python
EditViewSchemaGenerator(box=GridBox(boxes=[
    GridItemBox(md=8, boxes=[Box(label="Product", boxes=["name", "sku", "description"])]),
    GridItemBox(md=4, boxes=[Box(label="Pricing", boxes=["price", "vat_rate", "stock"])]),
]))
```

## Schema fields

| Field | Type | Default | Description |
|---|---|---|---|
| `boxes` | `BoxItem[]` | `[]` | Children; a child with `type: 'grid-item'` carries its own widths |
| `gridItem.xs` … `gridItem.xl` | `number` | computed | Column span (1–12) of a `grid-item` child at that breakpoint |
| `label` | `string` | — | Heading in the card header; setting it is enough to turn the card frame on |
| `card` | `boolean \| null` | `null` | Three-state card frame — see [Card frame](./index.md#card-frame) |
| `collapsible` | `'open' \| 'closed'` | — | Wraps the grid in a collapsible card |
| `toolbarActions` | `ActionDescriptor[]` | — | Buttons in the card header — their presence is what makes the card appear |
| `bottomActions` | `ActionDescriptor[]` | — | Buttons below the grid, right-aligned |

## Computed widths

When **no** child is a `grid-item`, the grid computes a span for every child from the number of
children and the width the grid itself was given, capped per breakpoint:

| Breakpoint | Max columns | Minimum span |
|---|---|---|
| `xl` | 4 | 2 |
| `lg` | 3 | 3 |
| `md` | 2 | 3 |
| `sm` | 1 | 3 |
| `xs` | 1 | 3 |

So four children fill a row on `xl`, drop to three on `lg`, two on `md`, and stack on `sm` and
below. A single explicit `grid-item` child switches the whole grid to explicit mode — then every
child needs its own widths, and the ones without any fall back to full width.

Cells are spaced like the fields inside a column, by the density setting (8px compact, 14.4px
standard, 24px comfortable), both between rows and between columns, so a grid that splits one form
into columns keeps its inputs evenly apart.

:::caution
A grid box renders no card frame of its own unless it has a `label`, `card: true`, is
`collapsible`, has `toolbarActions`, or is the view's first box on a page **and holds fields
directly**; a first-box grid that only wraps other boxes hands the card default to them instead
(see [Card frame](./index.md#card-frame)). `card: false` turns the frame off in every one of those
cases. To give a **column** a heading, put a labelled `Box`
**inside** the `grid-item`, not on the grid — a label on the grid frames the whole grid in one card.
:::

:::tip
Cards placed side by side only line up to equal heights when the box goes directly into the grid.
Wrapping each one in an extra container of your own breaks the height chain.
:::

## See also

- [Layout primitives](./layout-primitives.md) — `PanelGrid` and `PanelGridItem` outside a schema
- [SchemaSimpleBox](./simple-box.md) — the same children stacked
- [Box components](./index.md) — the other containers
