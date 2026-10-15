---
title: Input provider
sidebar_position: 9
---

Replaces the component that collects a field's value in a form.

Use it for an input the library does not ship — a colour picker, a map location, or an existing
input wired to something extra (the ARES lookup in
[CzechIcoInput](../input-components/czech-local-flavor-inputs.mdx#filling-a-form-from-ares) is
exactly this case).

## Signature

```typescript
type AdminInputProvider = (props: {
  resource?: string;
  source: string;
  type: FieldType;
  format?: FieldFormatType;
  schema?: FieldSchema;
  locale?: string;
  isFilter?: boolean;
  props: InputProps;
}) => ReactElement | undefined | null;
```

The resource-level provider receives the same object without `resource`.

## Parameters

| Name | Type | Description |
|---|---|---|
| `resource` | `string` | Resource the field belongs to; admin-wide provider only |
| `source` | `string` | Field path in the form record |
| `type` | `FieldType` | JSON type from the schema |
| `format` | `FieldFormatType` | Format from the schema, when it has one |
| `schema` | `FieldSchema` | The field's full schema, including `enum` and `options` |
| `locale` | `string` | Active admin locale |
| `isFilter` | `boolean` | `true` when the input is rendered in a filter, not in a form |
| `props` | `InputProps` | Props Habarico prepared — spread them into your component |

## Returns

The element to render, `undefined` to let the next provider decide, or `null` to render nothing at
all. See
[how an override is resolved](./index.md#how-an-override-is-resolved).

## Example

```tsx
<SchemaAdmin
  inputProvider={({format, props}) => {
    if (format === 'czech-ico') {
      return <IcoInput {...props} />;   // CzechIcoInput plus an onAresDataLoaded handler
    }
  }}
>
  <SchemaResource name="eshop/customer" />
</SchemaAdmin>
```

:::tip
`isFilter` is what lets one override behave differently in a filter — a filter needs a
“don't care” state that a form input does not. `defaultInputProvider` uses it exactly once, to
swap the boolean checkbox for a tri-state toggle.
:::

## Default mapping

When no provider claims a field, `defaultInputProvider` decides — its table is on the
[SchemaInput](../input-components/schema-input.md#schema-mapping) page.

## See also

- [SchemaInput](../input-components/schema-input.md) — the dispatcher that calls this provider
- [Input components](../input-components/index.md) — what you are replacing
- [FieldProvider](./field-provider.md) — the same seam for display
- [Custom field type end to end](/concepts/guides/custom-field-type) — a worked example of this seam
