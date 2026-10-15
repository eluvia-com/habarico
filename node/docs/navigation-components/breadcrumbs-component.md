---
title: Breadcrumbs
sidebar_position: 2
---

The breadcrumb trail: a slot in the layout header, filled by whichever view is on screen.

A view never renders the trail where it stands — it composes the crumbs as JSX and hands them to
its shell, which portals them into the header. That is why a trail survives a view opening in a
dialog: there it is simply not portaled at all.

## Example

The generated views do this for you. In a view of your own, pass the trail to
[ViewContent](../layout-components/view-content.md) — or to any of the
[view shells](../layout-components/index.md#view-shells), which forward it:

```tsx
import {ViewContent, PortalBreadcrumbItem} from '@eluvia/habarico';

const SalesReportView = () => (
  <ViewContent
    title="Sales report"
    breadcrumbs={
      <>
        <PortalBreadcrumbItem path="/eshop/order">Orders</PortalBreadcrumbItem>
        <PortalBreadcrumbItem>Sales report</PortalBreadcrumbItem>
      </>
    }
  >
    <SalesReport />
  </ViewContent>
);
```

## PortalBreadcrumbItem

One crumb.

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | The label |
| `path` | `string` | — | Target path — renders a client-side router link. Omit it on the last crumb |

A crumb with a `path` is a muted link; a crumb without one is the emphasised current page. It does
no text processing — wrap the label in `DynamicText` yourself when it carries a `%{…}` template.

The last crumb of the trail shrinks to the room the header leaves it, and a plain-text label ends
in an ellipsis. Wrap the label in `EllipsisWithTitle` to show the full text in a tooltip as well;
on a parent crumb its `maxWidth` caps the crumb, while the last crumb ignores the cap.

## The schema-driven trail

On a generated view the trail comes from the schema, through three components you rarely mount by
hand:

| Component | What it does |
|---|---|
| `ViewSchemaBreadcrumbs` | The entry point: renders `viewSchema.breadcrumbs` when the backend declared a trail, and falls back to the route-derived one when it did not |
| `MenuSchemaBreadcrumb` | Renders one `MenuSchema` entry as a `PortalBreadcrumbItem`, resolving a `view` entry to its link |
| `RouteSchemaBreadcrumb` | Derives the trail from the current URL when the schema declares none |

So a backend that fills `breadcrumbs` on a view schema controls the trail; one that leaves it out
gets the resource/record path.

:::caution
The header slot exists only inside the dashboard shell. A page rendered outside it — an auth or
simple layout — has nowhere to portal to, and the crumbs disappear silently.
:::

## See also

- [ViewContent](../layout-components/view-content.md) — the `breadcrumbs` slot
- [DashboardLayout](../layout-components/dashboard-layout.md) — the `breadcrumbs` slot in the header
- [Service and resource schema](../types-and-schemas/service-schema-and-resource-schema.md) — the `MenuSchema` a crumb is built from
