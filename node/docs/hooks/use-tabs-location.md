---
title: useTabsLocation
sidebar_position: 6
---

Keeps the open tabs in a shared store, so a tabbed screen can be linked to and reloaded.

Tab boxes use it already. Reach for it when you build a custom tabbed layout that should share the
same tab state — including nested tabs, which are addressed by a dotted path (`0.1.0`).

## Signature

```typescript
import {useTabsLocation} from 'habarico';

const {tabs, setTab, removeTab, getActiveTab} = useTabsLocation();
```

## Returns

| Name | Type | Description |
|---|---|---|
| `tabs` | `string[]` | Every open tab path |
| `setTab` | `(value: string) => void` | Opens a tab, closing its siblings but keeping its descendants |
| `removeTab` | `(value: string) => void` | Closes a tab together with everything nested inside it |
| `getActiveTab` | `(boxName: string) => string \| undefined` | The active tab inside one box, or `undefined` |

Navigation always replaces the history entry, so switching tabs does not fill up the back button.

## useTabBox

Building a tabbed layout of your own? Use **`useTabBox(path)`** instead of the raw hook — it scopes
the store to a single box and, just as importantly, **claims** its path:

```tsx
const {activeTab, setTab} = useTabBox('0.1');

<Tabs value={activeTab ?? 'detail'} onChange={(_, value) => setTab(value)}>
  <Tab value="detail" label="Detail" />
  <Tab value="orders" label="Orders" />
</Tabs>
```

| Name | Type | Description |
|---|---|---|
| `activeTab` | `string \| undefined` | The tab open inside this box |
| `setTab` | `(name: string) => void` | Opens a tab of this box — the name of a tab, not a full path |

The claim is what tells a view its own tabs from those another view left in the URL: on arrival the
provider drops every tab no mounted box claims (see below). A box that writes tabs through
`useTabsLocation()` without claiming its path therefore loses them.

## Provider

`useTabsLocation()` reads its store from context, so it must be called under a
**`TabsLocationProvider`**. `ViewContent` mounts exactly one per view — a page, a `ViewDialog`, or
a `ViewSidePanel` — so every tab box within the same view shares it, while a dialog/side-panel view
and the page underneath always get separate store instances and can never collide, even when both
happen to use the same box name.

Its `syncWithLocation` prop (mirroring react-admin's `TabbedShowLayout` / `TabbedForm`) decides
where the store lives:

- **`true`** — mirrors the store into the URL hash, so a tabbed page can be linked to and reloaded.
  `ViewContent` passes `true` on a page.
- **`false`** — an isolated, in-memory store with no URL involved. `ViewContent` passes `false`
  inside a dialog or side panel, so a tab box opened there can never collide with a tab box on the
  page behind it — each overlay gets its own private store, the same way a `useState` would be
  scoped to its component.

A custom tabbed layout built outside `ViewContent` needs to be wrapped in a `TabsLocationProvider`
explicitly; calling `useTabsLocation()` with none in scope throws.

### Tabs of the view you came from

Switching a record between show and edit keeps the URL hash, so the open tab survives the switch —
including tabs of a box the arrived-at view does not have. The provider sweeps every tab that no
`useTabBox` on screen claims, in the frame after the view is painted — late enough for the initial
render to have settled, so a box mounted by another box's effect is still counted.

It runs **once per view**: a tab box that unmounts later (an outer tab being switched) keeps its
tabs. A box that arrives after that — waiting on a request of its own, or on a `show_query` the
user only satisfies later — is not there to claim its path and loses its tab.

## Example

```tsx
const {setTab, getActiveTab} = useTabsLocation();
const active = getActiveTab('0') ?? '0';

<Tabs value={active} onChange={(_, value) => setTab(`0.${value}`)}>
  <Tab value="0" label="Detail" />
  <Tab value="1" label="Orders" />
</Tabs>
```

## See also

- [Layout components](../layout-components/index.md) — the tab boxes that use this hook
