---
title: Complete example
sidebar_position: 12
---

A whole resource wired up end to end: models, admin classes, view generators and per-action
read-only fields. Everything here is covered in more detail by the pages it links to.

The domain is the one used across this documentation — an e-shop with products, categories and
brands.

## Models

```python
# models.py
from django.db import models
from habarico.models import MoneyField


class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=100)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=200)
    sku = models.SlugField(unique=True)
    description = models.TextField()
    short_description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)

    price = MoneyField(currency="CZK")
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
```

## Admin classes

```python
# admin.py
from habarico import ModelAdmin
from habarico.schema import Field
from habarico.schema.boxes import Box, TabBox
from habarico.schema.generators import (
    CreateViewSchemaGenerator,
    EditViewSchemaGenerator,
    ListViewSchemaGenerator,
    ShowViewSchemaGenerator,
)

from .models import Brand, Category, Product, Tag


class CategoryAdmin(ModelAdmin):
    model = Category
    label = "Categories"
    icon = "Category"
    search_fields = ["name", "description"]
    filter_fields = ["name", "created_at"]
    fields = ["name", "description", "created_at"]
    read_only_fields = ["created_at"]
    ordering_fields = ["name", "created_at"]


class BrandAdmin(ModelAdmin):
    model = Brand
    label = "Brands"
    icon = "Storefront"
    search_fields = ["name"]
    filter_fields = ["name", "is_active"]
    fields = ["name", "website", "is_active"]
    ordering_fields = ["name"]


class TagAdmin(ModelAdmin):
    model = Tag
    label = "Tags"
    icon = "Label"
    search_fields = ["name"]
    fields = ["name"]


class ProductAdmin(ModelAdmin):
    model = Product
    label = "Products"
    icon = "Inventory"
    search_fields = ["name", "description", "short_description"]
    filter_fields = ["name", "status", "category", "brand", "price", "created_at"]
    fields = [
        "name",
        "sku",
        "description",
        "short_description",
        "status",
        "category",
        "brand",
        "tags",
        "price",
        "stock",
        "created_at",
        "updated_at",
        "published_at",
    ]
    read_only_fields = ["created_at", "updated_at"]
    ordering_fields = ["name", "price", "created_at"]

    view_schema_generators = [
        ListViewSchemaGenerator(
            boxes=[
                Field(name="name", label="Product"),
                "status",
                "category",
                "price",
                "stock",
                "created_at",
            ],
            filters=["status", "category", "brand"],
            default_sorting="-created_at",
        ),
        CreateViewSchemaGenerator(
            boxes=["name", "sku", "description", "category", "brand", "tags", "price"]
        ),
        EditViewSchemaGenerator(
            box=TabBox(
                boxes=[
                    Box(label="Basics", boxes=["name", "sku", "description", "short_description"]),
                    Box(label="Pricing", boxes=["price", "stock"]),
                    Box(label="Publishing", boxes=["status", "published_at"]),
                    Box(label="Categorisation", boxes=["category", "brand", "tags"]),
                    Box(label="Audit", is_readonly=True, boxes=["created_at", "updated_at"]),
                ]
            )
        ),
        ShowViewSchemaGenerator(
            boxes=[
                "name",
                "description",
                "short_description",
                "status",
                "category",
                "brand",
                "tags",
                "price",
                "stock",
                "created_at",
                "updated_at",
            ]
        ),
    ]

    def get_read_only_fields(self, action=None, request=None):
        # The SKU identifies the product downstream — it may be set once, then never changed.
        if action == "partial_update":
            return ["sku", "created_at", "updated_at"]
        return ["created_at", "updated_at"]
```

:::tip
`get_read_only_fields` is evaluated per action *and* per request, so the same view can be editable
for one user and read-only for another. The frontend renders a read-only field with the display
components instead of an input — see
[SchemaEdit](/node/view-components/schema-edit-component#read-only-fields).
:::

## What the frontend does with it

| Declared here | Rendered as |
|---|---|
| `status` with `choices` | [ChoicesField](/node/field-components/choices-field) / [ChoicesInput](/node/input-components/choices-input) |
| `category`, `brand` foreign keys | [SchemaReferenceField](/node/field-components/reference-field) with a link to the record |
| `tags` many-to-many | [SchemaArrayInput](/node/input-components/array-input) as an autocomplete multi-select |
| `price` as `MoneyField` | [NumberField](/node/field-components/number-field) formatted as CZK currency |
| `TabBox` in the edit generator | A tabbed form, with the open tab kept in the URL |

## See also

- [Admin fields](./basic-usage/admin-fields.md) — `fields`, `read_only_fields` and their getters
- [View generators](./view-generators/index.md) — shaping each view
- [Filtering and searching](./filtering-and-searching/index.md) — `filter_fields`, `search_fields`, `ordering_fields`
- [Permissions](./basic-usage/permissions.md) — restricting what a user may do
