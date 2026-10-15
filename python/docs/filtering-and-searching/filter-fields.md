---
title: Filter fields
sidebar_position: 4
---

Declares which fields a list can be filtered by.

Each entry becomes a `FilterSchema` in the view schema, and the frontend renders the matching
input — you do not write filter UI.

## Declaration

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    filter_fields = [
        "name",
        "status",
        "category",
        "brand",
        "stock",
        "price",
        "created_at",
    ]
    fields = ["name", "sku", "description", "status", "category", "brand", "stock", "price", "created_at"]
```

## Generated schema

The filter's type and format are derived from the underlying django-filter filter:

| Field | Filter | Rendered as |
|---|---|---|
| `CharField` | text | [TextInput](/node/input-components/text-input) |
| model `choices` | choice | [ChoicesInput](/node/input-components/choices-input) |
| `ForeignKey` | model choice | [SchemaReferenceInput](/node/input-components/reference-input) autocomplete |
| numeric / decimal | range | [SchemaRangeInput](/node/input-components/range-input) |
| date, datetime | range | [DateRangeInput](/node/input-components/date-range-input) |
| `BooleanField` | boolean | a tri-state toggle, so “either” is expressible |

A relation filter without a resolvable reference degrades to a choice filter rather than failing.

:::tip
Filters split into two groups on screen: the always-on ones sit in the toolbar, the rest live in a
drawer behind the filter button. Which is which is a per-view decision — see
[List view schema generators](../view-generators/list-view-schema-generators.md).
:::

## See also

- [Custom filtersets](./custom-filtersets.md) — anything the derived filters cannot express
- [Ordering fields](./ordering-fields.md) — sorting the same list
- [SchemaList](/node/view-components/schema-list-component) — the view these appear in
