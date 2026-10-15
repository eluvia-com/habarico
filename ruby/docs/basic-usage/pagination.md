---
title: Pagination
sidebar_position: 6
---

A list endpoint answers one page at a time — `limit` records from `offset` — and both the page size
a request gets by default and the largest one it may ask for are configurable, per application and
per resource.

## Declaration

```ruby
class OrdersController < ApplicationController
  include Habarico::Controller

  model Order
  fields %i[number customer status total created_at]

  default_page_limit 50
  max_page_limit 200
end
```

`GET /orders` now answers with 50 orders, `?limit=200` with 200, and `?limit=201` with a `422`.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `default_page_limit` | `Integer` | `nil` | Page size for a request that sends no `limit`. `nil` falls back to the application configuration. `0` is a valid value — see [Meta-only requests](#meta-only-requests). |
| `max_page_limit` | `Integer` | `nil` | Largest `limit` this resource accepts; above it the request is refused with `422`. `nil` falls back to the application configuration. |

## Application configuration

The same two knobs configure every resource at once, in the initializer:

```ruby
# config/initializers/habarico.rb
Habarico.setup do |config|
  config.default_page_limit = 50
  config.max_page_limit     = 200
end
```

A value is looked up in three places, the first one that has an opinion winning:

1. the resource DSL,
2. `Habarico::Config`,
3. `eluvia-base` — its `set_pagination` default of `20`, and `Eluvia::Base::Config.max_page_limit`
   (`1000`), which bounds every paginated endpoint of the application.

:::tip
To lift the ceiling altogether, set `Eluvia::Base::Config.max_page_limit = nil` — `nil` means "no
bound" there, while `nil` in `Habarico::Config` or in a resource means "not configured here". A
resource declares a number or nothing at all; only the base configuration can remove the bound.
:::

## Per-request limits

Both values are also plain controller methods, so a rule that depends on the request — a larger
ceiling for an internal client, a smaller page for a heavy report — is an override in the
controller:

```ruby
class OrdersController < ApplicationController
  include Habarico::Controller

  model Order

  def list_pagination_max_limit
    current_user.internal? ? 1000 : 100
  end
end
```

`list_pagination_max_limit` and `list_pagination_default_limit` are what habarico resolves from
the DSL and from `Habarico::Config`; overriding either replaces that resolution for this
controller. Overriding `pagination_max_limit` — the hook `eluvia-base` offers every controller —
works too, and a `max_page_limit` declared in the DSL still wins over it.

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
missing or blank `limit`, which falls back to the default page size.

:::caution
Until now no ceiling existed at all in the Ruby stack: `?limit=99999999` reached Kaminari, and
`?limit=0` crashed the endpoint with `ZeroDivisionError`. Both are now answered properly — the
first with a `422`, the second with a meta-only response — so a client that relied on an unbounded
`limit` has to page instead.
:::

## Meta-only requests

`limit=0` is a deliberate value, not an invalid one: the response carries the `meta` block and no
records, which is how a client asks for the total count alone.

```json
{
  "meta": {"total_count": 1934, "limit": 0, "offset": 0},
  "objects": []
}
```

## Example

A resource whose records are expensive to serialize keeps its pages small and its ceiling low,
while a lookup resource the frontend loads in one go raises both:

```ruby
class OrdersController < ApplicationController
  include Habarico::Controller

  model Order
  default_page_limit 25
  max_page_limit 100
end

class CategoriesController < ApplicationController
  include Habarico::Controller

  model Category
  default_page_limit 200
  max_page_limit 500
end
```

## See also

- [Configuration](../configuration.md) — where `Habarico::Config` is set
- [Data Loading](./data-loading.md) — `default_sorting` and `force_sorting`, the ordering that
  accompanies `limit` and `offset`
- [Pagination](/python/basic-usage/pagination) — the Python counterpart, option for option
