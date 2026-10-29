---
title: Form Schema Generators
sidebar_position: 3
---

`CreateViewSchemaGenerator`, `EditViewSchemaGenerator` and `ShowViewSchemaGenerator` are used to generate schema for
the form views. You can specify the fields that will be rendered in the form:

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
    fields = ["name", "sku", "description", "short_description", "status", "category", "brand", "tags", "created_at", "updated_at"]
    view_schema_generators = [
        ListViewSchemaGenerator(boxes=["name", "status", "category", "created_at"]),
        CreateViewSchemaGenerator(boxes=["name", "sku", "description", "category", "brand"]),
        EditViewSchemaGenerator(boxes=["name", "sku", "description", "short_description", "status", "category", "tags"]),
        ShowViewSchemaGenerator(boxes=["name", "description", "short_description", "status", "category", "brand", "created_at", "updated_at"]),
    ]
```

## Boxes

The structure of form view generators can be more complex. You can define boxes that define the structure of the form.
For example, you can define two boxes with fields in the edit view.
React admin will generate two labeled areas with fields.

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import Box

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "short_description", "status", "category", "brand", "tags", "created_at", "updated_at"]
    view_schema_generators = [
        EditViewSchemaGenerator(box=Box(
            boxes=[
                Box(
                    label="Content",
                    boxes=["name", "sku", "description", "short_description"],  # Field descriptors can also be used here
                ),
                Box(
                    label="Metadata",
                    is_readonly=True,  # Box is read only
                    boxes=["status", "category", "brand", "tags", "created_at", "updated_at"],
                ),
            ]
        ))
    ]
```

Boxes can be used to show form fields in tabs with `TabBox`:

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import TabBox, Box

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "short_description", "status", "category", "brand", "tags", "stock", "price", "created_at", "updated_at", "published_at"]
    view_schema_generators = [
        EditViewSchemaGenerator(box=TabBox(
            show_toolbar_navigation=True,  # Show previous/next navigation buttons in the box toolbar (default: False for tabs)
            boxes=[
                Box(
                    label="Content",
                    boxes=["name", "sku", "description", "short_description", "status"],
                ),
                Box(
                    label="Relationships",
                    boxes=["category", "brand", "tags"],
                ),
                Box(
                    label="Statistics",
                    boxes=["stock", "price", "created_at", "updated_at"],
                    show_query="status === 'published'",  # Show this box only if status is published
                ),
                Box(
                    label="Publishing",
                    boxes=["published_at"],
                    show_query="status === 'published'",
                    required_query="status === 'published'",  # This box is required only if status is published
                ),
            ]
        ))
    ]
```

or `WizardBox`. Each step is a labelled inner box, typically a `TabItemBox` (its `label` is
required). `WizardBox` shows previous/next navigation buttons by default (`show_toolbar_navigation=True`)
and validates the current step before advancing (`validate_steps=True`); both can be turned off.

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import WizardBox, TabItemBox

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "short_description", "status", "category", "brand", "tags"]
    view_schema_generators = [
        EditViewSchemaGenerator(box=WizardBox(
            show_toolbar_navigation=True,  # Show previous/next navigation buttons in the box toolbar (default: True for wizards)
            validate_steps=True,  # Validate the current step before moving to the next one (default: True)
            boxes=[
                TabItemBox(
                    label="Basic Info",  # label is required for each step
                    boxes=["name", "sku", "category"],
                ),
                TabItemBox(
                    label="Content",
                    boxes=["description", "short_description"],
                ),
                TabItemBox(
                    label="Categorization",
                    boxes=["status", "category", "tags"],
                ),
            ]
        ))
    ]
```

Both `TabBox` and `WizardBox` accept `show_toolbar_navigation` (default `False` for tabs, `True` for
wizards); `WizardBox` additionally accepts `validate_steps` (default `True`). In the generated
schema these are nested under a `tab` / `wizard` object, e.g.
`{"type": "wizard", "wizard": {"show_toolbar_navigation": true, "validate_steps": true}}`.

## Box actions

Every box supports two action slots that position buttons relative to the box itself rather than the
whole view:

| Parameter | Where rendered |
|-----------|---------------|
| `toolbar_actions` | Toolbar in the box header / card header area. On a plain `Box` always visible; on `TabBox` / `WizardBox` appears on the **last** step. |
| `bottom_actions` | Below the box fields, similar to form submit buttons at the view level. |

Both accept a list of action descriptors or plain action name strings.

To move the Save button next to a specific block (e.g. the right column of a grid), add
`SaveActionDescriptor()` to that box's `toolbar_actions` and drop the default view-level Save by passing
`bottom_actions=[]` on the detail view:

```python
from habarico.schema.actions import SaveActionDescriptor
from habarico.schema.boxes import GridBox, GridItemBox, Box, WizardBox, TabItemBox

EditViewSchemaGenerator(
    bottom_actions=[],  # drop the default view-level Save button
    box=GridBox(boxes=[
        GridItemBox(md=6, boxes=[Box(label="Preview", boxes=["name"])]),
        GridItemBox(md=6, boxes=[
            WizardBox(
                show_toolbar_navigation=True,
                toolbar_actions=[SaveActionDescriptor()],  # shown on the last step
                boxes=[
                    TabItemBox(label="Step 1", boxes=["name"]),
                    TabItemBox(label="Step 2", boxes=["description"]),
                ],
            ),
        ]),
    ]),
)
```

A table of another admin resource can be displayed with `ListBox`:

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import TabBox, Box, ListBox

from .models import Category, Product


class CategoryAdmin(ModelAdmin):
    model = Category
    fields = ["id", "name", "email", "description", "is_active"]
    view_schema_generators = [
        EditViewSchemaGenerator(box=TabBox(
            boxes=[
                Box(
                    label="Category Info",
                    boxes=["name", "email", "description", "is_active"],
                ),
                ListBox(
                    label="Products",
                    boxes=["name", "status", "stock", "created_at"],  # Fields that will be rendered in the table
                    toolbar_actions=["refresh"],  # Actions in the box's own toolbar (box header, box root)
                    list_toolbar_actions=["create"],  # Actions in the table toolbar (top of the resource list)
                    row_actions=["edit", "show", "delete"],  # Actions on each table row
                    list_actions=["export"],  # Utility actions next to the filter bar
                    default_sorting="-created_at",  # Default sorting field
                    reference="product",  # Reference to the related admin resource (name of the admin)
                    target="category",  # Name of the field that is used to filter the related items
                ),
            ]
        ))
    ]
```

Finally, there are two types of boxes that can be used with nested DRF serializers, `ObjectBox` and `ArrayBox`:

```python
from habarico import ModelAdmin
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import TabBox, Box, ArrayBox, ObjectBox

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "category", "brand", "tags"]
    view_schema_generators = [
        EditViewSchemaGenerator(box=TabBox(
            boxes=[
                Box(
                    label="Content",
                    boxes=["name", "sku", "description"],
                ),
                ObjectBox(
                    label="Category Details",
                    boxes=["name", "email", "description"],  # Fields that will be rendered in the subform
                    target="category",  # Name of the nested serializer field
                ),
                ArrayBox(
                    label="Tags",
                    boxes=["name"],  # Fields that will be rendered in array form
                    target="tags",  # Name of the nested array field
                ),
            ]
        ))
    ]
```

## Save Action Behaviour

By default, after a successful save the frontend decides what to do (typically redirecting to the show or list view).
You can override this using the `after_save` parameter on `SaveActionDescriptor` or `ActionSchema` (with
`type=ActionType.SAVE`).

**Possible values** (`AfterSaveType`):

| Value | Behaviour |
|-------|-----------|
| `stay` | Stay on the current form (do not navigate away) |
| `prev` | Navigate back (browser history back / close dialog) |
| `show` | Open the show view for the saved record |
| `list` | Navigate to the list view of the resource |

```python
from habarico import ModelAdmin
from habarico.schema import AfterSaveType, SaveActionDescriptor
from habarico.schema.generators import CreateViewSchemaGenerator, EditViewSchemaGenerator

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "status", "category"]
    view_schema_generators = [
        CreateViewSchemaGenerator(
            actions=[
                SaveActionDescriptor(after_save=AfterSaveType.SHOW),  # Go to show view after create
            ]
        ),
        EditViewSchemaGenerator(
            actions=[
                SaveActionDescriptor(after_save=AfterSaveType.STAY),  # Stay on the form after save
            ]
        ),
    ]
```

You can also set `after_save` directly on `ActionSchema` when building a custom save action:

```python
from habarico.schema import Action, ActionSchema, ActionType, AfterSaveType

Action(
    name="save",
    label="Save and go to list",
    action=ActionSchema(
        type=ActionType.SAVE,
        after_save=AfterSaveType.LIST,
    ),
)
```

## Upload Files Action

`UploadFilesActionDescriptor` renders an "Upload files" button that lets the user bulk-upload files —
images as well as documents (PDF, DOCX, XLSX, ZIP, …) — creating one record per file. By default it
uploads to the current resource context, but it can be pointed at another resource and linked back to
the current record.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `str` | Action name. Defaults to `upload-files`. |
| `label` | `str` | Button label. Defaults to `Upload files`. |
| `icon` | `str` | Button icon. Defaults to `UploadFile`. |
| `color` | `Color` | Button color. When not set, the button inherits its color from the toolbar context. |
| `reference` | `str` | Resource where a record is created for each uploaded file. When set, the button uploads to this resource instead of the current resource context. |
| `target` | `str` | Field name on the file model linking to the parent record. When set together with `reference`, the current record's ID is used as the target value. |
| `accept` | `list[str]` | List of accepted file types (e.g. `[".pdf", ".docx"]`). When not set, the frontend uses its own default (`.png,.jpg,.jpeg,.bmp,.gif`), which accepts images only — set it whenever the action uploads other files. |
| `data` | `dict` | Additional data that will be added to each uploaded file record. |
| `file_field` | `str` | Field name on the file model that holds the uploaded file. There is no default: an action without it saves nothing. |

```python
from habarico import ModelAdmin
from habarico.schema.actions import UploadFilesActionDescriptor
from habarico.schema.generators import ShowViewSchemaGenerator

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description"]
    view_schema_generators = [
        ShowViewSchemaGenerator(
            actions=[
                UploadFilesActionDescriptor(
                    reference="attachments",     # create a record per file in the `attachments` resource
                    target="product",            # link each record to the current product
                    accept=[".pdf", ".docx"],    # accepted file types; the default admits images only
                    data={"public": True},       # extra data added to every created record
                    file_field="file",           # field on the file model that holds the file
                ),
            ]
        ),
    ]
```

In the generated schema these are nested under an `upload_files` object on the action, e.g.
`{"type": "upload-files", "upload_files": {"reference": "attachments", "target": "product", "accept": [".pdf", ".docx"], "data": {"public": true}, "file_field": "file"}}`.

## See also

- [Forms and layout](/concepts/guides/forms-and-layout) — the same layout from the frontend's side
