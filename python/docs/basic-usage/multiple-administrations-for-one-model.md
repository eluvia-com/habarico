---
title: Multiple Administrations for One Model
sidebar_position: 2
---

You can create multiple admin classes for the same model. This is useful when you want to have different admin
interfaces for the same model. For this purpose you must define a different `name` parameter (name must be unique
throughout the application) in the admin class. The `name` parameter is used to create the URL path for the admin
interface.

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    """Full product administration with all fields."""
    model = Product
    search_fields = ["name", "description", "short_description"]
    fields = ["name", "sku", "description", "short_description", "status", "category", "brand", "tags"]
    can_create = True
    can_update = True
    can_delete = True


class ReadOnlyProductAdmin(ModelAdmin):
    """Read-only product view for content reviewers."""
    model = Product
    name = "readonly_product"  # This will generate the URL path /admin/readonly_product/
    search_fields = ["name"]
    fields = ["name", "description", "status"]
    can_create = False
    can_read = True
    can_update = False
    can_delete = False
```
