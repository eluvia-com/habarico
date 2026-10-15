---
title: Input components
sidebar_position: 1
---

Input components collect values in create, edit and filter forms. You rarely mount them by hand —
[SchemaInput](./schema-input.md) picks one from the field's `type` and `format`, and an
[InputProvider](../providers/input-provider.md) can override that choice.

| Component | What it collects |
|---|---|
| [SchemaInput](./schema-input.md) | Dispatcher — resolves `type` + `format` to one of the components below |
| [TextInput](./text-input.mdx) | Single-line or multiline text, with prefix/postfix adornments |
| [NumberInput](./number-input.mdx) | A number, parsed and formatted for the active locale |
| [DateInput and DateTimeInput](./date-input-and-date-time-input.mdx) | A date or a date and time, via a MUI X picker |
| [TimeInput](./time-input.mdx) | A time of day, stored as `HH:MM:SS` |
| [DateRangeInput](./date-range-input.mdx) | A date range, picked in a calendar popover |
| [BooleanInput](./boolean-input.mdx) | A switch — a tri-state toggle when used as a filter |
| [ChoicesInput](./choices-input.mdx) | One value from an enum, as a dropdown |
| [UploadInput](./upload-input.mdx) | Files and images, base64 or chunked |
| [PhoneNumberInput](./phone-number-input.mdx) | A phone number with a country selector |
| [SchemaObjectInput](./object-input.mdx) | The properties of a nested object |
| [SchemaObjectArrayInput](./object-array-input.mdx) | A repeatable list of objects |
| [SchemaArrayInput](./array-input.mdx) | An array of scalars, enum values or references |
| [SchemaReferenceInput](./reference-input.mdx) | A related record, via autocomplete — or [a checkbox tree](./reference-input.mdx#picking-from-a-hierarchy-treearrayinput) for a hierarchy |
| [SchemaRangeInput](./range-input.mdx) | A lower/upper pair of any input type |
| [SchemaPredictiveTextInput](./predictive-text-input.mdx) | Text with AI suggestions accepted by <kbd>Tab</kbd> |
| [Czech local flavor inputs](./czech-local-flavor-inputs.mdx) | IČO, DIČ, birth number, ID card number, bank account |

## Common props

Every input accepts these props (`InputProps`); the per-component pages document only what they
add on top.

| Name | Type | Default | Description |
|---|---|---|---|
| `source` (required) | `string` | — | Name of the field in the form record |
| `label` | `string \| ReactElement \| false` | label from the schema | `false` hides the label |
| `helperText` | `string \| ReactElement \| false` | `helpText` from the schema | Text under the input; `false` removes the reserved space |
| `validate` | `Validator \| Validator[]` | from the schema | React Admin validators |
| `isRequired` | `boolean` | from the schema | Marks the input required |
| `size` | `'small' \| 'medium'` | `'small'` | MUI input size |
| `fullWidth` | `boolean` | depends on the box | Stretches the input to its container |
| `alwaysOn` | `boolean` | `false` | Filter inputs only — keeps the filter visible without adding it first |
| `defaultValue` | `string \| boolean \| number` | `defaultValue` from the schema | Initial value in a create form |
| `placeholder` | `string` | — | Placeholder text |
| `disabled` | `boolean` | `false` | Disables the input while keeping it in the form |
| `readOnly` | `boolean` | `false` | Renders the value without allowing edits |
| `className` | `string` | — | Class applied to the input wrapper |
| `sx` | `SxProps<Theme>` | — | MUI style override |

:::caution
`InputProps` carries **no** `options` key. The input components take explicit props
(`numberFormat`, `prefix`, `postfix`, `choices`, `iconsKey`, `accept`, `maxFiles`, …); it is
`InputProvider`'s default implementation that reads the schema's `options` object and maps it onto
those props before rendering the component directly. Each page's *Schema options* section states
which key maps where.
:::

## See also

- [Field components](../field-components/index.md) — the display counterparts
- [InputProvider](../providers/input-provider.md) — replacing a component for a given type/format
- [Property layouts](../layout-components/property-layouts.md) — how inputs are arranged into a form
