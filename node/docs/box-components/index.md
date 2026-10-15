---
title: Box components
sidebar_position: 1
---

Boxes are the layout of a view. Everything between the view's title and its toolbar is a tree of
boxes, and the backend decides its shape — which is why arranging a form is a backend change, not a
frontend one.

[SchemaBox](./schema-box.md) receives one node of that tree and asks the
[box provider](../providers/box-provider.md) which container renders it. The pages below document
the containers it can pick.

| Component | `type` | Renders |
|---|---|---|
| [SchemaSimpleBox](./simple-box.md) | `simple` | A labelled stack of fields — also the fallback for an unknown type |
| [SchemaTabBox](./tab-box.md) | `tab` | Tabbed sections, with the open tab kept in the URL |
| [SchemaWizardBox](./wizard-box.md) | `wizard` | A stepped form that validates each step before advancing |
| [SchemaGridBox](./grid-box.md) | `grid` / `grid-item` | A responsive 12-column grid |
| [SchemaListBox](./list-box.md) | `list` | An embedded list of a related resource |
| [SchemaArrayBox](./array-box.md) | `array` | A repeatable group of fields; an array with `array.listed` renders as `SchemaChoicesArrayBox` — one checkbox row per enum value |
| [SchemaObjectBox](./object-box.md) | `object` | The properties of a nested object |
| [SchemaGalleryBox](./gallery-box.md) | `gallery` | An image grid built from a related resource |

Two more pages cover what the containers are built from:

| Page | What it covers |
|---|---|
| [SchemaBox](./schema-box.md) | The dispatcher every box goes through, and conditional rendering |
| [Layout primitives](./layout-primitives.md) | `Panel`, `PanelGrid` and `Section` — the schema-free containers underneath |

## Common schema fields

Every box type reads these from its `BoxSchema`, whatever the `type`:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Identifies the box; tab and wizard state is keyed by the path of names |
| `label` | `string` | Section heading. On its own it turns the card frame on; together with `card: false` it renders as a plain heading — see [Card frame](#card-frame) |
| `card` | `boolean \| null` | Three-state card frame — see [Card frame](#card-frame) |
| `collapsible` | `'open' \| 'closed'` | Makes the box collapsible and sets its initial state |
| `boxes` | `BoxItem[]` | Children: nested boxes, field descriptors, or both |
| `readOnly` | `boolean` | Renders every field inside as a display field |
| `toolbarActions` | `ActionDescriptor[]` | Buttons in the box header, next to the label |
| `bottomActions` | `ActionDescriptor[]` | Buttons below the box's fields, e.g. a section-level save |
| `options.dynamicRender` | `DynamicRenderOptions` | `showQuery` / `requiredQuery` — see [SchemaBox](./schema-box.md#conditional-rendering) |

## Card frame

`card` has three states, and an absent key means the same as `null`:

| Value | Behaviour |
|---|---|
| `true` | Always renders the card (`Panel`) |
| `false` | Never renders the card (`Section`), **even with a label or toolbar actions** — the label becomes a plain section heading over the page background |
| `null` / absent | The component decides |

Left unset, the card comes from the box's own signals: a [simple](./simple-box.md) or
[grid](./grid-box.md) box takes it from a `label`, `toolbarActions` or `collapsible`; the collection
boxes ([list](./list-box.md), [array](./array-box.md), [object](./object-box.md),
[gallery](./gallery-box.md)) take it from the label alone. On top of that, **the view's first box
gets the card by default on a page**, so page content never floats on the background.

That default is handed down through layout. A first box that holds no fields of its own — a
[grid](./grid-box.md), a [tab](./tab-box.md) or a [wizard](./wizard-box.md), a bare
[simple](./simple-box.md) wrapper — draws no card and passes the default to its children, so the
card lands on the first box that actually holds content. A tab box and a wizard never hold fields
(field children are filtered out), so they always pass it on — unless the schema asks them for a
card, which they then draw like any other box, with the tab strip or stepper, its toolbar and the
footer inside it. A box that draws a card for any other
reason (a label, `card: true`) is that surface, and the hand-down stops there.

A "page" here means there is no card above the box. Every surface that *is* a card says so through
`InsidePanelContext`: `Panel` does it for each box and each dashboard widget, and `ViewDialog` /
`ViewSidePanel` declare it for their own overlay surface. A view rendered on any of them — a dialog,
the docked side panel, or a widget — therefore keeps its first box card-less, and no card ends up
inside a card.

## Common props

Every box component takes the same props (`SchemaBoxProps`); the generated views pass them for you.

| Name | Type | Default | Description |
|---|---|---|---|
| `schema` (required) | `BoxSchema` | — | The box to render |
| `label` | `string \| ReactElement \| false` | `schema.label` | `false` renders the box without a heading |
| `excludeFields` | `string[]` | — | Field names rendered elsewhere and to be skipped here |
| `isRequired` | `boolean` | — | Marks the box as required, used by the conditional rendering wrapper |
| `isRoot` | `boolean` | `false` | Marks the view's first box; only a root box takes the card default on a page |

## See also

- [Box provider](../providers/box-provider.md) — replacing a container with your own
- [Forms and layout](/concepts/guides/forms-and-layout) — arranging a form with boxes end to end
- [ViewSchema](../types-and-schemas/view-schema-and-action-schema.md) — where the box tree hangs off
- [Boxes on the Python side](/python/view-generators/form-schema-generators) / [on the Ruby side](/ruby/schema-and-field-customization/box-types-reference) — declaring them in the backend
