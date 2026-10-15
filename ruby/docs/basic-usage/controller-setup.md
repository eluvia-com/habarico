---
title: Controller setup
sidebar_position: 2
---

Create a controller that includes `Habarico::Controller` and declares a resource definition using the DSL:

```ruby
class Apps::Admin::OrdersController < ApplicationController
  include Habarico::Controller

  # ── Model ──────────────────────────────────────────────────────────────────
  model Order
  default_sorting 'placed_at:desc'
  includes [
             :customer,
             items: { product: [:category] },
           ]

  # ── Permissions ────────────────────────────────────────────────────────────
  can_read   true
  can_create do |c|
    c.policy.create?
  end
  can_update do |c|
    c.policy.update?
  end
  can_delete false

  # ── Navigation ─────────────────────────────────────────────────────────────
  icon 'Inventory'

  # ── Fields ─────────────────────────────────────────────────────────────────
  fields [
    :id, :number, :status, :customer,
    :total_amount, :placed_at, :delivered_at,
    :created_at, :updated_at,
  ]
  read_only_fields [:id, :created_at, :updated_at]
  filters [:number, :status, :customer, :placed_at]
  sorting_fields [:number, :placed_at, :created_at]

  # ── Views ──────────────────────────────────────────────────────────────────
  views [:list, :show, :create, :edit]

  # ── Actions ────────────────────────────────────────────────────────────────
  actions [:show, :create, :edit, :delete]
end
```

`Habarico::Controller` is an `ActiveSupport::Concern` that automatically wires in pagination and error handling, requires authentication through the [`authenticate_request` hook](../authentication.md), and implements the standard CRUD actions (`index`, `show`, `create`, `update`, `destroy`).

**Default values**: if `views` or `actions` are not declared, the defaults are `[:list, :show]` and
`[:show]` respectively. `default_sorting` defaults to nothing — the list is then ordered by the primary key alone — and `can_read` is the
only permission that is `true` out of the box.

Every attribute of `Habarico::Definition` is available as a DSL method with the same name, and each
one accepts either a plain value or a block evaluated per request (`can_create do |c| … end`).

`default_sorting` takes a `'field:direction'` string; anything other than `:desc` after the colon
is read as ascending.

## See also

- [Authentication](../authentication.md) — what the controller inherits from `ApplicationController`
- [Quickstart](/concepts/guides/quickstart) — this controller in a working setup
