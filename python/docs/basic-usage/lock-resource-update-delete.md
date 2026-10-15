---
title: Lock Resource Update/Delete
sidebar_position: 5
---

By default, the update and delete operations of the resource are locked during the HTTP request.
Therefore, more than one request cannot update or delete the resource at the same time.
This solves the problem of unexpected request results.
This behaviour can be changed with the `auto_advisory_lock_for_update_enabled`
or `auto_advisory_lock_for_destroy_enabled` property.

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    auto_advisory_lock_for_update_enabled = False  # Disable advisory lock for update
    auto_advisory_lock_for_destroy_enabled = False  # Disable advisory lock for destroy
```

The name of the advisory lock can be changed inside the method `get_advisory_lock_name`:

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product

    def get_advisory_lock_name(self, action: str) -> str:
        return f"product_lock_{action}"
```
