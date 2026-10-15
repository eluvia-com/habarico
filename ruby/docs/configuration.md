---
title: Configuration
sidebar_position: 3
---

**Initializer** (`config/initializers/habarico.rb`):

```ruby
Habarico.setup do |config|
  config.resources = [
    { admin: [:categories, :orders, :order_items, :shipments, :communications] }
  ]
  config.routing_url_prefix = ENV.fetch('URL_PREFIX') { '' }
  config.routing_scope      = 'apps'
  config.currency           = 'CZK'
end
```

Resources can be plain symbols (flat namespace) or hashes where the key is the URL/module namespace and the value is an array of resource names within that namespace.

| Option | Description | Default |
|--------|-------------|---------|
| `resources` | Array of resource names (symbols or namespace hashes) | `[]` |
| `routing_url_prefix` | URL prefix applied to all generated routes | `''` |
| `routing_scope` | Rails module scope used for controller lookup | `nil` |
| `currency` | Default currency code for number formatting | `'CZK'` |
| `search_unaccent_enabled` | Diacritics-insensitive fulltext matching and highlighting; needs the PostgreSQL `unaccent` extension | `false` |
| `authenticate_method` | Method Habarico calls (via `send`) as its authentication `before_action` — see [Authentication](./authentication.md) | `:authenticate_request` |
| `default_page_limit` | Page size of a list endpoint when the request sends no `limit` — see [Pagination](./basic-usage/pagination.md) | `nil` (20) |
| `max_page_limit` | Largest `limit` a list request may ask for; above it the endpoint answers 422 — see [Pagination](./basic-usage/pagination.md) | `nil` (1000) |
| `base_controller_class` | Parent class of Habarico's own engine controllers (schema, global search, user preferences). Point it at the application's `'ApplicationController'` to reuse its authentication — see [Authentication](./authentication.md) | `'ActionController::API'` |

`Habarico.setup` simply yields `Habarico::Config`, so every option is also readable as
`Habarico::Config.currency` at runtime.

`search_unaccent_enabled` mirrors the Python `ADMIN_SEARCH_UNACCENT_ENABLED` setting — see
[Filtering and searching](./filtering-and-searching.md).
