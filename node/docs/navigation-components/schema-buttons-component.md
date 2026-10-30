---
title: SchemaButtons
sidebar_position: 5
---

Renders the action buttons a record's schema declares, overflowing into a menu when there are too
many.

The generated views mount it for you — in the view toolbar, in the row action column, in the form
toolbar. Use it directly when you build a screen of your own that should offer the same actions.

## Example

```tsx
<SchemaButtons record={order} descriptors={[{type: 'default_actions'}]} maxVisibleButtons={4} />
```

## Props

On top of these it accepts `ActionButtonProps` — except `variant` and `showLabel`, which it
redefines below so they can be set per action.

| Name | Type | Default | Description |
|---|---|---|---|
| `record` | `HabRecord` | record from context | Record whose actions are rendered; also provides the record context to the buttons |
| `descriptors` | `AnyActionDescriptor[]` | — | The action slot to render, in order; absent renders nothing. A `DefaultActions` entry expands into the resource's actions, a descriptor can override their label, icon or colour |
| `isList` | `boolean` | `false` | The surface a `DefaultActions` entry expands for: a list keeps `showInList` actions, a detail `showInDetail` ones |
| `target` | `string` | — | Marks the current screen as the origin, so the action can return to it |
| `variant` | `ButtonVariant \| ((name: string) => ButtonVariant)` | — | MUI variant, optionally per action |
| `showLabel` | `boolean \| ((name: string) => boolean)` | `true` | Whether to show labels, optionally per action |
| `viewName` | `string` | view from context | View whose action set is used |
| `iconOnly` | `boolean \| Breakpoint` | `false` | Renders every button icon-only; a breakpoint collapses the labels only below that width. Overflow menu items always keep theirs |
| `maxVisibleButtons` | `ResponsiveCount` | `6` | Buttons shown before the rest move into the `⋮` menu. A number, or a per-breakpoint map (`{xs: 1, lg: 2}`). The `⋮` trigger itself is never counted |
| `minVisibleButtons` | `number` | `1` | Fewest buttons kept inline when `maxVisibleButtons` overflows. Pass `0` to allow every button to collapse into the `⋮` menu |

## Where the actions come from

Actions live in the record's `meta.schema.actions`, which the backend fills per record. A user
without permission for an action simply does not receive it, so nothing has to be hidden on the
frontend.

A descriptor with a `reference` takes its action from the schema that address loads and runs it
against that resource and record instead — see
[linking an action](../types-and-schemas/view-schema-and-action-schema.md#linking-an-action-from-another-schema).

:::tip
A descriptor may nest `menuItems`, which groups several actions under one button. A group whose
items are all missing from the schema is dropped rather than rendered empty.
:::

## See also

- [ButtonProvider](../providers/button-provider.md) — replacing the component a button renders as
- [View schema and action schema](../types-and-schemas/view-schema-and-action-schema.md) — how actions are declared
- [useCallAction](../hooks/use-call-action.md) — calling an action directly
