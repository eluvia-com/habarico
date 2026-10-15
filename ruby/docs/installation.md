---
title: Installation
sidebar_position: 2
---

Add the gem to your `Gemfile`:

```ruby
gem 'habarico'
```

Then install:

```bash
bundle install
```

The gem is MIT-licensed and published to rubygems.org, so no extra source is needed.

## Paid features

Change history, the cross-resource spotlight search with match highlighting, the
[aggregation](./basic-usage/aggregation.md) endpoint with the dashboard flag, and
[chunked uploads](./chunked-uploads/) ship in a separate, commercially licensed gem:

```ruby
gem 'habarico'
gem 'habarico-enterprise'
```

That is the whole configuration: Bundler loads the gem at boot and each feature registers itself
through the free gem's extension points — no initializer, no settings block. Two modules stay
opt-in — change history because it needs gems of its own, chunked uploads because they register a
process-wide upload finalizer and need configuration of their own:

```ruby
require 'habarico_enterprise/paper_trail'   # change history - needs paper_trail, diff_match_patch
require 'habarico_enterprise/uploads'       # chunked uploads - s3 provider needs aws-sdk-s3
```

Pages documenting a paid feature carry a **premium** badge. Without the gem the free engine works
unchanged; the paid options simply do not exist.

It requires **Rails 7.0+** and brings in `pundit` (authorization), `kaminari` (pagination) and the
`eluvia-base` library. Authentication is not bundled: the application implements the
`authenticate_request` hook itself, with whatever mechanism it already uses — see
[Authentication](./authentication.md).

Routes need no wiring in the host application: the engine's own `config/routes.rb` calls
`Habarico::RoutingService.instance.draw_routes`, which draws one route set per entry of
`Habarico::Config.resources`. Configure the resources and the routes appear.

## See also

- [Configuration](./configuration.md) — the initializer and its options
- [Authentication](./authentication.md) — the `authenticate_request` hook every endpoint runs
- [Controller setup](./basic-usage/controller-setup.md) — the first resource
