---
title: Layout components
sidebar_position: 1
---

The shells the admin renders inside. They come in two tiers: the **app shells** frame the whole
window (sidebar, header, login screen), and the **view shells** frame one screen inside it (a list,
a detail, a form).

`SchemaLayout` — the default passed to [SchemaAdmin](../base-components/schema-admin.md) — is built
from `AdminDashboardLayout`, which is `DashboardLayout` wired to React Admin.

## App shells

| Component | Use it for |
|---|---|
| [DashboardLayout](./dashboard-layout.md) | The full admin shell: sidebar, header, search, breadcrumbs, settings panel, footer |
| [AuthLayout](./auth-layout.md) | Login, password reset and other pre-authentication screens |
| [SimpleLayout](./simple-layout.md) | A standalone page outside the admin shell |
| [DashboardContent](./dashboard-content.md) | The padded, width-capped content container inside the dashboard shell |

## View shells

| Component | Use it for |
|---|---|
| [ViewContent](./view-content.md) | The frame every view renders into — title, actions, breadcrumbs, bottom bar |
| [ShowShell](./show-shell.md) | A read-only detail screen built by hand |
| [EditShell and CreateShell](./edit-and-create-shell.md) | A form screen built by hand |
| [FormShell](./form-shell.md) | The form context and save toolbar the two form shells wrap |
| [ListShell](./list-shell.md) | A list with the generated filter/toolbar arrangement |
| [Property layouts](./property-layouts.md) | Label + value rows, the way a generated detail lays fields out |

## How the three tiers stack

A generated screen is three layers deep, and each one can be used on its own:

```
SchemaShow  →  ShowShell  →  ViewContent
(reads the schema)  (owns the RA controller)  (pure chrome)
```

Only the top layer knows about schemas. The two admin-layer shells take plain React Admin values,
which is what makes them usable in an app that has no Habarico backend at all — the same path the
library's own Storybook pages take.

:::caution
`BaseLayout`, `FormLayout`, `ShowLayout`, `ListView` and `AdminPageContent` no longer exist. They
were replaced by the shells above: `FormShell` / `PropertyFormLayout`, `ShowShell` /
`PropertyShowLayout`, `ListShell`, and `DashboardContent`.
:::

## See also

- [Box components](../box-components/index.md) — the containers rendered inside these shells
- [SchemaAdmin](../base-components/schema-admin.md) — `LayoutComponent` and `contentMaxWidth`
- [View components](../view-components/index.md) — the generated views these wrap
- [Breadcrumbs](../navigation-components/breadcrumbs-component.md) — injecting a trail from a custom page
- [Forms and layout](/concepts/guides/forms-and-layout) — arranging a form with boxes
