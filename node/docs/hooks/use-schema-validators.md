---
title: useSchemaValidators
sidebar_position: 14
---

Resolves a field schema's validation rules into react-admin validators.

Use it in an input you supply through the [input provider](../providers/input-provider.md): the
generated inputs apply the schema's rules on their own, a hand-written one has to ask for them, or
the backend's `max_length` silently stops being enforced in the browser.

## Signature

```typescript
const getValidators: (schema: FieldSchema) => Validator[] = useSchemaValidators();
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `schema` | `FieldSchema` | The field's schema — the rules are read from `options.validators` |

## Returns

An array of validators, one per rule the provider chain resolved, in schema order. A field without
`options.validators` yields an empty array.

Each rule goes through the admin's `validatorProvider` first and falls back to
`defaultValidatorProvider` — see [Validator provider](../providers/validator-provider.md) for the
mapping and the three possible answers.

## Example

```tsx
const SkuInput = ({schema, props}: {schema: FieldSchema; props: InputProps}) => {
  const getValidators = useSchemaValidators();

  return (
    <TextInput
      {...props}
      validate={[...(schema.required ? [required()] : []), ...getValidators(schema)]}
    />
  );
};

<SchemaAdmin inputProvider={({format, schema, props}) => (format === 'sku' ? <SkuInput schema={schema} props={props} /> : undefined)}>
  <SchemaResource name="eshop/product" />
</SchemaAdmin>;
```

`required` is separate on purpose: it comes from the field's `required` flag, not from
`options.validators`, and the rule validators all pass on an empty value.

:::tip
Only the resolution needs React. `buildSchemaValidators(schema, defaultProvider, provider, resource)`
is the same logic as a pure function — useful in a test, or anywhere outside a component.
:::

## See also

- [Validator provider](../providers/validator-provider.md) — the mapping this hook runs
- [Field schema](../types-and-schemas/field-schema.md#validation-rules) — where the rules live
- [Input provider](../providers/input-provider.md) — the seam this hook belongs to
