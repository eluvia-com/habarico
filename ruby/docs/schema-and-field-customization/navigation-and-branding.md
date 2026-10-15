---
title: Navigation & Branding
sidebar_position: 6
---

**`breadcrumbs`** — dynamic breadcrumb trail based on the current view and record:

```ruby
breadcrumbs do |view, c|
  result = []
  result << Habarico::ViewMenuItem.new(
    label: 'Orders',
    view_name: 'list',
    reference: Order,
  )
  if view.name == 'show' && c.record.present?
    result << Habarico::ViewMenuItem.new(
      label: c.record.product.name,
      view_name: 'show',
      reference: c.record.product,
    )
    result << Habarico::TextMenuItem.new(label: c.record.customer.name)
  end
  result
end
```

`Habarico::ViewMenuItem` navigates to a specific view of a resource; `Habarico::TextMenuItem` renders a non-clickable label.

**`tags`** — attach CSS class tags to list rows for conditional coloring or marking:

```ruby
tags do |c|
  c.record.occupancy_status ? ["color-#{c.record.occupancy_status_color}"] : []
end
```

**`menu_item false`** — exclude the resource from the auto-generated sidebar menu (used for resources accessed only via embedded `ListBox` in other views):

```ruby
menu_item false
```
