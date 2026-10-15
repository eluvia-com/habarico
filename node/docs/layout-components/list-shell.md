---
title: ListShell
sidebar_position: 10
---

A list with the arrangement the generated lists use: the datagrid in a paper card, inline filters
above it, and the filter / column / sort buttons in its toolbar.

Use it for a list you assemble by hand — a report table, a picker screen. For a resource's own
list, [SchemaList](../view-components/schema-list-component.md) does this and reads the schema too.

## Example

```tsx
import {ListShell, SearchInput, ChoicesInput} from '@eluvia/habarico';

const SORT = {field: 'placed_at', order: 'DESC'} as const;

<ListShell
  resource="eshop/order"
  title="Orders"
  listConfig={{
    preferenceKey: 'eshop/order.list',
    sort: SORT,
    filterDefaultValues: {},
    filters: [<ChoicesInput key="status" source="status" choices={statusChoices} />],
  }}
  controllerProps={{sort: SORT, perPage: 25}}
  filters={<SearchInput source="q" alwaysOn />}
  toolbarActions={<CreateButton />}
>
  <OrderDatagrid />
</ListShell>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | The datagrid |
| `listConfig` (required) | `ListConfig` | — | Feeds `ListConfigContext`; four of its keys are required — see below |
| `resource` | `string` | resource from context | Wraps the list in a `ResourceContextProvider`; omit when an ambient resource exists |
| `controllerProps` | `Omit<ListProps, 'children'>` | — | Plain React Admin `<List>` props — `sort`, `perPage`, `filter`, `filterDefaultValues`, `queryOptions`, `exporter`, `pagination`, `empty`, … |
| `infinite` | `boolean` | `false` | Uses `<InfiniteList>` and appends an `<InfinitePagination>` instead of paging |
| `title` | `ReactNode` | — | Portaled to the layout header |
| `breadcrumbs` | `ReactNode` | — | Injected into the layout's breadcrumb slot |
| `toolbarActions` | `ReactNode` | — | Portaled next to the title |
| `listActions` | `ReactNode` | `DatagridActions` | The datagrid toolbar — filter drawer, column selector, filter, sort and config resets. `null` hides it |
| `filters` | `ReactElement` | — | The inline filter node rendered above the datagrid |
| `sidePanel` | `ReactNode` | — | A docked detail panel; the body becomes a two-column layout |

## ListConfig

The datagrid's configuration buttons — the filter drawer, the column selector, the filter, sort and
config resets — read their state from this object, so the first four keys have to be there:

| Key | Type | What reads it |
|---|---|---|
| `preferenceKey` | `string` | Where the column selection, widths and saved queries are stored per user |
| `sort` | `SortPayload` | The "reset sort" button, to know what to reset to |
| `filterDefaultValues` | `object` | The "reset filters" button (in the `⋮` menu and the filter drawer's footer) and the "reset table settings" button |
| `filters` | `ReactElement<InputProps>[]` | The inputs the **filter drawer** renders |
| `hasInlineFilters` | `boolean` | Whether the list also has inline filters; the "reset filters" button is offered when this is `true` or `filters` is not empty. Optional — the shell defaults it to whether the `filters` prop is passed |

:::caution
`listConfig.filters` and the `filters` prop are two different slots: the prop is the inline filter
node above the table, `listConfig.filters` is the array the drawer builds itself from. The
generated list splits one filter set between them by `isAlwaysOn`.
:::

The card around the datagrid is `ListSurface` and is owned by this shell — a list is the one view
type with an outer paper surface. `ListSurface` is exported on its own (`{children, sidePanel}`)
for the rare case where you want the card without the controller.

## See also

- [SchemaList](../view-components/schema-list-component.md) — the schema-driven list
- [Datagrid components](../datagrid-components.md) — the table to put inside
- [Input components](../input-components/index.md) — what the filters are built from
