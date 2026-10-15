---
title: Custom Filtersets
sidebar_position: 6
---

For more complex filtering logic, you can define a custom filterset, you can find more about filtersets in the
`django-filter` documentation: https://django-filter.readthedocs.io/en/stable/

```python
from django_filters import rest_framework as filters
from habarico import ModelAdmin

from .models import Product


class ProductFilterSet(filters.FilterSet):
    """Custom filterset with advanced filtering options."""

    title = filters.CharFilter(lookup_expr='icontains')
    min_views = filters.NumberFilter(field_name='stock', lookup_expr='gte')
    max_views = filters.NumberFilter(field_name='stock', lookup_expr='lte')
    published_after = filters.DateFilter(field_name='published_at', lookup_expr='gte')
    published_before = filters.DateFilter(field_name='published_at', lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['status', 'category', 'brand']


class ProductAdmin(ModelAdmin):
    model = Product
    filterset_class = ProductFilterSet
    fields = ["name", "sku", "description", "status", "category", "brand", "stock", "created_at"]
```
