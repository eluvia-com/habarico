---
title: Menu Customisation
sidebar_position: 8
---

Administration menus are automatically generated from the admin classes.
You can customize the menu by defining the `label` and `icon` properties. The default value of `label` is the model's verbose name.
Icon is `None` by default; you can use Material icon names to set the icon (https://mui.com/material-ui/material-icons/).

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    label = "Products"
    icon = "Product"  # Material icon name (https://mui.com/material-ui/material-icons/?query=Product)
    search_fields = ["name", "description"]
    fields = ["name", "sku", "description", "status", "category"]
```

## Custom Menu Links

The admin menu links to the list view by default. You can change this behaviour with the `menu_schema_generator` property:

```python
from habarico import ModelAdmin
from habarico.schema.generators import MenuSchemaGenerator

from .models import Product


# Link menu to a specific product's show view
FEATURED_ARTICLE_ID = 1

class FeaturedProductAdmin(ModelAdmin):
    model = Product
    name = "featured_product"
    label = "Featured Product"
    icon = "Star"
    menu_schema_generator = MenuSchemaGenerator(view_name="show", record_pk=FEATURED_ARTICLE_ID)
```

Now the menu will link to the show view of the instance with the specified ID.

## Menu Groups

You can group admin classes under a common menu section:

```python
from habarico import ModelAdmin
from habarico.schema import MenuGroup, MenuSchemaGenerator

from .models import Category, Product


content_group = MenuGroup(
    name="Content",
    label="Content Management",
    icon="ContentPaste",
)

class ProductAdmin(ModelAdmin):
    model = Product
    menu_schema_generator = MenuSchemaGenerator(parent=content_group)  # Assign to Content group


class CategoryAdmin(ModelAdmin):
    model = Category
    menu_schema_generator = MenuSchemaGenerator(parent=content_group)  # Assign to Content group
```

Groups with the same `name` are merged, so two apps may contribute entries to one section without
sharing the object. Leaving `name` out generates a unique one, which makes the group private to
that declaration.

### `MenuGroup` options

| Option | Type | Default | Description |
|---|---|---|---|
| `label` (required) | `str` | — | Section caption |
| `name` | `str` | generated | Merge key — groups sharing a name become one section |
| `icon` | `str` | `None` | Icon name |
| `color` | `Color` | `None` | Icon color |
| `priority` | `int` | `ADMIN_MENU_GENERATOR_DEFAULT_PRIORITY` (`5`) | Ordering; lower comes first |
| `parent` | `MenuGroup` | `None` | Parent group, for nested sections |

## Ordering the menu

Both groups and resource entries are ordered by `priority`, and both fall back to the same default
when it is not set. Change that default globally in `settings.py`:

```python
ADMIN_MENU_GENERATOR_DEFAULT_PRIORITY = 5
```

:::tip
Leave the default in the middle of your range and give only the entries that need to move a
priority of their own. Setting it to `1` and then having to renumber everything below is the usual
way this ends up unmaintainable.
:::
