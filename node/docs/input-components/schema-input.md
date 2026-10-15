---
title: SchemaInput
sidebar_position: 2
---

Renders one form field by resolving its schema to a concrete input component.

This is the component the generated forms mount. Reach for a specific input only when you build a
form by hand or override one field.

## Example

```tsx
<SchemaInput
  schema={productSchema.fields.price}
  source="price"
/>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `schema` (required) | `FieldSchema` | — | Field schema; drives which input is rendered |
| `source` | `string` | `schema.name` | Name of the field in the form record |
| `label` | `string \| ReactElement \| false` | `schema.label` | `false` hides the label |
| `helperText` | `string \| ReactElement \| false` | `schema.helpText` | Text under the input |
| `readOnly` | `boolean` | from the view | Renders the value read-only instead of an input |
| `showLabel` | `boolean` | `true` | Renders the label |
| `defaultValue` | `string \| boolean \| number` | — | Currently has no effect — the value is not forwarded to the input. Create-form defaults come from the form itself, which collects every `schema.defaultValue` into its default values |
| `disabled` | `boolean` | `false` | Disables the input while keeping it in the form |
| `record` | `RaRecord` | record from context | Renders a record other than the one in context |
| `onChange` | `() => void` | — | Called after the value changes |
| `hiddenEl` | `ReactElement` | — | Rendered in place of the input when `dynamicRender.showQuery` hides it |

## What it does

1. Picks read-only or editable content — a read-only field renders through the field components,
   not the inputs.
2. Asks the active [InputProvider](../providers/input-provider.md) for a component matching
   `schema.type` and `schema.format`; `defaultInputProvider` is the fallback.
3. Evaluates `options.dynamicRender` against the form's current values: `showQuery` hides the
   input (rendering `hiddenEl` in its place) and `requiredQuery` makes it required. Inside a schema
   layout the layout hides the input instead, so the space it takes goes with it: a detail row drops
   its label too, a datagrid cell stays and only its content goes.
4. Attaches the field's validators: `required()` when the schema says so, plus one validator per
   rule in [`options.validators`](../types-and-schemas/field-schema.md#validation-rules), resolved
   through the [validator provider](../providers/validator-provider.md).

## Schema mapping

The dispatch table below is `defaultInputProvider`. `format` wins over `type`.

| `type` | `format` | Input |
|---|---|---|
| `boolean` | — | [BooleanInput](./boolean-input.mdx), or `TriStateBooleanInput` in a filter |
| `number` | — | [NumberInput](./number-input.mdx) (2–5 fraction digits) |
| `integer` | — | [NumberInput](./number-input.mdx) (0 fraction digits) |
| `integer` / `string` | `relation`, `tree-relation` | [SchemaReferenceInput](./reference-input.mdx) |
| `integer` / `string` | `choices` | [ChoicesInput](./choices-input.mdx) |
| `string` | — | [TextInput](./text-input.mdx) |
| `string` | `text` | [TextInput](./text-input.mdx) (multiline) |
| `string` | `email`, `url`, `password` | [TextInput](./text-input.mdx) with the matching HTML input type |
| `string` | `date` / `date-time` / `time` | [DateInput / DateTimeInput](./date-input-and-date-time-input.mdx), `TimeInput` |
| `string` | `rich-text` | `RichTextInput` from `ra-input-rich-text` |
| `string` | `decimal` | [NumberInput](./number-input.mdx) |
| `string` | `phone` | [PhoneNumberInput](./phone-number-input.mdx) |
| `string` | `search` | React Admin `SearchInput` |
| `string` | `ai`, `ai-text` | [SchemaPredictiveTextInput](./predictive-text-input.mdx) |
| `string` | `czech-*` | [Czech local flavor inputs](./czech-local-flavor-inputs.mdx) |
| `object` | `base64-image` | [UploadInput](./upload-input.mdx) with an image preview, `maxFiles: 1` |
| `object` | `base64-file` | [UploadInput](./upload-input.mdx), `maxFiles: 1` |
| `object` | `range` | [DateRangeInput](./date-range-input.mdx) when both bounds are dates, otherwise [SchemaRangeInput](./range-input.mdx) |
| `object` | — (with `properties`) | [SchemaObjectInput](./object-input.mdx) |
| `array` | items `base64-image` / `base64-file` | [UploadInput](./upload-input.mdx) in multi-file mode |
| `array` | items of type `object` | [SchemaObjectArrayInput](./object-array-input.mdx) |
| `array` | — | [SchemaArrayInput](./array-input.mdx) |

:::tip
A field that renders no input usually has a schema the provider cannot resolve — an `object`
without `properties`, or an `array` without `items`.
:::

## See also

- [InputProvider](../providers/input-provider.md) — overriding the mapping above
- [SchemaField](../field-components/schema-field.md) — the same dispatch for display
- [FieldSchema](../types-and-schemas/field-schema.md) — the schema this component consumes
