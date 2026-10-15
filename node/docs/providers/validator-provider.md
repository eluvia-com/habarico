---
title: Validator provider
sidebar_position: 10
---

Maps a validation rule the backend put in the schema to the validator that enforces it in the form.

Use it when the backend introduces a rule type the library does not know, or when a built-in rule
needs a different check than the default one. Everything else about validation is automatic: rules
declared on the backend field ([Python](/python/basic-usage/admin-fields#validation-rules-in-the-schema))
travel in `options.validators` and are applied to the generated input without any wiring here.

## Signature

```typescript
type AdminValidatorProvider = (props: {
  rule: ValidatorRule;
  source: string;
  resource?: string;
}) => Validator | undefined | null;
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `rule` | `ValidatorRule` | The rule to map — its `type`, `value` and optional `message` |
| `source` | `string` | Field the rule belongs to |
| `resource` | `string` | Resource the field belongs to |

`ValidatorRule` is documented with the
[field schema](../types-and-schemas/field-schema.md#validation-rules).

## Returns

A react-admin `Validator` to handle the rule, `undefined` to defer to `defaultValidatorProvider`,
or `null` to suppress the rule so no validator runs for it.

:::caution
Unlike the field, input, button and box providers, this one exists **only admin-wide** — there is
no `validatorProvider` prop on [SchemaResource](../base-components/schema-resource.md). Branch on
`resource` inside the provider to make a rule behave differently for one resource.
:::

## Built-in mapping

`defaultValidatorProvider` handles the five rule types of the contract:

| `rule.type` | Validator | `rule.value` |
|---|---|---|
| `max_length` | `maxLength` | `number` |
| `min_length` | `minLength` | `number` |
| `max_value` | `maxValue` | `number` |
| `min_value` | `minValue` | `number` |
| `regex` | — | `string` — the pattern |

`rule.message` becomes the error text; without it react-admin's generic translation is used, and
for `regex` the translation of `ra.validation.invalid_format` ("Invalid format"). All five ignore
an empty value — presence stays the job of the field's `required` flag, which the generated input
applies on its own.

:::caution
A `regex` pattern that JavaScript cannot compile (a Python-only construct, for instance) is skipped
with a `console.warn` and left to backend validation, so the form submits and the server rejects it.
Keep patterns to syntax both languages share.

A value longer than 1000 characters is not matched against the pattern either. Matching backtracks
super-linearly on a long input for patterns as ordinary as `^a*a*$`, and the server enforces the
rule regardless.
:::

:::warning
The pattern the schema declares is what the browser runs, so an ambiguous one is the schema
author's responsibility. `^(\w+\s?)*$` and its relatives — a repeated group whose body can itself
repeat — take minutes to reject a value 30 characters long, on every keystroke that triggers
validation, and there is no way for the frontend to interrupt a match already running. The flat
equivalent, `^\w+( \w+)*$`, matches the same values and stays fast because a space is mandatory
between the repeats. Both the frontend and the backend run this pattern, so writing it
unambiguously helps twice over.
:::

## Example

A rule type the library does not know — the backend marks the SKU field with `sku_format`:

```tsx
<SchemaAdmin
  validatorProvider={({rule}) => {
    if (rule.type === 'sku_format') {
      return (value) => (isValidSku(value) ? undefined : rule.message ?? 'Invalid SKU');
    }
  }}
>
  <SchemaResource name="eshop/product" />
</SchemaAdmin>
```

Overriding a built-in rule for one resource, and suppressing another one entirely:

```tsx
<SchemaAdmin
  validatorProvider={({rule, resource, source}) => {
    if (resource === 'eshop/product' && source === 'description' && rule.type === 'max_length') {
      return maxLength(rule.value as number, 'Product descriptions are capped at %{max} characters');
    }
    // The catalogue import writes prices the frontend must not block.
    if (resource === 'eshop/price-import' && rule.type === 'max_value') {
      return null;
    }
  }}
>
  …
</SchemaAdmin>
```

## When the rules run

The generated form validates on blur, so a rule reports as soon as the field loses focus. To go
back to validating on submit, pass `mode="onSubmit"` to
[FormShell](../layout-components/form-shell.md).

## See also

- [Field schema](../types-and-schemas/field-schema.md#validation-rules) — `ValidatorRule` and `options.validators`
- [SchemaAdmin](../base-components/schema-admin.md) — where the provider is passed
- [FormShell](../layout-components/form-shell.md) — when validation runs
- [Admin fields](/python/basic-usage/admin-fields#validation-rules-in-the-schema) — how the backend emits the rules
