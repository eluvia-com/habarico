---
title: Basic usage
sidebar_position: 1
---

A resource is one `ModelAdmin` subclass. It names the model, lists the fields, and the library
derives the REST endpoints and the schema the frontend renders from that.

```python
# admin.py
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "status", "category", "price", "stock", "created_at"]
    read_only_fields = ["created_at"]
    search_fields = ["name", "description"]
    filter_fields = ["status", "category", "price"]
    ordering_fields = ["name", "price", "created_at"]
```

That is a complete admin screen: a list with filters and sorting, a detail, a create and an edit
form.

## Attributes at a glance

| Attribute | Purpose |
|---|---|
| `model` | The Django model this admin exposes |
| `fields` | Fields in the generated serializer and, by default, in every view |
| `read_only_fields` | Fields shown but never written |
| `search_fields` | Fields the fulltext search looks in |
| `filter_fields` | Fields offered as filters |
| `ordering_fields` | Fields the list may be sorted by |
| `can_create` / `can_read` / `can_update` / `can_delete` | Which operations are allowed at all |
| `base_serializer_class` | A serializer of your own instead of the generated one |
| `base_viewset` | A viewset of your own instead of the generated one |
| `view_schema_generators` | Per-view shaping — see [View generators](../view-generators/index.md) |
| `action_schema_generators` | Which actions the resource exposes — see [View generators](../view-generators/index.md) |
| `menu_schema_generator` | Where the resource sits in the menu — see [Menu customisation](../menu-customisation.md) |
| `label`, `icon`, `color` | How the resource is presented in the menu |
| `name` | Resource name; defaults to the lower-cased model name and must be unique |
| `abstract` | Keeps the class out of the registry, for a shared base admin |
| `permission_classes` | DRF permissions for this resource only — see [Permissions](./permissions.md) |
| `aggregate_enabled`, `aggregate_fields`, `aggregate_max_buckets` | The `/aggregate` endpoint — see [Aggregations](../aggregations/index.md) |
| `dashboard_enabled` | Whether dashboard widgets may use this resource — see [Dashboard](../dashboard.md) |
| `auto_advisory_lock_for_update_enabled` / `..._for_destroy_enabled` | Take a DB advisory lock around update / destroy (both default `True`) |

Every list attribute has a matching getter for the cases where it depends on the request:
`get_fields(action=None, request=None)`, `get_read_only_fields(action=None, request=None)`,
`get_search_fields()`, `get_filter_fields()`, `get_ordering_fields()` and `get_label()`.

## Where to go next

| Page | When you need it |
|---|---|
| [Admin fields](./admin-fields.md) | Choosing fields per action and per request |
| [Custom administration fields](./custom-administration-fields.md) | Fields that are not model fields |
| [Custom model fields](./custom-model-fields.md) | Teaching the generator about a field type of your own |
| [Nested serializers](./nested-serializers.md) | Writing related records from one form |
| [Permissions](./permissions.md) | Restricting what a user may see and do |
| [Multiple administrations for one model](./multiple-administrations-for-one-model.md) | Two screens over the same table |
| [Locking update and delete](./lock-resource-update-delete.md) | Making a record read-only under a condition |
| [View and action URLs](./view-and-action-urls.md) | How the generated routes are laid out |
| [Custom schema generators](./custom-schema-generators.md) | Changing what the schema says |
| [Configuration validation](./configuration-validation.md) | Why a misconfigured admin fails at startup, and how to extend the checks |

## Custom viewset

When the behaviour of an operation has to change — archiving instead of deleting, say — replace
the viewset rather than the schema:

```python
from habarico import ModelAdmin
from habarico.views import AdminModelViewSet

from .models import Product


class ArchivingViewSet(AdminModelViewSet):
    """Archive products instead of deleting them."""

    def perform_destroy(self, instance):
        instance.status = "archived"
        instance.save()


class ProductAdmin(ModelAdmin):
    model = Product
    base_viewset = ArchivingViewSet
    fields = ["name", "sku", "description", "status", "category", "price"]
```

:::tip
The frontend needs no change for this — the delete button already calls the endpoint, and the
endpoint now archives. That is the point of the schema contract: behaviour stays on the backend.
:::

## See also

- [Complete example](../complete-example.md) — the whole thing in one file
- [How it works](/concepts/how-it-works) — what happens between this class and the screen
- [SchemaResource](/node/base-components/schema-resource) — the frontend counterpart
- [Quickstart](/concepts/guides/quickstart) — this class in a working setup
