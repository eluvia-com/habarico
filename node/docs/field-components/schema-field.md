---
title: SchemaField
sidebar_position: 2
---

Renders one field of a record by resolving its schema to a concrete field component.

This is the component the generated views mount — reach for a specific field component only when
you build a layout by hand.

## Example

```tsx
<SchemaField
  schema={productSchema.fields.price}
  source="price"
  showLabel
/>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `schema` (required) | `FieldSchema` | — | Field schema; drives which component is rendered |
| `source` | `string` | `schema.name` | Overrides the path read from the record |
| `label` | `string \| ReactElement \| false` | `schema.label` | `false` hides the label |
| `showLabel` | `boolean` | `true` | Renders the label above/next to the value |
| `emptyText` | `string` | `'--'` | Text shown when the value is empty |
| `textAlign` | `'left' \| 'right' \| 'center'` | — | Horizontal alignment |

## What it does

1. Asks the active [FieldProvider](../providers/field-provider.md) for a component matching
   `schema.type`, `schema.format` and the current location (list vs. detail). When the provider
   returns nothing, `defaultFieldProvider` decides — its mapping is the table below.
2. Wraps the result in the label/layout shell.
3. Hides the field while `options.dynamicRender.showQuery` is false for the current record.
   Inside a schema layout the layout hides the field instead, so the space it takes goes with it:
   a detail row drops its label too, a datagrid cell stays and only its content goes.

:::tip
A field that renders nothing is usually a schema problem, not a component problem: the provider
returns `undefined` for combinations it has no component for — for example an `object` field with
no `properties`, or an `array` field with no `items`.
:::

## Schema mapping

The dispatch table below is `defaultFieldProvider`. `format` wins over `type`; unlisted formats
fall through to the type default.

| `type` | `format` | Component |
|---|---|---|
| `boolean` | — | [BooleanField](./boolean-field.mdx) |
| `number` | — | [NumberField](./number-field.mdx) (2–5 fraction digits) |
| `integer` | — | [NumberField](./number-field.mdx) (0 fraction digits) |
| `integer` / `string` | `relation`, `tree-relation` | [SchemaReferenceField](./reference-field.mdx) |
| `integer` / `string` | `choices` | [ChoicesField](./choices-field.mdx) |
| `string` | — | [TextField](./text-field.mdx) |
| `string` | `text` | [TextField](./text-field.mdx) (multiline) |
| `string` | `email` | `EmailField` |
| `string` | `url` | `UrlField` (links only `http`/`https`/relative values — see below) |
| `string` | `date` | [DateField](./date-field.mdx) |
| `string` | `date-time` | [DateField](./date-field.mdx) with `showTime` |
| `string` | `time` | `TimeField` |
| `string` | `rich-text` | React Admin `RichTextField` |
| `string` | `decimal` | [NumberField](./number-field.mdx) |
| `string` | `phone` | [PhoneNumberField](./phone-number-field.mdx) |
| `string` | `czech-bank-account` | `CzechBankAccountField` |
| `object` | `base64-image` | [ImageField](./image-field.mdx) on `<source>.url` |
| `object` | `base64-file` | React Admin `FileField` on `<source>.url` |
| `object` | `range` | [SchemaRangeField](./range-field.mdx) |
| `object` | — (detail views only) | [SchemaObjectField](./object-field.mdx) |
| `array` | items of type `object` (detail views only) | [SchemaObjectArrayField](./object-array-field.mdx) |
| `array` | items with a `reference` | `SchemaReferenceArrayField` |
| `array` | — | [ChipArrayField](./chip-array-field.mdx) |

In a list, `integer`, `decimal`, `date`, `date-time` and `time` default to `textAlign: 'right'`
unless `options.textAlign` says otherwise; a plain `number` field is left alone. An `object` field
without a special format, and an array of objects, render nothing in a list — put them in a show
or edit view.

A `url` field renders a link only when the stored value is an `http`/`https` or relative URL. Any
other scheme — a `javascript:` or `data:` value a user managed to save into the field — is shown
as plain text, so it stays readable and searchable but is not something an admin can click.

## See also

- [FieldProvider](../providers/field-provider.md) — overriding the mapping above
- [FieldSchema](../types-and-schemas/field-schema.md) — the schema this component consumes
- [SchemaInput](../input-components/schema-input.md) — the same dispatch for form inputs
