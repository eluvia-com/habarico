---
title: SchemaTabBox
sidebar_position: 4
---

Splits a view into tabs, keeping the open one in the URL hash so a tab survives a reload and can be
linked to.

Use it when the sections are independent and the user may visit them in any order. When they have
to be completed in sequence, use [SchemaWizardBox](./wizard-box.md) instead.

## Example

Each tab is a child box; its `label` becomes the tab caption.

```python
EditViewSchemaGenerator(box=TabBox(
    show_toolbar_navigation=True,
    boxes=[
        Box(label="Product", boxes=["name", "sku", "description"]),
        Box(label="Pricing", boxes=["price", "vat_rate", "stock"]),
        Box(label="Orders", boxes=[ListBox(reference="eshop/order", target="product")]),
    ],
))
```

## Schema fields

| Field | Type | Default | Description |
|---|---|---|---|
| `tab.showToolbarNavigation` | `boolean` | `false` | Adds previous/next buttons to the box toolbar |
| `boxes` | `BoxItem[]` | `[]` | One child **box** per tab — field children are ignored here |
| `label` | `string` | — | Heading in the card header; setting it is enough to turn the card frame on. Without a card the tab box renders no heading of its own — the tab titles come from the child boxes |
| `card` | `boolean \| null` | `null` | Three-state card frame, evaluated as on a [grid box](./grid-box.md) — see [Card frame](./index.md#card-frame) |
| `collapsible` | `'open' \| 'closed'` | — | Collapses the box; takes effect only together with a card, whose header hosts the toggle |
| `toolbarActions` | `ActionDescriptor[]` | — | Buttons next to the tab strip, on the right — or in the card header when the box has a `label`, as on any other box. Unlike on other boxes their presence alone does not turn the card frame on |
| `bottomActions` | `ActionDescriptor[]` | — | Buttons in the box toolbar below the panel, shown on **every** tab |

## Behaviour

- The active tab is stored under the box's full path of names, so nested tab boxes keep independent
  state. It is read and written through [useTabsLocation](../hooks/use-tabs-location.md).
- When no tab is selected — a fresh URL — the first child box is selected automatically.
- In a **form** view every tab is mounted at once — inactive ones are hidden with `display: none`
  and wrapped in a `FormGroupContext` named after the tab. That is what lets validation errors and
  unsaved changes be attributed to the tab they belong to, so its label can turn `warning.main`
  (unsaved changes) or `error.main` (validation errors), with a tooltip explaining which.
- In a **read-only** view only the active tab's content is mounted, and the labels carry no state
  colour — there is no form state to report.
- Because tabs can be switched freely, `bottomActions` (a Save button, say) appear on all of them.
- Switching a record between show and edit keeps the hash, so the open tab survives the switch.
  Tabs of a box the arrived-at view does not have are swept once that view has mounted, so the URL
  never collects the tabs of the view you came from — see
  [useTabsLocation](../hooks/use-tabs-location.md).

:::caution
A tab whose child is a field descriptor rather than a box is dropped — the tab strip is built from
`schema.boxes.filter(isBoxSchema)`. Wrap loose fields in a `Box` to give them a tab.
:::

## See also

- [useTabsLocation](../hooks/use-tabs-location.md) — reading and setting the active tab yourself
- [SchemaWizardBox](./wizard-box.md) — the same children, walked in order
- [Box components](./index.md) — the other containers
