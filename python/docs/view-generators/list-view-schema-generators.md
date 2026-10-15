---
title: List View Schema Generators
sidebar_position: 2
---

`ListViewSchemaGenerator` is used to generate schema for the list (or table) view.
You can configure the fields that will be rendered. But these fields must be a subset of the DRF serializer fields.
You can define the allowed filters too.

```python
from habarico import ModelAdmin
from habarico.schema import ListViewSchemaGenerator, Field

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = [
        "name",
        "sku",
        "status",
        Field(name="category", label="Product Category"),  # Field descriptor can be used
        "stock",
        "created_at",
    ]
    filter_fields = ["name", "status", "category", "brand", "created_at"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=["name", "status", "category", "stock", "created_at"],  # Only these fields will be rendered
            filters=["status", "category"],  # Only these fields will be available for filtering
        )
    ]
```

## Fields

Instead of `fields` as a string value, you can use a field descriptor. It is possible to change the field label or other field configuration.

```python
from habarico import ModelAdmin
from habarico.schema.generators import ListViewSchemaGenerator
from habarico.schema import Field

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "status", "category", "stock", "price", "created_at"]
    filter_fields = ["name", "status", "category", "created_at"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=[
                Field(
                    name="name",  # Name of the field in the schema
                    label="Product Title",  # Label for the column header
                    short_label="Title",  # Short label for the column header
                    help_text="The title of the product",  # Help for the popover
                    sortable=True  # If the field is sortable
                ),
                Field(
                    name="stock",
                    label="Views",
                    short_label="Views",
                    sortable=True
                ),
                "status",
                "category",
                "created_at"
            ],
            filters=["status", "category"],
            default_sorting="-created_at",  # Default sorting field (prefix with - for descending)
        )
    ]
```

### Server Side Completion

You can also use value completion for the field label or other string values. Just use the lazy `f` string formatter:

```python
from habarico import ModelAdmin
from habarico.schema.generators import ListViewSchemaGenerator
from habarico.schema import Field
from habarico.utils import f

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "status", "category", "stock", "created_at"]
    filter_fields = ["name", "status", "category"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=[
                Field(
                    name="name",
                    label=f("Product: {obj.name}"),  # Object reference will be used in the label, generated on the server side
                ),
                "status",
                "category",
                "created_at"
            ],
        )
    ]
```

The template is rendered on the server against the schema context, which carries four values:

| Name | Description |
|---|---|
| `obj` | The record the schema is rendered for; `None` in a base schema rendered without one |
| `target_obj` | The record an action points at |
| `request` | The current DRF request |
| `read_only` | Whether the schema is rendered read-only |

A placeholder is a name followed by any number of `.attribute` or `[key]` hops, optionally with a
conversion (`!r`) and a format spec (`:.2f`) — the grammar of `str.format`, not of an f-string:

```python
f("Product: {obj.name}")            # attribute
f("{obj.category.name}")            # nested attribute
f("{obj.price:.2f} CZK")            # format spec
f("{obj.name!r}")                   # conversion
```

Expressions, conditionals and method calls are **not** supported, and neither is any name or
attribute starting with an underscore. A template that uses them raises `ValueError` the moment it
is constructed — that is, while the admin module is being imported:

```python
f("{obj.name.upper()}")             # ValueError: unsupported placeholder
f("{'sale' if obj.discount else 'full price'}")  # ValueError
f("{obj._meta.verbose_name}")       # ValueError
```

Compute such a value in a schema getter instead — see
[Custom Schema Generators](../basic-usage/custom-schema-generators.md), where a `get_<attr>()`
method on a schema object has the same context available and the full language at its disposal.

A placeholder the context cannot resolve raises as well, at render time: an unknown name is a
`KeyError`, and `f("Product: {obj.name}")` in a schema rendered without a record is an
`AttributeError` on `None`. Reach for a record attribute only where a record is guaranteed.

:::caution
A lazy `f` template is developer configuration, never user input. Build one from a translation, a
CMS-editable label or any other value an application user can edit and you hand them read access to
whatever the context object exposes — `{request.user.email}` is a valid template.
:::

### Client Side Completion

If you need to change values dynamically you can use frontend format for value completion. Values `formData` and `record` are available.
Value `formData` is the data of the edit or create form and `record` is the data of the stored object (similar to server side completion).
You can use just a key `data` to access `formData` or `record` values. The same logic can be used for `show_query`:

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema import Field

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "short_description", "status", "published_at"]
    view_schema_generators = [
        EditViewSchemaGenerator(
            boxes=[
                "name",
                "sku",
                Field(
                    name="short_description",
                    label="Summary for: %{formData.name}",  # Title will be used in the label and updated on the client side
                    show_query="formData.status === 'published'"  # Show this field only if status is published
                ),
                "status",
                Field(
                    name="published_at",
                    show_query="formData.status === 'published'"  # Show publication date only when published
                ),
            ],
        )
    ]
```

### Rich Text Syntax

Labels, titles, and other string values can contain special tokens that the frontend (`@eluvia/habarico`)
interprets as icons, highlighted text, or bold text. No backend changes are required — the value is
sent as a plain string and the FE parses it at render time.

**Supported tokens:**

| Token | Description |
|---|---|
| `[icon:IconName]` | Inline icon (MUI icon set) |
| `[icon:IconName:#rrggbb]` | Icon with custom hex colour |
| `[highlight]text[/highlight]` | Highlighted text (colour adapts to light/dark mode) |
| `[bold]text[/bold]` | Bold text |

`IconName` must be a valid MUI Material icon name (e.g. `CheckCircle`, `Warning`, `Star`).
Icon colour must be a 3- or 6-digit hex value (`#f00`, `#ff0000`). Invalid colours are silently ignored.

**Examples:**

```python
from habarico import ModelAdmin
from habarico.schema import Field, ListViewSchemaGenerator

class ProductAdmin(ModelAdmin):
    model = Product
    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=[
                Field(name="name", label="[icon:Inventory] Product"),
                Field(name="status", label="[icon:CheckCircle:#2e7d32] Status"),
            ],
        )
    ]
```

**Edge cases:**
- Unknown tags (e.g. `[foo]text[/foo]`) are passed through as plain text.
- A tag without a closing counterpart is also passed through as plain text.
- `templateToStr` / `%{...}` placeholders and rich text tokens can coexist in the same string.

### Actions

You can define an action field that will be rendered as a button in the view:

```python
from habarico import ModelAdmin
from habarico.schema import Field, ActionType, EditViewSchemaGenerator, ActionSchema

from .models import CzechCompany


class CzechCompanyAdmin(ModelAdmin):
    model = CzechCompany
    fields = ["id", "name", "ico", "dic"]
    view_schema_generators = [
        EditViewSchemaGenerator(
            boxes=[
                "name",
                "ico",
                "dic",
                Field(
                    name="show_ares",
                    action=ActionSchema(
                        type=ActionType.LINK,
                        label="Show ARES details %{formData.ico}",
                        link_url="https://ares.gov.cz/ekonomicke-subjekty/res/%{formData.ico}",
                    )
                ),
            ],
        )
    ]
```

If the action is defined as a resource action you can use the `Action` descriptor class the same way:

```python
from habarico import ModelAdmin
from habarico.schema import Field, EditViewSchemaGenerator, Action

from .models import CzechCompany


class CzechCompanyAdmin(ModelAdmin):
    model = CzechCompany
    fields = ["id", "name", "ico", "dic"]
    view_schema_generators = [
        EditViewSchemaGenerator(
            boxes=[
                "name",
                "ico",
                "dic",
                Field(
                    name="lookup_ares",
                    action=Action(
                        name="lookup_ares",
                    )
                ),
            ],
        )
    ]
```

## Drag and Drop Sorting

A special type of table field is the sortable table. Users can sort table items with drag and drop.
Column ordering is disabled for the sortable table.

```python
from habarico import ModelAdmin
from habarico.schema.generators import ListViewSchemaGenerator

from .models import Category


class CategoryAdmin(ModelAdmin):
    model = Category
    fields = ["name", "description", "created_at", "position"]
    filter_fields = ["name"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=["name", "description", "created_at"],
            sortable_field_name="position",  # Field that contains the position of the item. FE will send this field in the PATCH request when the user changes item position.
            sortable_sort_for_filters={"name": "Electronics"},  # Drag and drop is offered only while the list is filtered by exactly these filter values. With any other filters active, drag and drop is disabled.
        )
    ]
```

## Extra Filters

You can define extra filters that will be used to filter the list of items.

```python
from habarico import ModelAdmin
from habarico.schema.generators import ListViewSchemaGenerator

from .models import Product


class PublishedProductAdmin(ModelAdmin):
    model = Product
    name = "published_product"
    fields = ["name", "category", "stock", "published_at"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            extra_filters={
                "status": "published",  # Only show published products
            },
        )
    ]
```

## Actions

The list view has three independent action slots:

| Parameter | Where rendered |
|-----------|---------------|
| `toolbar_actions` | Toolbar above the table (e.g. Create, bulk Delete). |
| `row_actions` | Inline buttons on each table row (e.g. Edit, Show, Delete). |
| `list_actions` | Utility actions next to the filter bar, separate from the toolbar (e.g. Export, Print). |

All three accept a list of action descriptors or plain action name strings.

```python
from habarico import ModelAdmin
from habarico.schema.generators import ListViewSchemaGenerator
from habarico.schema import Action, ActionViewChoice

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "status", "category", "stock", "created_at"]
    filter_fields = ["name", "status", "category"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=["name", "status", "category", "stock", "created_at"],
            toolbar_actions=["create"],
            list_actions=["export"],
            row_actions=[
                Action(
                    name="archive",
                    label="Archive",
                    icon="Archive",
                    color="error",
                ),
                Action(
                    name="edit",
                    view_mode="dialog",  # Open the edit view in a dialog
                    view_choices=[  # Click to edit button will open a choice menu with these options, parameters will be passed to the edit view
                        ActionViewChoice(label="Quick Edit", parameters={"mode": "quick"}),
                        ActionViewChoice(label="Full Edit", parameters={"mode": "full"}),
                    ]
                ),
                "show",
                "delete",
            ],
        )
    ]
```

## Filters

You can define filters that will be available for the table. You can use the `Filter` descriptor class or
just a string with the filter name.

```python
from habarico import ModelAdmin
from habarico.schema import Filter
from habarico.schema.generators import ListViewSchemaGenerator

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "status", "category", "brand", "stock", "created_at"]
    filter_fields = ["name", "status", "category", "brand", "created_at"]
    view_schema_generators = [
        ListViewSchemaGenerator(
            filters=[
                "status",
                "category",
                Filter(
                    name="category",
                    label="Product Category",
                    help_text="Filter by the product's category",
                    is_always_on=True,  # Filter is always visible
                ),
                Filter(
                    name="name",
                    label="Title Search",
                    help_text="Search products by title",
                    default_value="",
                ),
            ],
        )
    ]
```
