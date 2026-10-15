---
title: SchemaListBox
sidebar_position: 7
---

Embeds the list of a related resource inside a detail or form view — the orders of a customer, the
items of an order.

The embedded list is a real list: it fetches the referenced resource's own schema, so it brings its
filters, sorting, column selector and row actions with it. Use
[SchemaArrayBox](./array-box.md) instead when the rows are part of the parent record rather than a
resource of their own.

## Example

```python
EditViewSchemaGenerator(box=TabBox(boxes=[
    Box(label="Customer", boxes=["name", "email"]),
    Box(label="Orders", boxes=[
        ListBox(
            reference="eshop/order",
            target="customer",
            default_sorting="-placed_at",
            row_actions=["show", "edit"],
        ),
    ]),
]))
```

## Schema fields

All of these live under `schema.list` (`ListBoxParameters`):

| Field | Type | Default | Description |
|---|---|---|---|
| `reference` (required) | `string` | — | Resource to list, in `"service/resource"` form |
| `target` | `string` | — | Foreign key on the referenced resource pointing back at the parent record |
| `rowActions` | `ActionDescriptor[]` | actions from the schema | Buttons in the row action column; `[]` removes the column |
| `toolbarActions` | `ActionDescriptor[]` | — | Actions bound to the **referenced** resource, rendered in the box header |
| `listActions` | `ActionDescriptor[]` | the reference's default list actions | Utility actions next to the filter bar |
| `filters` | `FilterDescriptor[]` | filters from the schema | Restricts and orders the offered filters |
| `defaultSorting` | `SortDescriptor` | — | Initial sort — `{fieldName, direction}` |
| `extraFilters` | `Filters` | — | Filters applied on top of the user's, not shown in the UI |
| `sortable` | `SortableParameters` | — | Enables drag-and-drop ordering; `fieldName` holds the index field |
| `schemaParams` | `Record<string, string>` | — | Extra query params sent when fetching the reference's schema |
| `singleClickAction` | `ActionDescriptor` | — | Action triggered by a single click on a row |
| `doubleClickAction` | `ActionDescriptor` | — | Action triggered by a double click on a row |

The box's own `toolbarActions` (outside `list`) are parent-bound and render in the same header, next
to the reference-bound ones. `bottomActions` render right-aligned under the table.

## Where each action slot lands

| Slot | Position | Bound to |
|---|---|---|
| `list.toolbarActions` | Box header | The referenced resource |
| `toolbarActions` | Box header, after the above | The parent record |
| `list.listActions` | Next to the filter bar, with the column and filter buttons | The referenced resource |
| `list.rowActions` | Row action column | The row |
| `bottomActions` | Under the table, right-aligned | The parent record |

:::caution
Only actions you configure explicitly reach the header. The referenced resource's **default** list
actions — a create button, typically — fall back to `list.listActions` next to the filter bar, not
to the header.
:::

## Behaviour

- Without a `record` in context the box renders nothing: it is a detail-view container.
- With a `target`, the list is wrapped in a `ReferenceManyField` and filtered by the parent's id,
  and the parent is pushed onto the parent-resource descriptors so nested actions know where they
  came from.
- Column widths, column selection and sort are stored per box under
  `SchemaListBox.{resource}.{target}.{reference}.{boxName}` — or without the `{target}` segment
  when the box has none — so two list boxes over the same resource keep separate settings.
- The list does not sync with the URL (`disableSyncWithLocation`) — its filters would otherwise
  collide with the parent view's.
- With `sortable` set, the box switches from a paginated `List` to an `InfiniteList`, because
  drag-and-drop ordering needs all rows on one page.
- An `export` list action runs the backend export via [useExporter](../hooks/use-exporter.md); the
  exported columns come from the action schema's `fields`, not from the box's column selection.

## See also

- [SchemaDatagrid](../datagrid-components.md) — the table rendered inside
- [SchemaGalleryBox](./gallery-box.md) — the same relation shown as images
- [SchemaArrayBox](./array-box.md) — rows that belong to the parent record
- [ListBox on the Python side](/python/view-generators/form-schema-generators) / [on the Ruby side](/ruby/schema-and-field-customization/box-types-reference)
