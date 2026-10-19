# habarico

Habarico is a schema-driven admin library for Rails. The gem is an engine that turns Rails models
into a complete admin API: REST endpoints plus JSON schemas describing resources, fields, views and
actions. The [React frontend](https://docs.habarico.com/node/intro) renders the whole admin UI from
those schemas — no screen is written per resource.

## Installation

The gem is published to the internal server, not to rubygems.org. Add it to your `Gemfile`:

```ruby
gem 'habarico'
```

```bash
bundle install
```

Then configure the engine in `config/initializers/habarico.rb`:

```ruby
Habarico.setup do |config|
  config.resources = [{ admin: [:products, :orders] }]
  config.routing_url_prefix = ENV.fetch('URL_PREFIX') { '' }
  config.routing_scope      = 'apps'
  config.currency           = 'CZK'
end
```

## Quick start

A resource is a controller that includes the concern and describes itself through the DSL:

```ruby
class Apps::Admin::ProductsController < ApplicationController
  include Habarico::Controller

  model Product
  default_sorting 'created_at:desc'

  can_read   true
  can_create { |c| c.policy.create? }
  can_update { |c| c.policy.update? }

  fields [:id, :name, :sku, :status, :category, :price, :stock, :created_at]
  read_only_fields [:id, :created_at]
  filters [:name, :status, :category]
  sorting_fields [:name, :price, :created_at]

  views   [:list, :show, :create, :edit]
  actions [:show, :create, :edit, :delete]
end
```

Routes are drawn from the configured resources — `config/routes.rb` only calls
`Habarico::RoutingService.instance.draw_routes`.

## Documentation

Full documentation is at **[docs.habarico.com/ruby](https://docs.habarico.com/ruby/intro)** — this
file is only a quick start.

| Section | What it covers |
| --- | --- |
| [Installation](https://docs.habarico.com/ruby/installation) and [configuration](https://docs.habarico.com/ruby/configuration) | The initializer and its options |
| [Basic usage](https://docs.habarico.com/ruby/basic-usage/) | Controllers, permissions, data loading, views, global search, aggregation, response field selection |
| [Schema & field customization](https://docs.habarico.com/ruby/schema-and-field-customization/) | Shaping the list, detail and form views, custom actions, box types |
| [Field types](https://docs.habarico.com/ruby/field-types) | The types a field can take and how they are inferred |
| [Filtering and searching](https://docs.habarico.com/ruby/filtering-and-searching) | Filters, sorting and fulltext search |
| [Change history](https://docs.habarico.com/ruby/change-history-paper-trail) | PaperTrail versions surfaced in the admin |
| [Cross-service references](https://docs.habarico.com/ruby/cross-service-references) | Fields pointing at another service's records |
| [User preferences](https://docs.habarico.com/ruby/user-preferences) | The per-user preference store the frontend syncs to |
| [Complete example](https://docs.habarico.com/ruby/complete-example) | One resource wired up end to end |

The frontend consuming these schemas is documented at
[docs.habarico.com/node](https://docs.habarico.com/node/intro), and the contract between them is
the [API reference](https://docs.habarico.com/api).

## License

[MIT](LICENSE)
