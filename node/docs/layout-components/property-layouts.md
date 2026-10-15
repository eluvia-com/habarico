---
title: Property layouts
sidebar_position: 11
---

Label + value rows — the way a generated detail and a generated form lay their fields out.

`PropertyShowLayout` takes field components, `PropertyFormLayout` takes inputs. Each child becomes
one row; non-element children are ignored.

## Example

```tsx
import {PropertyShowLayout, TextField, NumberField} from '@eluvia/habarico';

<PropertyShowLayout columns={2} density="standard" labelWidth={180}>
  <TextField source="number" />
  <NumberField source="total" />
</PropertyShowLayout>
```

```tsx
import {PropertyFormLayout, TextInput, NumberInput} from '@eluvia/habarico';

<PropertyFormLayout columns={1}>
  <TextInput source="name" />
  <NumberInput source="price" />
</PropertyFormLayout>
```

## Conditional inputs

`PropertyFormLayout` builds each row from the input it is given, so an input that depends on other
form values can be written either way: behind a condition, or inside a `FormDataConsumer`. Whatever
the consumer returns is laid out like direct children — one input, several, or a fragment each get
their rows — and a consumer that returns nothing renders no row.

```tsx
import {FormDataConsumer} from 'react-admin';
import {PropertyFormLayout, NumberInput, TextInput} from '@eluvia/habarico';

<PropertyFormLayout>
  <TextInput source="name" />
  <FormDataConsumer>
    {({formData}) => formData.on_sale && <NumberInput source="sale_price" />}
  </FormDataConsumer>
</PropertyFormLayout>
```

A fragment gives each input inside it a row. Any other wrapper component is read as if it were the
input: its own `source` and `label` props label the row, so give it those or put the condition
outside it.

## Props

Both components forward the same subset of `PropertyList`:

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | Field elements (show) or input elements (form) |
| `columns` | `number` | `1` | Value columns from `sm` up; always one on `xs`. One column gives wide inline rows, two give narrow stacked cells |
| `columnGap` | `number` | `4` | Horizontal gap between columns, in theme spacing units |
| `rowGap` | `number` | derived from `density` | Vertical gap between rows; overrides `density` |
| `density` | `'compact' \| 'standard' \| 'comfortable'` | `'compact'` | Row density — the same vocabulary as the datagrid, so a global density setting passes straight through |
| `lineHeight` | `PropertyLineHeight` | `smallField` (show) / `smallInput` (form) | Minimum height each horizontal row reserves, so rows whose values render differently — a text value, a chip — keep one height, and a value shorter than the row stays centered against its label. The presets pair with what the row renders: `smallField` (28px) / `mediumField` (40px) for a value, `smallInput` (40px) / `mediumInput` (56px) for a control. A number is px, a string any CSS length |
| `labelWidth` | `number \| string` | — | Label column width — a number is px, a string is any CSS length |
| `orientation` | `PropertyOrientation` | `auto` | Forces the label beside (`horizontal`) or above (`vertical`) the value |
| `emptyMessage` | `ReactNode` | — | Muted message when there are no rows; without it an empty list renders nothing |
| `sx` | `SxProps<Theme>` | — | MUI style override |

`density` cascades into nested property lists, and is ignored when `rowGap` is set explicitly.

`lineHeight` is a *minimum*, and applies only where the label sits beside the value. A value taller
than the row — a textarea, rich text, an image — keeps its own height, and a stacked
(label-above-value) row ignores it entirely.

## See also

- [ShowShell](./show-shell.md) — the detail shell to put a show layout in
- [EditShell and CreateShell](./edit-and-create-shell.md) — the form shells for a form layout
- [Box components](../box-components/index.md) — the schema-driven equivalents
