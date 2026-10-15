---
title: Menu
sidebar_position: 3
---

The sidebar menu is generated from the service schemas — you do not build it, you adjust it.

`SchemaLayout` assembles it from the loaded service schemas and hands the result to
[DashboardLayout](../layout-components/dashboard-layout.md)'s `menu` slot. The only supported way
to influence it is the `extraMenuItems` prop.

## How the menu is assembled

1. Every service in `serviceConfigMap` contributes its resources. A service with a `label` becomes
   a top-level group; a service without one has its resources placed at the top level.
2. A resource appears when its schema carries a `menu` entry — `type: 'view'` linking to one of
   the resource's views, or `type: 'link'` pointing at a URL (only `http`, `https` and relative
   URLs are opened — see
   [link actions](../types-and-schemas/view-schema-and-action-schema.md#which-urls-a-link-action-may-open)).
   The menu is nevertheless permission-aware, because a resource the user cannot read is not in
   their schema.
3. The service schema's own `MenuGroupSchema` decides grouping, labels and icons.
4. `extraMenuItems` from [SchemaAdmin](../base-components/schema-admin.md#extra-menu-items) is
   merged in last: an item whose `key` matches a generated entry patches it, any other key adds a
   new entry.
5. Everything is sorted by `priority`, ascending; the default is `100`.

## Replacing the menu entirely

The assembled menu is a `LayoutMenuItem[]` — a nested structure of title, icon, href and children.
`DashboardLayout` renders it from its `menu` slot, which also accepts a `Component` of your own:

```tsx
<DashboardLayout menu={{items: menuItems, Component: MyMenu}}>{children}</DashboardLayout>
```

:::caution
The hook that builds the menu is internal to `SchemaAdmin` and is **not** exported from the
package — it needs the resource definitions that only exist inside React Admin's `<Admin>`. A
custom `LayoutComponent` receives the generated items as the layout's `menu` slot; it does not
rebuild them.
:::

:::tip
To reorder the generated menu, do not rebuild it: give an `extraMenuItems` entry the key of the
generated item and only set `priority`. Everything else stays as generated.
:::

## See also

- [SchemaAdmin](../base-components/schema-admin.md#extra-menu-items) — the `extraMenuItems` prop
- [Menu customisation](/python/menu-customisation) — shaping the menu on the Python side
- [Navigation and branding](/ruby/schema-and-field-customization/navigation-and-branding) — the same on the Ruby side
