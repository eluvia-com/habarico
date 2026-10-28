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

**`get_trigger_action_schema(record)`** — override to inject a trigger action into every serialized record response. Return the name of an action declared in `actions`, a `Habarico::Action`, a complete `Habarico::ActionSchema`, or `nil` (default) for none — the same values `Habarico::Response.new(action: …)` accepts. A name or an action is turned into the complete schema in the context of `record`:

```ruby
def get_trigger_action_schema(record)
  'review' if record.needs_review?
end
```

To point the trigger at another record or another resource, build the schema yourself with
`trigger_action_schema` — nested objects and, for a resource action, the endpoint path included.

`trigger_action_schema(action, record:, record_pk:, reference:)`:

| Argument | Description |
|----------|-------------|
| `action` | The name of an action declared in `actions`, or a `Habarico::Action` built on the spot. A name that is not declared raises an error listing the declared ones |
| `record` | Record the context is built from. Pass the hook's own `record`: the hook runs once per serialized record, while the controller's `context` holds only the record of the current request (none at all on a list) |
| `record_pk` | Target record, when it is not the one in the context |
| `reference` | Target resource, when it is not the current one |

`record_pk` and `reference` are what let the trigger point anywhere in the admin — here a product
opens the detail of the category it belongs to, in a side panel:

```ruby
def get_trigger_action_schema(record)
  return nil unless params[:show_category].present?

  trigger_action_schema(
    Habarico::ViewAction.new(name: 'show', view_name: 'show', view_mode: :sidepanel, is_detail: true),
    record: record,
    reference: 'categories',
    record_pk: record.category_id,
  )
end
```

The same schema can be returned from a custom action instead, as `Habarico::Response.new(action: …)`
— see [Custom actions](./custom-actions.md).
