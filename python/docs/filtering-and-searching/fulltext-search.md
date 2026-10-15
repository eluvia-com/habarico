---
title: Fulltext Search
sidebar_position: 2
---

Define `search_fields` to enable `?search=…` (or `?filter=search="…"`) on a resource's own list
endpoint — the query matches any of the listed paths and the list is filtered to matching rows:

```python
from habarico import ModelAdmin

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    search_fields = ["name", "description", "short_description"]  # Fields to search in
    fields = ["name", "sku", "description", "short_description", "status", "category"]
```

Without `search_fields`, `?search=…` on this resource's list endpoint has nothing to match against.

:::info
This page covers search **within one resource's own list view**. Querying across every registered
admin at once — the spotlight-style application-wide search — and highlighting matched substrings
in the response are both covered on the [Global search](./global-search.md) page.
:::

## Which field types to put in `search_fields`

Paths in `search_fields` may traverse relations via `__` (e.g. `category__name`). The type of the
leaf field determines how it is matched:

- `CharField`, `TextField` and their subclasses (`EmailField`, `SlugField`, `URLField`): standard
  case-insensitive substring match.
- Fields with `choices`: matched against the human-readable choice labels, not the stored raw
  value.
- `BooleanField`: matched against the translated `gettext("Yes")` / `gettext("No")` labels.
- Numeric fields (`IntegerField`, `DecimalField`, `FloatField`, `MoneyField`): matched via the
  standard cast-to-text `__icontains` (e.g. searching `12` matches `121.00`).
- `DateField`, `DateTimeField`, `TimeField`: matched against the ISO representation
  (`2024-01-15`) — technically works, but rarely what a user expects to type. Use `filter_fields`
  with a range filter for dates instead.
- `UUIDField`, `FileField`, `ImageField`: technically matchable but rarely useful (users don't
  search UUIDs or storage paths by substring).

## Diacritics-insensitive matching

Accent-insensitive matching is off by default. Turn it on globally in `settings.py`:

```python
ADMIN_SEARCH_UNACCENT_ENABLED = True
```

With it on, text lookups become `__unaccent__icontains` instead of `__icontains` — which needs the
PostgreSQL `unaccent` extension installed. Choice labels are compared the same way.

:::tip
Ruby's mirror of this setting is `config.search_unaccent_enabled` — see
[Global search](/ruby/basic-usage/global-search#diacritics-insensitive-matching). Keep the two
services aligned when one frontend talks to both.
:::

This same setting also governs match highlighting — see
[Global search](./global-search.md#diacritics-insensitive-matching).
