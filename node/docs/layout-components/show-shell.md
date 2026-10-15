---
title: ShowShell
sidebar_position: 7
---

A read-only detail screen: the React Admin `<Show>` controller, the record contexts the fields
need, and the [ViewContent](./view-content.md) frame around them.

Field components read their record from context. Rendering one on a custom page without this
wrapper gives you an empty field, not an error — which is the usual reason a hand-built detail
screen comes up blank.

## Example

```tsx
import {ShowShell, PropertyShowLayout, TextField, NumberField} from '@eluvia/habarico';

<ShowShell
  title="Order detail"
  controllerProps={{resource: 'eshop/order', id: orderId}}
  toolbarActions={<EditButton />}
>
  <PropertyShowLayout>
    <TextField source="number" />
    <NumberField source="total" />
  </PropertyShowLayout>
</ShowShell>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | The fields |
| `record` | `RaRecord` | record from the controller | Renders a record you already have instead of fetching one |
| `controllerProps` | `Omit<ShowProps, 'children'>` | — | Plain React Admin `<Show>` props — `id`, `resource`, `queryOptions`, … |
| `title` | `ReactNode` | — | Portaled to the layout header |
| `subtitle` | `ReactNode` | — | Rendered under the title |
| `breadcrumbs` | `ReactNode` | — | Injected into the layout's breadcrumb slot |
| `toolbarActions` | `ReactNode` | — | Portaled next to the title |
| `bottomActions` | `ReactNode` | — | Bottom action bar; becomes `DialogActions` in a dialog |

The shell turns the `<Show>` card off (`component="div"`) — the visible surface comes from the
`Panel`s inside, not from the shell. It also waits out React Admin's loading skeleton and
re-provides the loaded record as both `RecordContext` and `RootRecordContext`, so nested boxes
resolve relative sources against the right record.

:::tip
A read-only *edit* view is not a variant of the form shells — the schema layer renders `ShowShell`
instead. `EditShell` and `CreateShell` therefore carry no `readOnly` prop.
:::

## See also

- [Field components](../field-components/index.md) — what goes inside
- [Property layouts](./property-layouts.md) — laying the fields out as label + value rows
- [SchemaShow](../view-components/schema-show-component.md) — the generated detail view
