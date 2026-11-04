---
title: fieldDefaults
sidebar_position: 3
---

The shape each kind of field takes across a project, declared once instead of rebuilt in a
[fieldProvider](../providers/field-provider.md) override.

```tsx
<SchemaAdmin fieldDefaults={{reference: 'link', boolean: 'text', choices: 'text'}} ... />
```

No schema describes this. The backend says a field *is* a reference, a boolean or a choice; how it
looks is the application's own house style, so it is set on the admin rather than emitted by the
contract.

## The keys

| Key         | Type                              | Default  | Applies to                                                                     |
| ----------- | --------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `reference` | `'chip' \| 'link'`                | `'chip'` | [SchemaReferenceField](../field-components/reference-field.mdx), [SchemaReferenceArrayField](../field-components/reference-array-field.mdx) |
| `boolean`   | `'chip' \| 'text' \| 'icon'`      | `'chip'` | [BooleanField](../field-components/boolean-field.mdx)                          |
| `choices`   | `'chip' \| 'text'`                | `'chip'` | [ChoicesField](../field-components/choices-field.mdx), [ChipArrayField](../field-components/chip-array-field.mdx) |

A key you leave out keeps the library's default, so an admin with no `fieldDefaults` at all looks
exactly as it did before the prop existed.

### Why a key per kind, and not one value for all of them

A reference's `'link'` means nothing to a boolean, and a single switch spanning both would have to
be named for the vaguest of them. The record also makes growth safe: when a later version teaches
another kind of field a second shape, it arrives as a **new key nobody has set**, so a version bump
cannot quietly change how an existing project looks.

## Where it can be set

```tsx
<SchemaAdmin fieldDefaults={{reference: 'link', choices: 'text'}}>
  {/* Inherits `reference: 'link'`, overrides `choices` */}
  <SchemaResource name="eshop/order" fieldDefaults={{choices: 'chip'}} />
</SchemaAdmin>
```

Resolved nearest-first, key by key:

1. the field's own `variant` prop
2. the nearest `SchemaResource` `fieldDefaults`
3. `SchemaAdmin` `fieldDefaults`
4. the library default, `'chip'`

A resource **merges** with the admin rather than replacing it: naming one key keeps the
application's choice for the others.

Because the prop wins over the context, `fieldDefaults` composes with a `fieldProvider` instead of
competing with it — a provider that returns `<SchemaReferenceField variant="chip" />` keeps its
chip inside an admin that asked for links.

## Two shapes that are not the whole story

Most of the time a shape is just a look. Twice it is not, and the field decides rather than
obeying:

- **`choices: 'text'` keeps the chips of a colored enum.** A chip of a colored option *carries* the
  color; plain text cannot. The test is run over the whole option list, not per value, so one field
  never mixes chips and bare words down a column. An enum with no color of its own (or only
  `'inherit'`) renders as text.
- **`boolean: 'icon'` draws a glyph inside a collection only.** A tick buys back a column's width,
  which is scarce in a list and free in a detail view, where the word reads better than the symbol.
  Outside a collection it resolves to `'text'`. This mirrors `EnumChip`, which likewise collapses to
  a bare glyph only in a collection.

## Hand-assembled admin screens

`fieldDefaults` is a schema-layer feature. The admin-layer fields read it only where a schema
wrapper hands it to them (`SchemaBooleanField`, `SchemaChoicesField`, `SchemaChipArrayField`, the
two reference fields), which is what the generated views use. A screen you assemble yourself out of
admin components states the shape on the component:

```tsx
<AdminDatagrid>
  <BooleanField source="is_paid" variant="icon" />
  <ReferenceField source="customer_id" reference="eshop/customer">
    <RecordRepresentation variant="link" />
  </ReferenceField>
</AdminDatagrid>
```

The admin layer may not reach into the schema layer (the `boundaries/dependencies` lint rule), and
that is the point: those components take no schema and make no schema-driven decisions.

## See also

- [SchemaAdmin](./schema-admin.md) — every admin-wide prop
- [SchemaResource](./schema-resource.md) — the per-resource overrides
- [fieldProvider](../providers/field-provider.md) — for a shape one field needs and the defaults cannot express
- [Context hooks](../hooks/context-hooks.md) — `useFieldDefaults`, for a component of your own
