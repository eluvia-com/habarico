---
title: Box provider
sidebar_position: 15
---

Replaces the container a box schema is rendered with.

Boxes are the layout of a view: tabs, grids, arrays, galleries. Override one when a section needs
an arrangement the built-in boxes do not offer — a side-by-side comparison, a custom summary
panel above a list.

## Signature

```typescript
type AdminBoxProvider = (props: {
  resource?: string;
  schema: BoxSchema;
  excludeFields?: string[];
  props: SchemaBoxProps;
}) => ReactElement | undefined | null;
```

The resource-level provider receives the same object without `resource`.

## Parameters

| Name | Type | Description |
|---|---|---|
| `resource` | `string` | Resource the box belongs to; admin-wide provider only |
| `schema` | `BoxSchema` | The box; `schema.type` and `schema.name` are what you match on |
| `excludeFields` | `string[]` | Fields already rendered elsewhere and to be skipped here |
| `props` | `SchemaBoxProps` | `schema`, `label`, `excludeFields` and `isRequired` — spread them into your box |

## Returns

The element to render, `undefined` to let the next provider decide, or `null` to render nothing at
all. See
[how an override is resolved](./index.md#how-an-override-is-resolved).

## Box types

`defaultBoxProvider` handles these values of `schema.type`:

| `type` | Container |
|---|---|
| `tab` | [SchemaTabBox](../box-components/tab-box.md) — tabbed sections, with the open tab kept in the URL |
| `wizard` | [SchemaWizardBox](../box-components/wizard-box.md) — stepped form |
| `grid` | [SchemaGridBox](../box-components/grid-box.md) — responsive grid |
| `object` | [SchemaObjectBox](../box-components/object-box.md) — the properties of a nested object |
| `array` | [SchemaArrayBox](../box-components/array-box.md) — a repeatable list; an array with `array.listed` renders as `SchemaChoicesArrayBox` chips instead |
| `list` | [SchemaListBox](../box-components/list-box.md) — an embedded list of a related resource |
| `gallery` | [SchemaGalleryBox](../box-components/gallery-box.md) — an image carousel |
| anything else | [SchemaSimpleBox](../box-components/simple-box.md) — a plain stack of fields; this is where `simple` lands, and it is also the fallback for an unknown type |

`tab-item` never reaches the provider on its own — the parent `SchemaTabBox` consumes its own
children.

## Example

```tsx
<SchemaAdmin
  boxProvider={({schema, props}) => {
    if (schema.name === 'order-summary') {
      return <OrderSummaryBox {...props} />;
    }
  }}
>
  <SchemaResource name="eshop/order" />
</SchemaAdmin>
```

:::caution
A custom box has to honour `excludeFields`, otherwise a field already shown by another box appears
twice. Passing `props` through unchanged is enough — the built-in boxes read it from there.
:::

## See also

- [Box components](../box-components/index.md) — the containers you are replacing, in detail
- [Layout components](../layout-components/index.md) — the page shells the boxes render inside
- [Create/edit view boxes](/ruby/schema-and-field-customization/create-edit-view-boxes) — declaring boxes on the Ruby side
- [Form schema generators](/python/view-generators/form-schema-generators) — declaring boxes on the Python side
- [Forms and layout](/concepts/guides/forms-and-layout) — the box types you are replacing
