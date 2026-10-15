---
title: SchemaWizardBox
sidebar_position: 5
---

Walks the user through a form one step at a time, validating each step before letting them move on.

Use it when the later steps only make sense once the earlier ones are filled in — a multi-part
create form. When the sections are independent, [SchemaTabBox](./tab-box.md) is the better fit.

## Example

Each step is a child box; its `label` becomes the step caption and is required.

```python
CreateViewSchemaGenerator(box=WizardBox(
    validate_steps=True,
    boxes=[
        TabItemBox(label="Product", boxes=["name", "sku"]),
        TabItemBox(label="Pricing", boxes=["price", "vat_rate"]),
        TabItemBox(label="Availability", boxes=["stock", "published_at"]),
    ],
))
```

## Schema fields

| Field | Type | Default | Description |
|---|---|---|---|
| `wizard.showToolbarNavigation` | `boolean` | `true` | Previous/next buttons in the box toolbar |
| `wizard.validateSteps` | `boolean` | `true` | Validates the current step's fields before advancing |
| `boxes` | `BoxItem[]` | `[]` | One child **box** per step |
| `label` | `string` | — | Heading in the card header; setting it is enough to turn the card frame on. Without a card the wizard renders no heading of its own — the step titles come from the child boxes |
| `card` | `boolean \| null` | `null` | Three-state card frame, evaluated as on a [grid box](./grid-box.md) — see [Card frame](./index.md#card-frame) |
| `collapsible` | `'open' \| 'closed'` | — | Collapses the box; takes effect only together with a card, whose header hosts the toggle |
| `toolbarActions` | `ActionDescriptor[]` | — | Buttons next to the stepper — or in the card header when the box has a `label`, as on any other box. Unlike on other boxes their presence alone does not turn the card frame on |
| `bottomActions` | `ActionDescriptor[]` | — | Buttons in the toolbar below the step — see below for when they show |

Note the defaults are the opposite of [SchemaTabBox](./tab-box.md): a wizard navigates with buttons
and validates by default, a tab box does neither.

## Which steps the user may jump to

The stepper is non-linear, but which steps accept a click depends on the situation:

| Situation | Reachable steps |
|---|---|
| A record already exists (edit / show view) | All of them |
| `validateSteps: false` | All of them |
| `showToolbarNavigation: false` | All of them — without a Next button, clicking the stepper is the only way to move |
| Create view with validation and navigation | Only up to the furthest step reached so far |

In the last case **Next** is what unlocks the following step: it runs `trigger()` on the current
step's field names and only advances when they pass.

## Where the actions appear

`bottomActions` sit in the toolbar under the step, next to **Next**. **Next** stays on the last step
too — it is only disabled there, not removed, so the navigation control never vanishes at the end.
The bottom actions themselves:

- on the **last step** they always show, beside the (disabled) Next button
- on earlier steps they show only when a record already exists, so Save stays reachable while
  editing
- in a create view they stay hidden until the last step, because the steps are meant to be completed
  in order

Step labels use the same state colours as tabs — `warning.main` for unsaved changes, `error.main`
for validation errors.

## See also

- [SchemaTabBox](./tab-box.md) — the same children without the ordering
- [useTabsLocation](../hooks/use-tabs-location.md) — the active step is stored the same way as the active tab
- [Box components](./index.md) — the other containers
