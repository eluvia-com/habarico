---
title: Custom Schema Generators
sidebar_position: 7
---

You can create your own Action or View schema generator. For example, you can create a custom `EditViewSchemaGenerator`:

```python
from habarico.schema.generators import EditViewSchemaGenerator


class ProductQuickEditViewSchemaGenerator(EditViewSchemaGenerator):
    """Custom edit view for quick product editing."""

    name = "quick_edit"  # Name of the schema generator
    label = "Quick Edit"  # Label of the schema generator
    icon = "EditNote"  # Material icon of the schema generator
```

The static values work as defaults and can be overridden when the view schema generator is initialized:

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    view_schema_generators = [
        EditViewSchemaGenerator(
            name="quick_edit",
            label="Quick Edit Product",
            icon="EditNote",
            boxes=["name", "status"],
        )
    ]
```

Values of the generator can be dynamically generated in getter methods:

```python
from habarico.schema.generators import EditViewSchemaGenerator


class ProductEditViewSchemaGenerator(EditViewSchemaGenerator):
    """Dynamic edit view that shows the product title in the label."""

    def get_label(self):
        if self.context.obj:
            return f"Edit: {self.context.obj.name}"
        return "Edit Product"
```

Every schema generator has a context object that can contain values:

| Property | Description |
|----------|-------------|
| `request` | Django request object |
| `obj` | Django object used to generate the schema (can be `None`) |
| `resource` | DRF viewset related to the schema |
| `render_base_schema` | `True` if generating simplified schema for the admin |
| `render_object_schema` | `True` if generating schema for the object detail view |

You can also use the `_admin` parameter to get the admin class related to the schema generator.
