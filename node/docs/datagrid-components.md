---
title: Datagrid components
sidebar_position: 6
---

The table inside a list view: columns from the schema, row actions, sorting, drag-and-drop
ordering and a column selector.

[SchemaList](./view-components/schema-list-component.md) mounts `SchemaDatagrid` for you. Use it
directly inside a hand-built [ListShell](./layout-components/list-shell.md).

## Example

```tsx
<SchemaDatagrid
  fields={viewSchema.list.boxes}
  indexField="position"
  rowActions={viewSchema.list.rowActions}
  rowSx={(record) => (record.stock === 0 ? {opacity: 0.6} : {})}
/>
```

## SchemaDatagrid props

| Name | Type | Default | Description |
|---|---|---|---|
| `fields` | `FieldDescriptor[]` | fields from the method schema | Which columns to render, in order |
| `expand` | `ReactElement \| FC` | — | Expandable row content |
| `target` | `string` | — | Marks this list as the origin, so a row action can return to it |
| `indexField` | `string` | — | Field holding the order; enables drag-and-drop sorting |
| `sortForFilters` | `Filters` | — | Filters under which drag-and-drop ordering is allowed |
| `onRowClick` | `(record: HabRecord) => void` | — | Replaces the default row activation |
| `rowActions` | `AnyActionDescriptor[]` | — | The row action slot; absent or empty renders no column, a `DefaultActions` entry gets one only when the resource has a record action it expands into |
| `rowActionButtons` | `ReactNode \| false` | buttons of `rowActions` | Replaces how the row actions render; `false` removes the column |
| `rowSx` | `(record: HabRecord) => SxProps` | — | Per-row styling, e.g. to mark a state |
| `singleClickAction` | `ActionDescriptor` | from the view schema | What a single click does |
| `doubleClickAction` | `ActionDescriptor` | from the view schema | What a double click does |
| `disableSort` | `boolean` | `false` | Turns off column sorting |

:::caution
Drag-and-drop ordering needs both `indexField` and a sort that matches the stored order. That is
what `sortForFilters` guards: reordering rows while the list is sorted by something else would
write positions the user cannot see.
:::

## Row tooltips

A row whose click does something announces it: hovering shows a tooltip naming the available
gesture and action — "Click: Show", "Double-click: Edit" — taken from the action's label in the
record's own schema.

`SchemaDatagrid` builds that tooltip from `singleClickAction` / `doubleClickAction`, so a list with
row activation gets it without any configuration. The schema-free `AdminDatagrid` underneath takes
it as a prop:

| Name | Type | Default | Description |
|---|---|---|---|
| `rowTooltip` | `(record: RaRecord) => ReactNode` | schema-driven in `SchemaDatagrid` | Overrides the tooltip; return `null` for rows that should have none |

The tooltip appears after `TOOLTIP_ENTER_DELAY` and is suppressed while the pointer is over an
interactive element inside the row — a button or a link — so the row hint never covers a control's
own tooltip. Rows with neither click slot active get no tooltip at all.

To drop the tooltip from every list of the application, pass `rowTooltip={false}` to
[SchemaAdmin](./base-components/schema-admin.md). Clicking and double-clicking a row still open it;
only the hover hint goes away.

```tsx
<SchemaAdmin
  serviceConfigMap={serviceConfigMap}
  authProvider={authProvider}
  defaultRowAction="double-click"
  rowTooltip={false}
/>
```

## DatagridConfigurable and SelectColumnsButton

`DatagridConfigurable` is the datagrid whose visible columns the user can choose;
`SelectColumnsButton` is the control that opens the chooser. They belong together — the button
does nothing without the configurable datagrid.

In generated lists this is switched on by `columnSelector` on
[SchemaAdmin](./base-components/schema-admin.md), and the choice is stored per user through the
[preferences store](./utilities/create-backend-store-backend-synced-preferences.md).

## See also

- [SchemaList](./view-components/schema-list-component.md) — the view that mounts the datagrid
- [Field components](./field-components/index.md) — what renders in the cells
- [SchemaButtons](./navigation-components/schema-buttons-component.md) — the row action buttons
