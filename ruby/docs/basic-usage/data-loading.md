---
title: Data Loading
sidebar_position: 5
---

**`includes`** — eager-load ActiveRecord associations to avoid N+1 queries:

```ruby
includes [
  :customer,
  product: {
    category: [:category, :brand]
  },
]
```

**`prefetch`** — run arbitrary code after records are loaded to attach computed data that is not stored in the database:

```ruby
prefetch do |records|
  OutstandingAmountService.instance.get_outstanding_amounts(records).each do |order_id, outstanding_amount|
    order = records.find { |r| r.id == order_id }
    order.outstanding_amount = outstanding_amount if order
  end
end
```

`prefetch` receives the full collection of records returned by the index query and runs after `includes` is applied. Use it to batch-load calculated values (debts, external API data, aggregated counts) so the frontend schema receives them without triggering per-record queries.

**`scopes`** — apply named ActiveRecord scopes to the base query before filtering:

```ruby
scopes [:active, :visible]
```

Each scope name is called as `.public_send(scope)` on the relation. Scopes are applied after `policy_scope` and before filters.

**`default_filter`** — merge a fixed set of filter params into every index query and every single-record lookup:

```ruby
default_filter({ status: 'active' })
```

**`force_sorting`** — when `true`, the `default_sorting` value cannot be overridden by the `order_by` query parameter:

```ruby
force_sorting true
```

The parameter is then not read at all, so a request carrying one is served with the forced ordering
rather than refused. What a client may put in `order_by` otherwise is on
[Filtering and Searching](../filtering-and-searching.md#sorting).
