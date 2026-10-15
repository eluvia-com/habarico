---
title: SchemaObjectBox
sidebar_position: 9
---

Renders the properties of a nested object as if they were fields of the parent — a shipping address
inside an order, a specification inside a product.

Use it when a `has-one` relation or an embedded object should be edited on the parent's form.
For a list of such objects use [SchemaArrayBox](./array-box.md).

## Example

```python
EditViewSchemaGenerator(box=Box(boxes=[
    Box(label="Order", boxes=["number", "customer"]),
    ObjectBox(
        label="Shipping address",
        target="shipping_address",
        boxes=["street", "city", "postal_code", "country"],
    ),
]))
```

## Schema fields

| Field | Type | Default | Description |
|---|---|---|---|
| `object.target` (required) | `string` | — | Name of the object field on the parent record |
| `boxes` | `BoxItem[]` | `[]` | Properties of the object, named without the `target.` prefix |
| `label` | `string` | — | Section heading; on its own it turns the card frame on |
| `card` | `boolean \| null` | `null` | Three-state card frame — see [Card frame](./index.md#card-frame) |
| `toolbarActions` / `bottomActions` | `ActionDescriptor[]` | — | The usual header and bottom slots |

## Behaviour

- The box installs a `SourceContext` that prefixes every child's source with the target, so a child
  declared as `city` binds to `shipping_address.city`. Write the children with their plain names.
- Read-only views, and a target field marked `readOnly` in the schema, render the display variant;
  everything else renders inputs.
- The writeable variant adds **add** and **remove** buttons: an optional object starts absent, the
  add button seeds it with the box's default values, and remove clears it back to null.
- Nothing renders when `object.target` is missing, or when the target field has no `properties` in
  the field schema.

:::caution
The children must exist in the target's `properties`, not in the parent's field list. A property
that the backend does not expose on the nested object is silently skipped.
:::

## See also

- [SchemaObjectInput](../input-components/object-input.mdx) / [SchemaObjectField](../field-components/object-field.mdx) — the single-field equivalents
- [SchemaArrayBox](./array-box.md) — many objects instead of one
- [Nested serializers](/python/basic-usage/nested-serializers) — exposing the object on the Python side
