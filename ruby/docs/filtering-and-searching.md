---
title: Filtering and Searching
sidebar_position: 10
---

Define filterable and sortable fields at the definition level:

```ruby
filters [:status, :category, :product, :placed_at, :delivered_at]
sorting_fields [:placed_at, :delivered_at, :created_at]
default_sorting 'placed_at:desc'
default_filter({ status: 'active' })
```

`default_filter` is merged into every index query and accepts a hash of filter params.

For per-view filter customization, use `Habarico::FilterReference` inside a `Habarico::ListView`. The `filters:` array populates the collapsible filter drawer; `toolbar_filters:` populates the always-visible toolbar row:

```ruby
views [
  Habarico::ListView.new(
    filters: [
      Habarico::FilterReference.new(name: :placed_at, label: 'Start date'),
      Habarico::FilterReference.new(name: :delivered_at, label: 'End date'),
    ],
    toolbar_filters: [:status, :category, :product],
  ),
]
```

## Sorting

A list endpoint is ordered by the `order_by` query parameter — `field:direction` entries separated
by `,` and applied left to right:

```
GET /orders?order_by=placed_at:desc,number:asc
```

`direction` is `asc` or `desc`, lower-case. Whitespace around an entry is ignored. A missing or
empty `order_by` leaves `default_sorting` in place — and with no `default_sorting` declared, the
list is ordered by the primary key alone. Anything else in the entry is refused, see
[Rejected sorting requests](#rejected-sorting-requests).

### What a client may sort by

`field` is not the field's own name but the `sort_by` the resource schema publishes for it — the
same value the frontend puts in the sort link of a column. Four declarations produce one:

| Declared as | `sort_by` |
|---|---|
| A field backed by a DB column or a model attribute | the field itself |
| A range field — `range_attr :delivery_window, :delivered_from, :delivered_to` | its lower bound, `delivered_from` |
| A `FieldReference` naming a column of an association in a list view | `customer__name` |
| A `FieldReference` carrying `sort_by:` | the declared value |

A column that no field of the resource exposes is not sortable, and neither is a field the schema
publishes without a `sort_by` — a value computed in `prefetch`, for instance, which no `ORDER BY`
can reach.

On top of those, a client may always ask for what the resource orders by anyway: the field named in
`default_sorting` (the resource's or a list view's) and the primary key. Those are what the schema
tells the frontend to send, so they are accepted whether or not they are declared as fields.

```ruby
class OrdersController < ApplicationController
  include Habarico::Controller

  model Order
  fields %i[number customer status total delivery_window placed_at]

  views [
    Habarico::ListView.new(
      boxes: [
        :number,
        Habarico::FieldReference.new(name: 'customer__name', label: 'Customer'),
        :status,
        :total,
        :placed_at,
      ],
    ),
  ]
end
```

`?order_by=customer__name:asc` sorts by the customer's name over a `LEFT JOIN`, and
`?order_by=delivered_from:asc` sorts by the start of the delivery window.

Beyond the fields, a model may register a virtual sortable column with `order_attr` — an escape
hatch for an ordering that is an SQL expression rather than a column:

```ruby
class Order < ApplicationRecord
  order_attr(:item_count) { 'SELECT COUNT(*) FROM order_items WHERE order_items.order_id = orders.id' }
end
```

`?order_by=item_count:desc` then works, whether or not a field of the resource is named after it.

:::info
Whatever the ordering ends up being — the client's `order_by` or `default_sorting` — the primary key
is appended behind it. Two records tying on the sorted column would otherwise be free to swap places
between two requests, which is how a paged list repeats one record and skips another.
`list_order_by_tiebreaker` is the controller method behind the choice; to put a column such as
`created_at` in the ordering, name it in `default_sorting` — nothing is assumed to exist on the
model.
:::

### Restricting and forcing the ordering

`sorting_fields` replaces all of the above with a fixed list — nothing outside it is accepted, no
matter what the schema publishes, beyond the orderings the resource applies to every request
anyway:

```ruby
sorting_fields [:placed_at, :delivered_at, :created_at]
```

`force_sorting true` goes further and pins the ordering to `default_sorting`: `order_by` is then
not read at all, and a request carrying one is served with the forced ordering rather than refused.

### Rejected sorting requests

An `order_by` that is not in the expected shape is refused with `422 Unprocessable Entity`, the
error attached to `order_by`:

```json
{
  "errors": [
    {
      "error": "Unprocessable Entity",
      "status": 422,
      "message": "Invalid format, expected \"field_name:asc\" or \"field_name:desc\".",
      "source": "order_by",
      "timestamp": "2026-09-18T09:15:44.031Z"
    }
  ]
}
```

A direction that is not `asc` or `desc`, and a field name the resource does not offer, are attached
to the field instead — `order_by__placed_at`, `order_by__secret_column` — and every unknown field
name of one request is reported together.

:::caution
`placed_at:ASC` and `placed_at:asc:desc` used to be accepted here: the first was read as ascending,
the second silently dropped its third segment. Both are refused now, which is what the Python
backend has always done. The frontend only ever sends `field:asc` / `field:desc`, so this reaches
hand-written integrations.
:::

## See also

- [Data Loading](./basic-usage/data-loading.md) — `default_sorting` and `force_sorting` among the
  other index-query options
- [Pagination](./basic-usage/pagination.md) — `limit` and `offset`, the parameters `order_by`
  accompanies
- [List View](./schema-and-field-customization/list-view.md) — `sortable` and `sort_by` on a
  `FieldReference`
