---
title: ViewContent
sidebar_position: 6
---

The frame every view renders into: a title, toolbar actions, the content region, an optional
bottom action bar and a breadcrumb trail.

Reach for it when a custom page should behave like a generated view — including inside a dialog,
where the same component moves the title and the actions into the dialog chrome instead.

## Example

```tsx
import {ViewContent} from '@eluvia/habarico';

const OrderSummaryPage = () => (
  <ViewContent
    title="Order summary"
    subtitle="Last 30 days"
    toolbarActions={<RefreshOrdersButton />}
    breadcrumbs={<OrderBreadcrumbs />}
  >
    <OrderSummary />
  </ViewContent>
);
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | The content region |
| `title` | `ReactNode` | — | Portaled to the layout header, or to the dialog title |
| `subtitle` | `ReactNode` | — | Rendered under the title |
| `toolbarActions` | `ReactNode` | — | Portaled next to the title |
| `bottomActions` | `ReactNode` | — | A bottom `ViewToolbar` on a page, `DialogActions` in a dialog |
| `breadcrumbs` | `ReactNode` | — | Injected into the layout's breadcrumb slot |

:::caution
`ViewContent` renders **no card of its own**. The visible paper surface is a per-view-type concern:
a detail groups its content into `Panel`s, and a list is wrapped in a `ListSurface` card by
[ListShell](./list-shell.md). A page that needs a card has to bring one.
:::

## Page or dialog

Where each slot lands is read from `ViewPresentationContext`, never branched on by the caller:

| Slot | On a page | In a dialog or side panel |
|---|---|---|
| `title` | Layout header title | Dialog title |
| `toolbarActions` | Layout header actions | Dialog title actions |
| `breadcrumbs` | Layout breadcrumb bar | Not rendered |
| `bottomActions` | In-flow `ViewToolbar` footer | `DialogActions` |
| `children` | Content region | Content region |

Breadcrumbs are suppressed in a dialog on purpose — a trail there would point at a page the user
is not on.

## See also

- [DashboardContent](./dashboard-content.md) — the container this sits inside on a page
- [ShowShell](./show-shell.md) — the detail shell that renders this frame for you
- [View slots](../view-components/view-slots-title-toolbar-actions-form-actions-list-actions.md) — the generated views' equivalents
