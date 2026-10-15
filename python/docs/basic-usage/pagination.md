---
title: Pagination
sidebar_position: 6
---

A list endpoint answers one page at a time — `limit` objects from `offset` — and both the page size
a request gets by default and the largest one it may ask for are configurable, per project and per
resource.

## Declaration

```python
# admin.py
from habarico import ModelAdmin

from .models import Order


class OrderAdmin(ModelAdmin):
    model = Order
    fields = ["number", "customer", "status", "total", "created_at"]
    default_page_limit = 50
    max_page_limit = 200
```

`GET /admin/order/` now answers with 50 orders, `?limit=200` with 200, and `?limit=201` with a
`422`.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `default_page_limit` | `int` | `None` | Page size for a request that sends no `limit`. `None` defers to the project configuration. `0` is a valid value — see [Meta-only requests](#meta-only-requests). |
| `max_page_limit` | `int` | `None` | Largest `limit` this resource accepts; above it the request is refused with `422`. `None` defers to the project configuration. |

## Project configuration

The same two knobs configure every resource at once, in the admin API's own settings block:

```python
# settings.py
ADMIN_REST_FRAMEWORK = {
    "DEFAULT_PAGE_LIMIT": 50,
    "MAX_PAGE_LIMIT": 200,
}
```

They live in `ADMIN_REST_FRAMEWORK` rather than in `REST_FRAMEWORK` for the same reason the
permissions do: the admin API is paginated independently of the rest of your API.

A value is looked up in three places, the first one that has an opinion winning:

1. the `ModelAdmin` being listed,
2. `ADMIN_REST_FRAMEWORK`,
3. the `DEFAULT_PAGE_LIMIT` / `MAX_PAGE_LIMIT` Django settings, which `eluvia-base-django` applies
   to every paginated endpoint of the project, and finally its own class defaults.

Both Django settings are optional, so with none of the three layers set the page size is `20` and
the ceiling is `1000` — the same numbers the Ruby gem paginates by.

:::tip
To lift the ceiling altogether, set `"MAX_PAGE_LIMIT": None` — an explicit `None` means "no
bound", while leaving the key out means "not configured here". A resource declares a number or
nothing at all; only the project can remove the bound.
:::

## Per-request limits

Both values are resolved by getters on the paginator, so a rule that depends on the request — a
larger ceiling for an internal client, a smaller page for a heavy report — is a paginator
subclass:

```python
# pagination.py
from habarico.pagination import AdminModelPagination


class InternalAwarePagination(AdminModelPagination):
    def get_max_limit(self, request):
        if request.user.is_staff:
            return 1000
        return super().get_max_limit(request)
```

```python
ADMIN_REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "myproject.pagination.InternalAwarePagination",
}
```

`super()` keeps the layers below — the admin attribute, then the settings — so the override only
has to describe the case it exists for. The admin being listed is on `self.view.admin`.

## Rejected requests

A `limit` that is not a page size is refused with `422 Unprocessable Entity`, with the error
attached to the `limit` field:

```json
{
  "errors": [
    {
      "error": "Unprocessable Entity",
      "status": 422,
      "message": "Limit 500 exceeds the maximum allowed limit of 200.",
      "source": "limit",
      "timestamp": "2026-09-18T09:15:44.031Z"
    }
  ]
}
```

Refused: a `limit` above `max_page_limit`, a non-numeric one, and a negative one. Accepted: a
missing or empty `limit`, which falls back to the default page size.

:::caution
Before habarico 5.11 an oversized `limit` was silently truncated to `1000` and an unreadable one
silently replaced by the default. Both now answer `422`, so a client that sends `?limit=5000` and
was served 1000 objects is now served an error instead.
:::

## Meta-only requests

`limit=0` is a deliberate value, not an invalid one: the response carries the `meta` block and no
objects, which is how a client asks for the total count alone.

```json
{
  "meta": {"total_count": 1934, "limit": 0, "offset": 0},
  "objects": []
}
```

## Example

A resource whose rows are expensive to serialize keeps its pages small and its ceiling low, while
a lookup resource the frontend loads in one go raises both:

```python
class OrderAdmin(ModelAdmin):
    model = Order
    default_page_limit = 25
    max_page_limit = 100


class CategoryAdmin(ModelAdmin):
    model = Category
    default_page_limit = 200
    max_page_limit = 500
```

Both values are checked when the admin is registered — a negative `default_page_limit`, a
`max_page_limit` of `0`, or a default above the maximum raises `ImproperlyConfigured` at startup
rather than failing a request later. See
[Configuration validation](./configuration-validation.md).

## See also

- [Configuration](../configuration.md) — where `ADMIN_REST_FRAMEWORK` is set
- [Ordering fields](../filtering-and-searching/ordering-fields.md) — the `order_by` parameter that
  accompanies `limit` and `offset`
- [Pagination](/ruby/basic-usage/pagination) — the Ruby counterpart, option for option
