---
title: DashboardLayout
sidebar_position: 4
---

The full admin shell: collapsible sidebar, sticky header, breadcrumbs, global search, account
menu, settings panel and footer.

`AdminDashboardLayout` — what [SchemaAdmin](../base-components/schema-admin.md) mounts through
`SchemaLayout` — is this component wired to React Admin. Mount `DashboardLayout` yourself only
when you replace `LayoutComponent` entirely and still want this chrome.

## Example

```tsx
import {DashboardLayout, LayoutProvider} from '@eluvia/habarico';

<LayoutProvider settings={settings} currentUser={currentUser}>
  <DashboardLayout
    logo={{Component: Logo}}
    menu={{items: menuItems}}
    account={{menuItems: accountItems}}
    language={{availableLanguages}}
    search={{Component: GlobalSearch}}
    breadcrumbs
    appearance
    arrangement={{header: true}}
    status={{version: '6.8.0', environment: 'prod'}}
  >
    {children}
  </DashboardLayout>
</LayoutProvider>
```

## Props

Every prop is a **slot**: passing it enables the feature, and its value configures it. A slot whose
configuration is entirely optional also accepts `true` — `<DashboardLayout appearance />` enables
the appearance controls with their defaults.

| Name | Type | Description |
|---|---|---|
| `children` (required) | `ReactNode` | The routed content |
| `logo` | `LogoSlot` | `{Component}` — logo above the menu |
| `menu` | `MenuSlot` | `{items, Component?}` — the sidebar |
| `account` | `AccountSlot` | `{menuItems}` — the account popover |
| `workspaces` | `WorkspacesSlot` | `{items}` — the workspace switcher |
| `language` | `LanguageSlot` | `{availableLanguages}` — the language popover |
| `appearance` | `AppearanceSlot` | `true` or `{labels?, tooltip?, header?}` — light/dark and contrast controls |
| `arrangement` | `ArrangementSlot` | `true` or `{labels?, tooltip?, header?}` — the page-width control |
| `table` | `TableSlot` | `true` or `{labels?}` — the table-density section of the settings panel |
| `notifications` | `NotificationsSlot` | `true` or `{tooltip?, labels?, onViewAll?}` — the notifications panel |
| `search` | `SearchSlot` | `true` or `{Component?, tooltip?}` — the global search bar |
| `breadcrumbs` | `BreadcrumbsSlot` | `true` or `{Component?, icon?}` — the header breadcrumb trail |
| `settings` | `SettingsSlot` | `true` or `{Component?, labels?, tooltip?}` — the settings drawer |
| `marketing` | `MarketingSlot` | `{logo?, label?, href?}` — the marketing block at the bottom of the sidebar |
| `status` | `StatusSlot` | `{version?, environment?, labels?}` — the version / environment strip |
| `sx` | `SxProps<Theme>` | MUI style override |

:::caution
There is no `LogoComponent`, `FooterComponent`, `BreadcrumbsComponent`, `SearchComponent`,
`onModeChange` or `onLanguageChange` prop. Every one of them became a slot: the component goes
inside the slot object (`logo={{Component: Logo}}`), and the toggles write to the settings context
rather than calling back.
:::

## Breadcrumbs and actions in the header

The breadcrumb trail and the current view's actions share the header row, and the header keeps a
single line however long either of them is:

- **The actions never shrink or wrap.** The trail gives way instead: the current (last) crumb
  truncates with an ellipsis to the room left next to the actions, and shows its full title in a
  tooltip. The parent crumbs keep their width, up to their own cap.
- **The actions compact when a long trail would be squeezed out.** The layout measures its header
  row, not the viewport — so the sidebar, the header icons and the length of the trail all count. A
  trail that does not fit and is left less than about 320px turns the actions icon-only (the label
  moves into a tooltip), and if that is still not enough, folds them all into the `⋮` menu. A short
  trail keeps the labelled buttons; the actions expand again once there is room.

The schema-driven page toolbar follows this on its own. Below the `sm` breakpoint the trail has a
row of its own and nothing is compacted.

## The two contexts behind it

The layout reads its user, its persisted settings and its portal targets from context, not from
props:

| Provider | Carries |
|---|---|
| `SettingsProvider` | Colour mode, contrast, page width, density — the user's presentation settings |
| `LayoutDynamicProvider` | `currentUser`, breadcrumbs, notifications and the title / actions portal refs |

`LayoutProvider` composes both and is what the dashboard shell needs; the lighter `AuthLayout` and
`SimpleLayout` need only `SettingsProvider`. On the schema path
[SchemaAdmin](../base-components/schema-admin.md) sets all of this up — you pass
`LogoComponent`, `marketingFooter`, `statusFooter`, `arrangement` and `availableLanguages` to it
and it fills the slots.

## See also

- [Menu](../navigation-components/menu.md) — what fills the sidebar
- [DashboardContent](./dashboard-content.md) — the content container inside the shell
- [SchemaAdmin](../base-components/schema-admin.md) — `LayoutComponent`, `LogoComponent`, `marketingFooter`, `statusFooter`
