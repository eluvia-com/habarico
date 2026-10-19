---
title: DashboardContent
sidebar_position: 5
---

The padded, width-capped container the routed content sits in inside the dashboard shell.

Use it for a page you add next to the generated ones — a report, a settings screen — so it lines
up with the generated views instead of running to the window edges.

## Example

```tsx
import {DashboardContent} from 'habarico';

const SalesReportPage = () => (
  <DashboardContent maxWidth="lg">
    <SalesReport />
  </DashboardContent>
);
```

## Props

It extends MUI's `ContainerProps`, so `component`, `className` and the rest are available too.

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | Page content |
| `maxWidth` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| false` | `'xl'` | Caps the content width; `false` removes the cap |
| `disablePadding` | `boolean` | `false` | Drops the container padding at every breakpoint |
| `sx` | `SxProps<Theme>` | — | MUI style override |

The user's **page width** setting overrides an uncapped container: with `maxWidth={false}` and the
setting on `centered`, the content is still capped at `xl`. `SchemaAdmin` feeds its
`contentMaxWidth` prop in here.

## See also

- [DashboardLayout](./dashboard-layout.md) — the shell this sits inside
- [ViewContent](./view-content.md) — the per-view frame with title, actions and breadcrumbs
- [SchemaAdmin](../base-components/schema-admin.md) — the `contentMaxWidth` prop
