---
title: SchemaArrayBox
sidebar_position: 8
---

A repeatable group of fields — the rows of an order, the variants of a product — stored as an array
on the parent record.

Use it for data written together with the parent through a nested serializer. When the rows are a
resource of their own with their own endpoints, use [SchemaListBox](./list-box.md).

## Example

```python
EditViewSchemaGenerator(box=Box(boxes=[
    Box(label="Order", boxes=["number", "customer"]),
    ArrayBox(
        label="Items",
        target="items",
        inline=True,
        boxes=["product", "quantity", "unit_price"],
    ),
]))
```

## Schema fields

Under `schema.array` (`ArrayBoxParameters`):

| Field | Type | Default | Description |
|---|---|---|---|
| `target` (required) | `string` | — | Name of the array field on the parent record |
| `inline` | `boolean` | `false` | Renders the items as table-like rows instead of stacked groups |
| `listed` | `ListedOptions` | — | Switches to one checkbox row per enum value — see below |

Plus the common `label`, `card`, `toolbarActions` and `bottomActions`. The box renders as a card
when it has a label or `card: true`, as a bare container otherwise — and `card: false` keeps it bare
even with a label. See [Card frame](./index.md#card-frame) for the third state.

## Read-only and writeable

The box picks its rendering from the view and the field schema — a read-only view, or a
`readOnly` target field, gives the read-only variant:

| Variant | Rendering |
|---|---|
| Writeable, `inline: false` | A form iterator with add/remove buttons; each item's inputs as stacked property rows |
| Writeable, `inline: true` | The same iterator, but the inputs sit side by side — one table-like row per item |
| Read-only, `inline: false` | Stacked property rows per item (`SchemaMultipleFieldList`) |
| Read-only, `inline: true` | A datagrid of the items |

Nothing renders when the target field is missing from the schema or has no `items.properties` — an
array box always needs an object array behind it.

## The `listed` variant

When `array.listed` is set, the box provider picks `SchemaChoicesArrayBox` instead. Rather than
starting empty and growing as the user adds items, the box renders **one row per enum value**:

| Field | Type | Description |
|---|---|---|
| `listed.fieldName` (required) | `string` | Property of the item holding the enum value; its field schema must carry an `enum` |
| `listed.otherValues` | `(string \| number)[]` | Enum values kept out of the fixed rows — those stay addable as free rows |

Every choice of the enum except the `otherValues` gets a row of its own, pre-filled when the record
already has an item for it. The remaining values are what the Add button offers. Nothing renders
when `fieldName` is missing or its field schema has no `enum`.

The box renders on the same surface as the plain array box — a card with its label in the header,
or the card-less container when `card: false` — so a checklist sits on a detail view like every
other box.

Rows render through the same `FormTable` row layout used elsewhere for editable arrays, so the row
count and the Add / Clear list footer behave the same way — "Clear list" unchecks every enum row
and drops all free rows.

An enum row carries no delete action: its checkbox is what adds and removes the value, and a second
control doing the same thing beside it only invites the question of how the two differ. Free rows
(the `otherValues` ones) have no checkbox of their own, so those keep it.

Clicking an enum row anywhere ticks it, the same as clicking its checkbox — the row's hover
highlight already reads as clickable, and while a row is unticked its inputs are disabled, so the
whole card is dead space the user has no other reason to click. A ticked row's inputs are live and
keep their own clicks, so a half-typed value cannot be dropped by a stray click while it is being
edited; a click on that row's remaining surface unticks it. Free rows have nothing to toggle and
ignore the gesture.

In a read-only view the `listed` variant falls back to the plain array box.

## See also

- [SchemaArrayInput](../input-components/array-input.mdx) / [SchemaObjectArrayInput](../input-components/object-array-input.mdx) — the inputs used inside
- [SchemaObjectBox](./object-box.md) — a single nested object instead of a list of them
- [SchemaListBox](./list-box.md) — rows that are their own resource
- [Nested serializers](/python/basic-usage/nested-serializers) — writing the array on the Python side
