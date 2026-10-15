---
title: Menu Customization
sidebar_position: 9
---

The sidebar menu is generated automatically from resource definitions. Customise it with `label`, `icon`, and `menu_path`:

```ruby
label 'Orders'
icon 'Receipt'      # Material icon name
menu_path [Habarico::TextMenuItem.new(name: 'sales', label: 'Sales', icon: 'Store')]
```

`menu_path` nests the resource's menu entry under a group hierarchy: it takes an array of
`Habarico::MenuItem` objects, outermost group first, and is emitted as the menu schema's `parent`
chain. Only `name`, `label`, `icon`, `color` and `priority` of each item are used for a group.

**Link a resource to a specific view** (e.g. always open the list view):

```ruby
menu_item Habarico::ViewMenuItem.new(view_name: 'list')
```

All three menu-item classes share one attribute set (`Habarico::MenuItem`):

| Attribute | Description |
|---|---|
| `name` | Merge key of the entry |
| `label` | Caption |
| `icon` / `color` | Icon name and its palette colour |
| `priority` | Ordering; the three subclasses default it to `1` |
| `view_name` / `view_mode` / `dialog_width` | `ViewMenuItem`: which view opens and how (`:redirect` by default) |
| `view_keep_linked_parent` | Keeps the parent segments in the target URL |
| `reference` / `reference_action_name` | The record or model class the view is opened for |
| `link_url` / `link_target` | `LinkMenuItem`: the URL and where it opens |

**Add a custom external link** in the menu:

```ruby
menu_item Habarico::LinkMenuItem.new(
  label: 'Documentation',
  link_url: 'https://docs.example.com',
  link_target: 'blank',
)
```

:::caution
`link_target` is `'self'` or `'blank'` — without the leading underscore, the same as on a link
action. The frontend prepends it when rendering the anchor.
:::

**Non-clickable label** in breadcrumbs or menus:

```ruby
Habarico::TextMenuItem.new(label: 'Some heading')
```

`TextMenuItem` renders as a plain text node with no navigation. Useful in breadcrumb blocks to represent the current page.

**Suppress the menu entry** for resources accessed only via embedded lists:

```ruby
menu_item false
```
