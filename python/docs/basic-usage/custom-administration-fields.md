---
title: Custom Administration Fields
sidebar_position: 9
---

There are several custom fields that can be used in the administration:

## TextField

`TextField` can be used to render a text area field:

```python
from habarico.serializers import AdminModelSerializer, TextField

from .models import Product


class ProductAdminSerializer(AdminModelSerializer):
    content = TextField()

    class Meta:
        model = Product
        fields = ["name", "description", "short_description"]
```

## RichTextField

For a WYSIWYG editor you can use `RichTextField`:

```python
from habarico.serializers import AdminModelSerializer, RichTextField

from .models import Product


class ProductAdminSerializer(AdminModelSerializer):
    content = RichTextField()

    class Meta:
        model = Product
        fields = ["name", "description", "short_description"]
```

## AdminImageFileSerializer

`AdminImageFileSerializer` field is used to upload images. You can tell React admin to modify the image before upload.
Example usage that will resize the image to 100px width and crop with a 1.5 aspect ratio:

```python
from habarico.serializers import AdminModelSerializer, AdminImageFileSerializer

from .models import Category


class CategoryAdminSerializer(AdminModelSerializer):
    avatar = AdminImageFileSerializer(options={"resize_width": 100, "crop_aspect_ratio": 1.5})

    class Meta:
        model = Category
        fields = ["name", "email", "description", "avatar"]
```

## AdminFileSerializer

`AdminFileSerializer` field is used to upload generic files. You can control where the file link opens
using the `target` option (standard HTML anchor target values: `_blank`, `_self`, `_parent`, `_top`).
The default behaviour (when `target` is not set) opens the file in a new tab (`_blank`).

```python
from habarico.serializers import AdminModelSerializer, AdminFileSerializer

from .models import Product


class ProductAdminSerializer(AdminModelSerializer):
    attachment = AdminFileSerializer(options={"target": "_self"})  # Open file in the same tab

    class Meta:
        model = Product
        fields = ["name", "description", "attachment"]
```

## AdminUUIDRelatedField

`AdminUUIDRelatedField` can be used to render a select box that will read foreign objects with UUID values
from another admin service.

```python
from habarico.serializers import AdminModelSerializer
from habarico.serializers.fields import AdminUUIDRelatedField

from .models import Product


class ProductAdminSerializer(AdminModelSerializer):
    product = AdminUUIDRelatedField(reference='inventory/product')  # Reference to the related admin resource (service name is inventory, resource name is product)

    class Meta:
        model = Product
        fields = ["name", "description", "product"]
```

## AdminPrimaryKeyRelatedField

`AdminPrimaryKeyRelatedField` can be used to render a select box that will read foreign objects with primary key values.
Returned values can be restricted with the `filter` parameter. This parameter is sent to the client to filter the related objects.:

```python
from habarico.serializers import AdminModelSerializer, AdminPrimaryKeyRelatedField

from .models import Product


class ProductAdminSerializer(AdminModelSerializer):
    category = AdminPrimaryKeyRelatedField(reference='category', filter={"is_active": True})

    class Meta:
        model = Product
        fields = ["name", "description", "category"]
```

## TreePrimaryKeyRelatedField

`TreePrimaryKeyRelatedField` can be used to render a foreign key field with a tree structure.
React admin will render the field as a tree view (https://mui.com/x/react-tree-view/).

```python
from habarico.serializers import AdminModelSerializer, TreePrimaryKeyRelatedField

from .models import Product


class ProductSerializer(AdminModelSerializer):
    category = TreePrimaryKeyRelatedField(
        reference='category',
        parent_field='parent',  # Field name that defines the parent category
        order_field='position'  # Field name that defines the order within siblings
    )

    class Meta:
        model = Product
        fields = ["name", "description", "category"]
```

## AdminChoiceField

Standard choice field that extends the schema with icon key information.
It tells React admin where to find icons that will be rendered with the select box choices.
This logic must be partly implemented on the frontend side.

```python
from habarico.serializers import AdminModelSerializer, AdminChoiceField

from .models import Product


class ProductSerializer(AdminModelSerializer):
    status = AdminChoiceField(
        choices=Product.Status.choices,
        icons_key='product_statuses'  # Key to look up icons on the frontend
    )

    class Meta:
        model = Product
        fields = ["name", "description", "status"]
```

## AdminCharField

`AdminCharField` is a standard DRF `CharField` that extends the `AdminOptionsFieldMixin` class. It can be used to
define `show_query` or `required_query` for the field.

```python
from rest_framework.fields import ChoiceField
from habarico.serializers import AdminModelSerializer, AdminCharField

from .models import Product


class ProductSerializer(AdminModelSerializer):
    status = ChoiceField(
        choices=Product.Status.choices,
        label="Status",
    )
    rejection_reason = AdminCharField(
        required=False,
        allow_null=True,
        label="Rejection Reason",
        show_query='status == "archived"',  # Show this field only if status is archived
        required_query='status == "archived"',  # This field is required only if status is archived
    )

    class Meta:
        model = Product
        fields = ["name", "description", "status", "rejection_reason"]
```

## AdminDecimalField

`AdminDecimalField` is used to render a decimal field with number formatting. It is used as a standard decimal field for model `DecimalField`.

```python
from habarico.serializers import AdminModelSerializer, AdminDecimalField

from .models import Product


class ProductSerializer(AdminModelSerializer):
    price = AdminDecimalField(
        decimal_places=2,  # Number of decimal places
        max_digits=10,  # Maximum number of digits
        currency='USD',  # Currency symbol
    )

    class Meta:
        model = Product
        fields = ["name", "price", "stock"]
```

## AdminIntegerField

`AdminIntegerField` is used to render an integer field with number formatting. It is used as a standard integer field for model `IntegerField`.

```python
from habarico.serializers import AdminModelSerializer, AdminIntegerField

from .models import Product


class ProductSerializer(AdminModelSerializer):
    stock = AdminIntegerField(
        unit='pcs',  # Unit of measure
    )

    class Meta:
        model = Product
        fields = ["name", "price", "stock"]
```

## AdminFloatField

`AdminFloatField` is used to render a float field with number formatting. It is used as a standard float field for model `FloatField`.

```python
from habarico.serializers import AdminModelSerializer, AdminFloatField

from .models import Product


class ProductSerializer(AdminModelSerializer):
    priority = AdminFloatField(
        minimum_fraction_digits=1,  # Minimum number of decimal places
        maximum_fraction_digits=2,  # Maximum number of decimal places
    )

    class Meta:
        model = Product
        fields = ["name", "description", "priority"]
```

## AdminPhoneNumberField

`AdminPhoneNumberField` is a field based on the `django-phonenumber-field` library. It supports international phone numbers and their validation.
If you use the `habarico.models.PhoneNumberField` model field, the serializer will automatically use `AdminPhoneNumberField`.

```python
from habarico.serializers import AdminModelSerializer, AdminPhoneNumberField

from .models import Category


class CategorySerializer(AdminModelSerializer):
    phone = AdminPhoneNumberField(
        region='us',  # Default region
        allowed_regions=['us', 'ca', 'gb'],  # Allowed regions
    )

    class Meta:
        model = Category
        fields = ["name", "email", "phone"]
```
