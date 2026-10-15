---
title: Custom Model Fields
sidebar_position: 10
---

You can use custom model fields to render custom fields in the admin interface.

## MoneyField

`MoneyField` is used to render a money field with number formatting. It is used as a standard decimal field for model `DecimalField`.

```python
from django.db import models
from habarico.models import MoneyField


class Product(models.Model):
    name = models.CharField(max_length=100)
    price = MoneyField(
        decimal_places=2,  # Number of decimal places
        max_digits=10,  # Maximum number of digits
        currency='USD',  # Currency symbol
    )
    stock = models.IntegerField(default=0)
```

## PhoneNumberField

`PhoneNumberField` is used to render a phone field with phone number formatting. It is based on the `django-phonenumber-field` library.

```python
from django.db import models
from habarico.models import PhoneNumberField


class Category(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = PhoneNumberField(
        region='us',  # Default region
        allowed_regions=['us', 'ca', 'gb'],  # Allowed regions
    )
```

## Locale Fields — premium

Locale model fields for internationalization moved to `habarico-enterprise`. Currently, the
following Czech locale fields are supported:

| Field | Description |
|-------|-------------|
| `habarico_enterprise.models.localflavor.cz.CzechBirthNumberField` | Czech birth number (rodné číslo) |
| `habarico_enterprise.models.localflavor.cz.CzechBankAccountNumber` | Czech bank account number |
| `habarico_enterprise.models.localflavor.cz.CzechDicField` | Czech VAT ID (DIČ) |
| `habarico_enterprise.models.localflavor.cz.CzechIcoField` | Czech company ID (IČO) |
| `habarico_enterprise.models.localflavor.cz.CzechIdCardNumberField` | Czech ID card number |

Example usage:

```python
from django.db import models
from habarico_enterprise.models.localflavor.cz.ico import CzechIcoField
from habarico_enterprise.models.localflavor.cz.dic import CzechDicField
from habarico_enterprise.models.localflavor.cz.birth_number import CzechBirthNumberField


class CzechCompany(models.Model):
    """Model for Czech companies with localized fields."""
    name = models.CharField(max_length=200)
    ico = CzechIcoField(blank=True, null=True)  # Czech company ID
    dic = CzechDicField(blank=True, null=True)  # Czech VAT ID


class Person(models.Model):
    """Model for persons with Czech birth number."""
    name = models.CharField(max_length=100)
    birth_number = CzechBirthNumberField(blank=True, null=True)
```
