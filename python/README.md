# habarico

Habarico is a schema-driven admin library for Django REST Framework. It turns Django models into a
complete admin API: REST endpoints plus JSON schemas describing resources, fields, views and
actions. The [React frontend](https://docs.habarico.com/node/intro) renders the whole admin UI from
those schemas — no screen is written per resource.

## Installation

```bash
pip install habarico
```

Add the app to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    ...,
    "phonenumber_field",  # required for phone number field localization
    "habarico",
    "rest_framework",  # after habarico, which overrides its localization
    ...
]
```

And mount the admin site in `urls.py`:

```python
from django.urls import include, path
from habarico import site

urlpatterns = [
    path("admin/", include(site.urls)),
]
```

## Quick start

```python
# admin.py
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    fields = ["name", "sku", "description", "status", "category", "price", "stock"]
    read_only_fields = ["created_at"]
    search_fields = ["name", "description"]
    filter_fields = ["status", "category", "price"]
    ordering_fields = ["name", "price"]
    can_create = True
    can_update = True
```

Importing the module registers the admin — that is a full CRUD resource: a list with filters and
sorting, a detail page, a create and an edit form.

## Documentation

Full documentation is at **[docs.habarico.com/python](https://docs.habarico.com/python/intro)** —
this file is only a quick start.

| Section | What it covers |
| --- | --- |
| [Installation](https://docs.habarico.com/python/installation) and [configuration](https://docs.habarico.com/python/configuration) | Settings, permissions and authentication classes |
| [Basic usage](https://docs.habarico.com/python/basic-usage/) | Fields, permissions, custom serializers and viewsets, configuration validation |
| [View generators](https://docs.habarico.com/python/view-generators/) | Shaping the list, detail and form views |
| [Filtering and searching](https://docs.habarico.com/python/filtering-and-searching/) | Filters, ordering and fulltext search |
| [Aggregations](https://docs.habarico.com/python/aggregations/) and [dashboard](https://docs.habarico.com/python/dashboard) | The `/aggregate` endpoint and the widgets built on it |
| [Chunked uploads](https://docs.habarico.com/python/chunked-uploads/) | Large files over TUS or S3 multipart |
| [AI integration](https://docs.habarico.com/python/ai-integration/) | Predictive fields and the assistant endpoints |
| [User preferences](https://docs.habarico.com/python/user-preferences/) | The per-user preference store the frontend syncs to |
| [Complete example](https://docs.habarico.com/python/complete-example) | One resource wired up end to end |

The frontend consuming these schemas is documented at
[docs.habarico.com/node](https://docs.habarico.com/node/intro), and the contract between them is
the [API reference](https://docs.habarico.com/api).

## License

This software is proprietary and confidential.
It is licensed for internal use only within Eluvia s.r.o.
Unauthorized copying, distribution, or use outside the company
is strictly prohibited.
