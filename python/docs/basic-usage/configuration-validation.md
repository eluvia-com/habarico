---
title: Configuration Validation
sidebar_position: 12
---

An admin declaration is checked against its model once, while the class is being registered.

A typo, a renamed model field or a wrong base class is reported at app startup with the attribute
and the value that caused it — instead of surfacing later as an opaque DRF or ORM traceback the
first time a request reaches the resource.

## What it looks like

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    search_fields = ["nmae"]  # typo


# Raised while the class is being registered, at app startup:
# ImproperlyConfigured: ProductAdmin.search_fields = 'nmae': does not resolve to a field on
# Product. Did you mean 'name'?
```

Validation runs from `AdminSite.register()` — once per admin class, not per instantiation.
`get_admin()` and `get_schema()` build a fresh admin for every request, so a per-instance check
would be paid on every call.

## The checks

`Admin.validate_configuration()` is the entry point; it delegates to
`configuration_validator_class` — `AdminConfigurationValidator` from `habarico.validation`. The
checks live on the validator, not on the admin: an admin class declares configuration, it does not
validate it.

With `habarico-enterprise` installed, `configuration_validator_class` points at the composed
`habarico_enterprise.validation.AdminConfigurationValidator`, which adds the checks over the
attributes its own `ModelAdmin` mixins contribute — `aggregate_max_buckets` and
[`aggregate_fields`](../aggregations/field-aggregation-whitelist.md).

`AdminConfigurationValidator.validate()` calls five methods, one per slice:

| Method | What it checks |
|---|---|
| `validate_classes()` | `model` is a Django `Model` subclass; `base_viewset` subclasses `AdminModelViewSet` and `base_serializer_class` subclasses `AdminModelSerializer`; `menu_schema_generator` is a `MenuSchemaGenerator` or `None` (which hides the resource from the menu); `schema_generator_class` is the expected generator subclass; every entry of `view_schema_generators` / `action_schema_generators` is a `ViewSchemaGenerator` / `ActionSchemaGenerator` instance; a `base_viewset.filterset_class` subclasses `django_filters.FilterSet` and its `Meta.model`, when declared, matches `model` |
| `validate_constraints()` | Numeric and value constraints. Core declares none — this is the method a validator subclass overrides (calling `super()`) to check its own attributes, as habarico-enterprise does for `aggregate_max_buckets > 0` |
| `validate_field_lists()` | `search_fields`, `filter_fields`, `ordering_fields`, `fields` and `read_only_fields` resolve against the model — `__` relation paths are followed, and `search_fields` / `filter_fields` may end in a lookup (`name__icontains`) |
| `validate_descriptors()` | Every `Field` / `Filter` / `Sorting` / `FieldWrapper` nested in the boxes of `view_schema_generators` resolves against the model, recursively through `TabBox` / `WizardBox` / `GridBox`, switching to the related model inside an `ObjectBox` / `ArrayBox` |
| `validate_actions()` | The built-in action names `create` / `show` / `edit` / `delete`, wherever they are referenced (`row_actions`, `toolbar_actions`, `bottom_actions`, `list_actions`, `double_click_action`, `single_click_action`), agree with the matching `can_create` / `can_read` / `can_update` / `can_delete` flag — on the admin that owns the action, which a descriptor's `reference` names |

Two cases are deliberately left alone:

- A descriptor name that does not resolve on the model but **is** declared on
  `base_serializer_class` — a `SerializerMethodField`, or a nested serializer with a remapping
  `source=` — is accepted. That structure is the serializer's business.
  `ListBox` / `GalleryBox` contents point at another resource and are not checked here either.
- **Custom action names** (a `@action`-decorated viewset method, `Action(name="reorder")`) have no
  static registry to compare against, so only the four built-in ones are validated.
- **A `reference` this registry cannot resolve** — another service, or an admin that registers after
  this one — leaves the flag unknowable at registration time, so the descriptor is passed over and
  `AdminPermission` settles it per request.

## Extending or opting out

Subclass the validator to add project-specific checks, or to drop a slice:

```python
from habarico import ModelAdmin
from habarico.validation import AdminConfigurationValidator

from .models import Product


class ShopValidator(AdminConfigurationValidator):
    def validate(self) -> None:
        super().validate()
        if not self.admin.icon:
            raise self.error("icon", self.admin.icon, "must be set on every shop admin")

    def validate_actions(self) -> None:
        pass  # this project's action names are validated elsewhere


class ProductAdmin(ModelAdmin):
    model = Product
    configuration_validator_class = ShopValidator
```

Set `configuration_validator_class = None` to skip validation for one admin entirely, or override
`validate_configuration()` when a check needs the admin instance itself.

:::note
On a `habarico-enterprise` install, subclass
`habarico_enterprise.validation.AdminConfigurationValidator` rather than the core one — a project
validator built on `habarico.validation.AdminConfigurationValidator` drops the enterprise checks
(`aggregate_max_buckets`, `aggregate_fields`) for that admin.
:::

:::caution
The validation runs at import time, so a broken declaration stops the app from booting rather than
failing a single request. That is the intent — but it also means a stale admin left in a rarely
imported module will surface the moment the module is imported, not when someone opens the screen.
:::

## See also

- [Admin fields](./admin-fields.md) — the attributes most of these checks read
- [Field/aggregation whitelist](../aggregations/field-aggregation-whitelist.md) — the aggregate half of the same entry point
- [View generators](../view-generators/index.md) — where the validated descriptors are declared
