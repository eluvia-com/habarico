---
title: Controller Hooks
sidebar_position: 7
---

Several optional instance methods can be defined on the controller to customise Habarico's behaviour.

**`complement_record_params`** — inject extra params when creating records from an embedded `ListBox` that passes context via query params:

```ruby
def complement_record_params
  order_id = params[:order_id]
  return {} unless order_id.present?

  order = Order.find_by(id: order_id)
  order ? { product_id: order.product_id } : {}
end
```

**`is_create_possible?`** — guard the create operation independently of the `can_create` permission check. Return `false` to block creation with a `400 Bad Request` error:

```ruby
def is_create_possible?
  AccountingPeriod.current.open?
end
```

**`is_update_possible?` / `is_delete_possible?`** — guard write operations at the record level, independently of the `can_update` / `can_delete` permission checks:

```ruby
def is_update_possible?(record)
  !record.accounting_period.closed? && !record.shipped?
end

def is_delete_possible?(record)
  !record.accounting_period.closed? && !record.shipped?
end
```

These hooks run after permissions are checked and before the write is committed. Return `false` to block the operation with a `400 Bad Request` error.

**`get_trigger_action_schema(record)`** — override to inject a trigger action into every serialized record response. Return an `ActionSchema` instance or `nil` (default):

```ruby
def get_trigger_action_schema(record)
  return nil unless record.needs_review?
  # Build the ActionSchema of a defined action to auto-trigger it in the UI
  action = definition.normalized_actions.find { |a| a.name.to_s == 'review' }
  resource_path = Habarico::ResourceService.instance.get_resource_path(controller_name)
  definition.action_schema_generator.new(definition, resource_path).generate(action, context)
end
```
