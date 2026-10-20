---
title: Views
sidebar_position: 7
---

Basic views can be declared using symbols:

```ruby
views [:list, :show, :create, :edit]
```

For full control, pass view objects directly:

```ruby
views [
  Habarico::ListView.new(
    boxes: [:id, :product, :customer, :status, :placed_at],
    filters: [],
    toolbar_filters: [:status, :category],
    row_actions: [:show, :edit, :delete],
    toolbar_actions: [:create],
    default_sorting: 'placed_at:desc',
  ),
  Habarico::ShowView.new,
  Habarico::CreateView.new,
  Habarico::EditView.new,
]
```

You can create custom view using `Habarico::ActionView` class:

```ruby
Habarico::ActionView.new(
  name: 'refund',
  label: 'Pay back guarantee',
  view_mode: :dialog,
  is_detail: true,
  boxes: [:refund_amount, :refund_reason],
  model: RefundRequest,
  endpoint_action_name: 'refund',
  endpoint_method: :put,
)
```

:::caution
`endpoint_action_name` is what makes an action view routable — it is the URL segment appended
after the record. `endpoint_reference` is a different thing: the *other* resource the action is
served by. A view with neither gets no `path` in its schema and never becomes an action route.

It is also what an action *opening* this view puts in its endpoint's address: the segment comes from
the target view, so an action opening a reserved view (`list`, `create`, `edit`, `show`) carries no
address at all — a reserved view is addressed by its type.
:::

## View attributes

Every view class accepts the same set:

| Attribute | Description |
|---|---|
| `name` | View name; also the schema key the frontend routes by |
| `label` | Heading of the view |
| `is_detail` | Whether the view needs a record |
| `view_mode` | `:redirect` (default), `:dialog` or `:sidepanel` |
| `boxes` | Fields and boxes the view renders |
| `box` | A single root box, instead of the `boxes` list |
| `filters` / `toolbar_filters` | List views: the drawer filters and the always-visible ones |
| `default_sorting` | `'field:asc'` / `'field:desc'` |
| `row_actions` / `toolbar_actions` / `list_actions` | The three action slots |
| `single_click_action` / `double_click_action` | Row activation |
| `endpoint_method` | HTTP method of the view's endpoint |
| `endpoint_action_name` | Action segment of the URL — required for an action view |
| `endpoint_reference` | Another resource serving this view |
| `model` | Model the view's fields are read from, when it differs from the resource's |
| `permission` | Permission checked before the view is offered (`:read`, `:create`, …) |

:::caution
A key that is not on that list is **silently dropped** — `Habarico::View` only assigns the
attributes it declares. There is no `icon:` on a view, for instance; the icon belongs to the
action or the menu item.
:::

Available view classes:

| Class | Symbol | HTTP method | Requires record? |
|-------|--------|-------------|-----------------|
| `Habarico::ListView` | `:list` | GET | No |
| `Habarico::ShowView` | `:show` | GET | Yes |
| `Habarico::CreateView` | `:create` | POST | No |
| `Habarico::EditView` | `:edit` | PATCH | Yes |
| `Habarico::ActionView` | *(none)* | Any | Configurable |
