---
title: useRemoveArrayItem
sidebar_position: 15
---

Removes a row from a field array and keeps the form's default values aligned with the shortened
array.

Use it in place of `remove` whenever you build your own container over a field array — a custom
editor for `Order.items`, a picker that renders rows its own way. The built-in
[SchemaArrayBox](../box-components/array-box.md) and `FormArrayInput` already call it, so a
generated form needs nothing from you.

## Signature

```tsx
import {useRemoveArrayItem} from '@eluvia/habarico';
import {useArrayInput} from 'react-admin';

const {fields, remove} = useArrayInput();
const removeRow = useRemoveArrayItem(remove);

removeRow(2); // instead of remove(2)
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `remove` (required) | `(index: number) => void` | — | The field array's own remove, from `useArrayInput()` or `useFieldArray()` |

## Returns

| Type | Description |
|---|---|
| `(index: number) => void` | Drop-in replacement for `remove` — removes the row, then re-seeds the array's default values without it |

## Example

```tsx
const OrderItems = () => {
  const {fields, remove} = useArrayInput();
  const removeRow = useRemoveArrayItem(remove);

  return (
    <ul>
      {fields.map((field, index) => (
        <li key={field.id}>
          <TextInput source={`items.${index}.sku`} />
          <NumberInput source={`items.${index}.quantity`} />
          <button type="button" onClick={() => removeRow(index)}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
};
```

:::caution
Removing a row through react-hook-form's own `remove` alone corrupts the record. `useFieldArray`
re-indexes the values, the registered fields, the errors and the touched flags — but not the
default values, and paths inside an array are positional. After the removal,
`items.<i>.<field>` in the defaults still describes the row that used to sit at that index, and
react-hook-form resolves an unset value as `get(values, name, get(defaultValues, name))`. So the
first optional field the user left empty is back-filled from the deleted row and saved with the
record: delete the row above an item with no note, and that item inherits the note of the deleted
one. This hook re-seeds the defaults with the same row dropped, a defaults-only update that leaves
the values, the dirty state and the errors where they were.
:::

## See also

- [SchemaArrayBox](../box-components/array-box.md) — the generated array editor, which already uses it
- [SchemaArrayInput](../input-components/array-input.mdx) — the input rendered inside those rows
- [useSubmitForm](./use-submit-form.md) — submitting the form the rows belong to
