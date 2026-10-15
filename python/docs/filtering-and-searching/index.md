---
title: Filtering and searching
sidebar_position: 1
---

Which fields a list can be filtered by, searched in and sorted by — declared on the admin class,
rendered by the frontend without further configuration.

```python
class ProductAdmin(ModelAdmin):
    model = Product
    filter_fields = ["status", "category", "price"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "price", "created_at"]
```

| Page | What it covers |
|---|---|
| [Filter fields](./filter-fields.md) | `filter_fields` and the filters they generate |
| [Custom filtersets](./custom-filtersets.md) | A `FilterSet` of your own for anything the defaults cannot express |
| [Fulltext search](./fulltext-search.md) | `search_fields` and per-resource `?search=` filtering |
| [Global search](./global-search.md) | The cross-admin spotlight search and match highlighting |
| [Ordering fields](./ordering-fields.md) | `ordering_fields` and the default sort |

## What the frontend does with it

Each filter arrives as a `FilterSchema` with a type and a format, and is rendered by the matching
[input component](/node/input-components/) — a date range filter becomes
[DateRangeInput](/node/input-components/date-range-input), a foreign key becomes an autocomplete.
Filters marked always-on sit in the toolbar; the rest live in the filter drawer.

## See also

- [Aggregations](../aggregations/index.md) — the same filters applied to aggregate queries
- [SchemaList](/node/view-components/schema-list-component) — the list view these feed
