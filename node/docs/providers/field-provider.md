---
title: Field provider
sidebar_position: 6
---

Replaces the component that displays a field.

Use it when a value needs a presentation the built-in fields do not have — a stock level shown as
a traffic light, a status with a custom badge. To change a *form* input, use the
[InputProvider](./input-provider.md) instead.

## Signature

```typescript
type AdminFieldProvider = (props: {
  resource?: string;
  source: string;
  type: FieldType;
  format?: FieldFormatType;
  isInList?: boolean;
  schema?: FieldSchema;
  locale?: string;
  props: FieldProps;
}) => ReactElement | undefined | null;
```

The resource-level provider receives the same object without `resource`.

## Parameters

| Name | Type | Description |
|---|---|---|
| `resource` | `string` | Resource the field belongs to; admin-wide provider only |
| `source` | `string` | Field path on the record |
| `type` | `FieldType` | JSON type from the schema |
| `format` | `FieldFormatType` | Format from the schema, when it has one |
| `isInList` | `boolean` | `true` in a datagrid cell — the place where compact rendering matters |
| `schema` | `FieldSchema` | The field's full schema, including `enum` and `options` |
| `locale` | `string` | Active admin locale |
| `props` | `FieldProps` | Props Habarico prepared — spread them into your component |

## Returns

The element to render, `undefined` to let the next provider decide, or `null` to render nothing at
all. See
[how an override is resolved](./index.md#how-an-override-is-resolved).

## Example

Admin-wide, for one format introduced by the backend:

```tsx
<SchemaAdmin
  fieldProvider={({format, schema, props}) => {
    if (format === 'stock-level') {
      return <StockLevelField {...props} thresholds={schema?.options} />;
    }
  }}
>
  <SchemaResource name="eshop/product" />
</SchemaAdmin>
```

Per resource, for a single field:

```tsx
<SchemaResource
  name="eshop/product"
  fieldProvider={({source, props}) => {
    if (source === 'rating') {
      return <StarsField {...props} />;
    }
  }}
/>
```

:::caution
Spread `props` into your component. It carries the label, the record, the alignment and the empty
text that the surrounding layout expects; a component that ignores them renders correctly in
isolation and wrongly inside a datagrid.
:::

### Rendering references as text

The reference fields render the record they point at as a chip. To render every reference in the
project as a text link instead, hand them `variant="link"` — the two branches below are the
whole override, because anything this provider does not claim falls through to the default one:

```tsx
<SchemaAdmin
  fieldProvider={({type, format, schema, props}) => {
    if (format === 'relation' || format === 'tree-relation') {
      return (
        <SchemaReferenceField
          variant="link"
          reference={schema?.reference}
          targetSource={schema?.targetSource}
          options={schema?.options}
          {...props}
        />
      );
    }
    if (type === 'array' && schema?.items?.reference) {
      return (
        <SchemaReferenceArrayField variant="link" items={schema.items} {...props} />
      );
    }
  }}
>
  <SchemaResource name="eshop/product" />
</SchemaAdmin>
```

Both branches mirror `defaultFieldProvider`'s own, so nothing but the look changes: the query, the
field selection, the width cap in a datagrid and the schema's say over which view opens stay the
field's. See
[RecordRepresentation](../field-components/record-representation.mdx) for the form itself.

## Default mapping

When no provider claims a field, `defaultFieldProvider` decides — its table is on the
[SchemaField](../field-components/schema-field.md#schema-mapping) page.

## See also

- [SchemaField](../field-components/schema-field.md) — the dispatcher that calls this provider
- [Field components](../field-components/index.md) — what you are replacing
- [InputProvider](./input-provider.md) — the same seam for form inputs
- [Custom field type end to end](/concepts/guides/custom-field-type) — a worked example of this seam
