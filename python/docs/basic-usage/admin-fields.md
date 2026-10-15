---
title: Admin Fields
sidebar_position: 4
---

You can define admin fields that will be used to generate the DRF serializer.
These fields will be used as the default view fields too:

```python
from habarico import ModelAdmin

from .models import Category


class CategoryAdmin(ModelAdmin):
    model = Category
    read_only_fields = ["id"]  # Fields that are read only
    fields = ["id", "name", "email", "description", "is_active"]  # Fields to show in the admin interface
```

You can change fields according to the action and request with getter methods:

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product

    def get_fields(self, action=None, request=None):
        if action == "create":
            return ["name", "sku", "description", "category", "brand"]
        return ["name", "sku", "description", "short_description", "status", "category", "brand", "created_at", "updated_at"]

    def get_read_only_fields(self, action=None, request=None):
        if action == "partial_update":  # Fields that are read only in the partial update action
            return ["sku", "category", "created_at", "updated_at"]
        return ["created_at", "updated_at"]
```

The admin fields cannot be set if you define a custom serializer in the viewset or in your administration:

```python
from rest_framework import serializers
from habarico import ModelAdmin
from habarico.serializers import AdminModelSerializer

from .models import Product


class ProductSerializer(AdminModelSerializer):
    formatted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "formatted_price", "stock", "is_available"]

    def get_formatted_price(self, obj):
        return f"${obj.price:.2f}"


class ProductAdmin(ModelAdmin):
    model = Product
    base_serializer_class = ProductSerializer
```

## Validation rules in the schema

The constraints a field already carries are exported into its schema, so the frontend can reject a
value before the request is sent. Nothing has to be declared for this: the generator reads
`max_length`, `min_length`, `max_value` and `min_value` off the DRF field and takes the first
`RegexValidator` in `field.validators`.

```json
{"name": "sku", "type": "string", "options": {"validators": [{"type": "max_length", "value": 16}]}}
```

Auto-extracted rules are emitted **without a message** on purpose. DRF messages are translated on
the backend into the locale of the request that happened to fetch the schema; the frontend renders
its own translated default instead, which follows the user's language.

### Declaring rules explicitly

Pass `validators` on the field descriptor, or on a `FieldOptions` object, when a rule has no
counterpart on the model field or needs its own message:

```python
from habarico.schema import Field, MaxLengthValidatorRule, RegexValidatorRule

Field(
    name="sku",
    validators=[
        MaxLengthValidatorRule(16),
        RegexValidatorRule(r"^[A-Z]{3}-\d{4}$", "Format: ABC-1234"),
    ],
)
```

`habarico.schema` exports `MaxLengthValidatorRule`, `MinLengthValidatorRule`,
`MaxValueValidatorRule`, `MinValueValidatorRule` and `RegexValidatorRule`. For a rule type of your
own, subclass `ValidatorRule` and set `type`, or pass `type=` to it directly.

Rules from the three sources are merged **per rule type**, not one list replacing another:

```
auto-extracted  <  serializer field options  <  field descriptor
```

So a descriptor that sets only `max_length` keeps the regex rule extracted from the model. A rule
whose `value` is `None` is dropped, so a message without a value never produces a dangling rule.

:::caution
`URLValidator` is skipped — its pattern is not JavaScript-compatible. URL fields are validated on
the frontend through their format instead. The same applies to any pattern only Python understands:
write patterns both languages accept, or the rule is silently left to the backend.
:::

Frontend validation never replaces the backend one. Every rule is still enforced on save — the
schema copy only moves the first "no" closer to the user.

## File size limits

Django and DRF ship no file-size validator. `habarico.validators.MaxFileSizeValidator` fills that
gap for a file/image serializer field:

```python
from habarico.validators import MaxFileSizeValidator

class ProductSerializer(AdminModelSerializer):
    datasheet = AdminFileSerializer(validators=[MaxFileSizeValidator(5 * 1024 * 1024)])
```

It runs where every other DRF field validator runs (`Field.run_validators()`), so an oversized file
is always refused on save.

`AdminFileSerializer` / `AdminImageFileSerializer` also expose it to the frontend automatically, as
a dedicated `options.max_size` - not through the generic `options.validators` array above, since
that array only understands `{type, value, message}` rules and there is no `max_file_size` type for
the frontend's validator provider to render. A field carrying `FileExtensionValidator` (or, for
`AdminImageFileSerializer`, Django's own `validate_image_file_extension`) gets the same treatment as
`options.accept` - concrete content types guessed from the allowed extensions, or `image/*` for the
image case. Neither key is emitted when it cannot be derived, and a value already set through
`options={"max_size": ...}` on the field always wins over the derived one.

```json
{"name": "datasheet", "options": {"max_size": 5242880, "accept": ["application/pdf"]}}
```

This is a courtesy, not the enforcement — the backend always validates on save regardless. See
[`habarico_enterprise.uploads`](../chunked-uploads/frontend-contract.md#per-field-size-limits) for
what a chunked-upload install adds on top: the project-wide `MAX_UPLOAD_SIZE` ceiling folded into
`max_size` for a field a provider actually serves, and the hard content-type blocklist that guards
what its `initiate` endpoint actually accepts - `options.accept` reflects a field's own declared
types either way, but says nothing about that floor.

## See also

- [Validator provider](/node/providers/validator-provider) — how the frontend maps these rules, and how to add a validator for a custom type
- [Field descriptor reference](../view-generators/field-descriptor-reference.md) — `validators` among the other descriptor options
