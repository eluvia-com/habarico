---
title: Field components
sidebar_position: 1
---

Field components display individual record values in list, show and edit views. You rarely mount
them by hand — [SchemaField](./schema-field.md) picks one from the field's `type` and `format`,
and a [FieldProvider](../providers/field-provider.md) can override that choice.

| Component                                                                                        | What it renders                                                                                        |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [SchemaField](./schema-field.md)                                                                 | Dispatcher — resolves `type` + `format` to one of the components below                                 |
| [TextField](./text-field.mdx)                                                                    | String values, with optional prefix/postfix and multiline wrapping                                     |
| [NumberField](./number-field.mdx)                                                                | Numbers with locale, currency and unit formatting                                                      |
| [DateField](./date-field.mdx)                                                                    | Dates and datetimes in the active locale                                                               |
| [TimeField](./time-field.mdx)                                                                    | A time of day, without a date                                                                          |
| [BooleanField](./boolean-field.mdx)                                                              | A yes/no chip                                                                                          |
| [ChoicesField](./choices-field.mdx)                                                              | An enum value as a colored chip                                                                        |
| [ImageField](./image-field.mdx)                                                                  | A thumbnail that expands into a full-size dialog                                                       |
| [PhoneNumberField](./phone-number-field.mdx)                                                     | A phone number in international format, with a country flag                                            |
| [SchemaRangeField](./range-field.mdx)                                                            | A lower–upper pair, unbounded ends shown as ∞                                                          |
| [SchemaObjectField](./object-field.mdx)                                                          | Nested object properties inside an object box                                                          |
| [SchemaObjectArrayField](./object-array-field.mdx)                                               | An array of objects inside an array box                                                                |
| [ChipArrayField](./chip-array-field.mdx)                                                         | An array of scalar values as chips                                                                     |
| [SchemaReferenceField](./reference-field.mdx)                                                    | A foreign key as a chip linking to the related record                                                  |
| [SchemaReferenceArrayField](./reference-array-field.mdx)                                         | An array of foreign keys as a row of linking chips                                                     |
| [RecordRepresentationChip](./record-representation-chip.mdx)                                     | The chip those two render, on its own — plus `SchemaRecordLink`                                        |
| [CzechBankAccountField](../input-components/czech-local-flavor-inputs.mdx#czechbankaccountfield) | A Czech bank account formatted as `prefix-account/bankCode`; picked for `format: "czech-bank-account"` |

## Common props

Every field component accepts these props (`FieldProps`); the per-component pages document only
what they add on top.

| Name                | Type                              | Default                        | Description                                                                    |
| ------------------- | --------------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `source` (required) | `string`                          | —                              | Name of the field on the record; dot notation reaches into nested objects      |
| `label`             | `string \| ReactElement \| false` | label from the schema          | `false` hides the label                                                        |
| `textLabel`         | `string`                          | —                              | Plain-text label used where a node cannot be rendered (e.g. the export header) |
| `shortLabel`        | `string \| ReactElement \| false` | —                              | Label used in narrow contexts such as datagrid columns                         |
| `showLabel`         | `boolean`                         | depends on the view            | Forces the label on or off                                                     |
| `sortable`          | `boolean`                         | `true` when the schema says so | Whether the list column can be sorted                                          |
| `sortBy`            | `string`                          | `source`                       | Field the backend sorts by when the column is clicked                          |
| `record`            | `RaRecord`                        | record from context            | Renders a record other than the one in context                                 |
| `isRequired`        | `boolean`                         | from the schema                | Marks the value as required in the layout                                      |
| `textAlign`         | `'left' \| 'right' \| 'center'`   | `'left'`                       | Horizontal alignment                                                           |
| `emptyText`         | `string`                          | —                              | Text shown when the value is empty                                             |
| `fullWidth`         | `boolean`                         | `false`                        | Stretches the field to the width of its container                              |
| `sx`                | `SxProps<Theme>`                  | —                              | MUI style override                                                             |
| `transform`         | `(value: unknown) => any`         | —                              | Maps the raw value before it is displayed                                      |

:::caution
`FieldProps` carries **no** `options` key. The field components take explicit props
(`numberFormat`, `prefix`, `postfix`, `choices`, `iconsKey`, …). For plain `string`/`number` fields
it is `FieldProvider`'s default implementation that reads the schema's `options` object and maps it
onto those props directly; fields that need more than options — `SchemaChoicesField`,
`SchemaReferenceField` — stay thin wrappers around the admin component. Each page's _Schema
options_ section states which key maps where.
:::

## See also

- [Input components](../input-components/index.md) — the form counterparts
- [FieldProvider](../providers/field-provider.md) — replacing a component for a given type/format
- [FieldSchema](../types-and-schemas/field-schema.md) — the schema these components read
