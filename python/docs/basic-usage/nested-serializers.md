---
title: Nested Serializers
sidebar_position: 8
---

You can use nested DRF serializers to display and edit nested objects in the form view.
Nested serializers will be automatically saved and updated when the parent object is created or updated.
Be careful with nested serializers: you must use `ModelSerializer` or `AdminModelSerializer` (from `habarico` library)
as a base class for your serializers. For M2M nesting, it is required to use `Meta` inheritance.

```python
from habarico import ModelAdmin
from habarico.serializers import AdminModelSerializer, ModelSerializer
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import Box, ObjectBox

from .models import Product, Category


class CategorySerializer(ModelSerializer):
    """Nested serializer for category data."""

    class Meta(ModelSerializer.Meta):  # Don't forget to inherit from ModelSerializer.Meta
        model = Category
        fields = ["name", "email", "description"]


class ProductSerializer(AdminModelSerializer):
    """Product serializer with nested category."""
    category_details = CategorySerializer(source="category", allow_null=True)  # Nested category data


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["id", "name", "description", "category_details"]
    base_serializer_class = ProductSerializer
    view_schema_generators = [
        EditViewSchemaGenerator(box=Box(
            boxes=[
                Box(
                    label="Product",
                    boxes=["name", "description"],
                ),
                ObjectBox(
                    label="Category Information",
                    boxes=["name", "email", "description"],
                    target="category_details",
                ),
            ]
        ))
    ]
```

For many-to-many or reverse relations you can use `ArrayBox`:

```python
from habarico import ModelAdmin
from habarico.serializers import AdminModelSerializer, ModelSerializer
from habarico.schema.generators import EditViewSchemaGenerator
from habarico.schema.boxes import Box, ArrayBox

from .models import Product, Tag


class TagSerializer(ModelSerializer):
    """Nested serializer for tags."""

    class Meta(ModelSerializer.Meta):  # Don't forget to inherit from ModelSerializer.Meta
        model = Tag
        fields = ["pk", "name"]  # Include pk field to be able to update tags; without it, tags will be created every time


class ProductSerializer(AdminModelSerializer):
    """Product serializer with nested tags."""
    tags = TagSerializer(many=True)  # Tags will be saved with the product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["id", "name", "description", "tags"]
    base_serializer_class = ProductSerializer
    view_schema_generators = [
        EditViewSchemaGenerator(box=Box(
            boxes=[
                Box(
                    label="Product",
                    boxes=["name", "description"],
                ),
                ArrayBox(
                    label="Tags",
                    boxes=["name"],
                    target="tags",
                ),
            ]
        ))
    ]
```
