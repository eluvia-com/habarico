---
title: Ordering fields
sidebar_position: 5
---

Declares which columns the list may be sorted by.

## Declaration

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    ordering_fields = ["name", "price", "created_at"]
    fields = ["name", "sku", "description", "status", "category", "price", "created_at"]
```

## Generated schema

A field listed here gets `sortable: true` in the view schema, which is what makes its datagrid
header clickable.

A client may always ask for what the resource orders by anyway, whether or not `ordering_fields`
names it: the field in `default_sorting`, and the primary key. Those are what the schema tells the
frontend to send, so refusing them would refuse the list's own first request.

:::caution
An empty `ordering_fields` makes **every** serializer field sortable. That is convenient in
development and expensive in production: a sort on an unindexed column is a full scan the user can
trigger by clicking a header.
:::

## Default ordering

`default_sorting` is the order a request that sends no `order_by` is answered in — Django-style,
`"placed_at"` ascending and `"-placed_at"` descending, or a `Sorting` descriptor:

```python
class OrderAdmin(ModelAdmin):
    model = Order
    default_sorting = "-placed_at"
    ordering_fields = ["number", "placed_at", "total"]
```

It is applied to the queryset itself, so a script or another service calling `GET /admin/order/`
is answered in the same order the admin shows. A `ListViewSchemaGenerator` without a
`default_sorting` of its own publishes this one, so the frontend opens the list sorted the same
way; a view declaring one overrules it for that view — see
[List view schema generators](../view-generators/list-view-schema-generators.md).

Declaring nothing leaves the queryset in the order it already has: the model's `Meta.ordering`, or
none. The name may be an annotation as well as a model field — it is handed to `order_by()` as
written, and is not checked when the admin is registered, since where an annotation comes from is
not knowable then. A name that resolves to neither fails the first list request with a Django
`FieldError`.

`get_default_sorting()` is the hook behind the attribute, for a default that depends on the
request:

```python
class OrderAdmin(ModelAdmin):
    model = Order

    def get_default_sorting(self, request=None):
        if request and request.user.is_staff:
            return "-priority"
        return "-placed_at"
```

:::info
Whatever the ordering ends up being — the client's `order_by`, this default, or a `Meta.ordering` —
the primary key is appended behind it. Two records tying on the sorted column would otherwise be
free to swap places between two requests, which is how a paged list repeats one record and skips
another. `ordering_tiebreaker = False` on the viewset turns it off.
:::

## See also

- [Filter fields](./filter-fields.md) — narrowing the same list
- [Pagination](../basic-usage/pagination.md) — `limit` and `offset`, which the ordering makes
  stable
- [Datagrid components](/node/datagrid-components) — where sorting is triggered
- [Sorting](/ruby/filtering-and-searching) — the Ruby counterpart
