---
title: View generators
sidebar_position: 1
---

View generators decide what each screen contains: which fields, in which boxes, with which
actions.

Without them a resource still gets all four views with every field in a plain stack. Add a
generator when a view needs a different set of fields or a real layout.

```python
from habarico import ModelAdmin
from habarico.schema.generators import (
    CreateViewSchemaGenerator,
    EditViewSchemaGenerator,
    ListViewSchemaGenerator,
    ShowViewSchemaGenerator,
)

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    view_schema_generators = [
        ListViewSchemaGenerator(),
        CreateViewSchemaGenerator(),
        EditViewSchemaGenerator(),
        ShowViewSchemaGenerator(),
    ]
```

Removing a generator removes the view: no schema, no route, no button pointing at it.

## Pages

| Page | What it covers |
|---|---|
| [List view schema generators](./list-view-schema-generators.md) | Columns, filters, sorting, row and toolbar actions |
| [Form schema generators](./form-schema-generators.md) | Create, edit and show layouts — boxes, tabs, wizards |
| [Action view schema generator](./action-view-schema-generator.md) | Views for non-CRUD actions |
| [Field descriptor reference](./field-descriptor-reference.md) | Every option a `Field` accepts, and where it lands in the schema |
| [Box reference](./box-reference.md) | Every box type and its parameters |

## Permissions come first

A generator never widens what DRF allows. If the underlying view rejects the request, the schema
is not produced and the frontend has nothing to render — which is why hiding a button is never
the mechanism that protects an operation.

## See also

- [View components](/node/view-components/) — what renders these schemas
- [Layout components](/node/layout-components/) — the boxes a form generator arranges
- [Permissions](../basic-usage/permissions.md) — the layer that decides availability
