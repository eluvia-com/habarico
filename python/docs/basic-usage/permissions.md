---
title: Permissions
sidebar_position: 3
---

Access to the admin API as a whole is controlled by `DEFAULT_PERMISSION_CLASSES` in the
`ADMIN_REST_FRAMEWORK` settings block — anonymous requests are rejected by default; see
[Configuration](../configuration.md#permissions-and-authentication). The properties below control
what an already-permitted user may do with each resource.

The most common way to define view permissions is to use the `can_<create|read|update|delete>` properties:

```python
from habarico import ModelAdmin

from .models import Category


class CategoryAdmin(ModelAdmin):
    model = Category
    search_fields = ["name", "description"]
    filter_fields = ["name", "created_at"]
    fields = ["name", "description", "created_at"]
    can_create = True  # Allow to create new instances
    can_read = True  # Allow to read instances
    can_update = True  # Allow to update instances
    can_delete = True  # Allow to delete instances
```

The default value for all permission properties except `can_read` is `False`.

## Per-User Rules

Each property also accepts a **method taking the request**, for rules that depend on who is asking
— without writing a permission class of your own:

```python
class CategoryAdmin(ModelAdmin):
    model = Category
    can_read = True

    def can_update(self, request):
        return request.user.is_staff
```

`has_read_permission(request)` and its `has_create_` / `has_update_` / `has_delete_` counterparts
resolve the declaration whichever shape it was given, and are what the admin API asks before
serving an action.

Where there is no request to ask — the registration-time configuration checks, and the schema that
tells the frontend which views a resource has — a method counts as *may be allowed*: the view stays
declared and the permission is settled on the request that actually reaches it. A literal `False`
is knowable without a request, so it drops the view outright.

:::caution
The callable form has to be a **method**, not a lambda assigned to the property. A function stored
on a class is a descriptor, so it is reached as a bound method and the request arrives as its
*second* argument — `can_update = lambda request: ...` raises `TypeError: <lambda>() takes 1
positional argument but 2 were given`.
:::

## Complex Permissions

If you need more complex permissions you need to define a DRF view class and set its permission classes:

```python
from habarico import ModelAdmin
from habarico.views import AdminModelViewSet
from rest_framework.permissions import BasePermission

from .models import Product


class IsProductCategoryPermission(BasePermission):
    """Only allow categories to edit their own products."""

    def has_object_permission(self, request, view, obj):
        if request.method in ["PUT", "PATCH", "DELETE"]:
            return obj.category.email == request.user.email
        return True


class ProductModelView(AdminModelViewSet):
    """Custom viewset with category-based permissions."""
    permission_classes = [IsProductCategoryPermission]


class ProductAdmin(ModelAdmin):
    model = Product
    base_viewset = ProductModelView
    search_fields = ["name", "description"]
    fields = ["name", "sku", "description", "status", "category", "brand"]
```

## See also

- [Permissions and visibility](/concepts/guides/permissions) — how these rules reach the screen
