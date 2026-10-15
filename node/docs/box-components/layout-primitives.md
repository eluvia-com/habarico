---
title: Layout primitives
sidebar_position: 11
---

The schema-free containers the box components are built from. Use them on a page of your own to
get the same cards, spacing and grid behaviour as the generated views, without going through a
schema.

They are compound components: a `Panel` owns the surface and the collapse state, and you compose
`PanelHeader`, `PanelContent` and `PanelFooter` inside it.

## Panel

The card every section, nested list and dashboard widget is built from.

```tsx
import {Panel, PanelHeader, PanelContent} from '@eluvia/habarico';

<Panel collapsible defaultCollapsed={false}>
  <PanelHeader label="Pricing" icon="Wallet" actions={<SaveButton />} />
  <PanelContent>
    <NumberInput source="price" />
    <NumberInput source="vat_rate" />
  </PanelContent>
</Panel>
```

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | The panel slots |
| `variant` | `'root' \| 'nested'` | derived from context | `root` = 12px corners, paper background, card shadow; `nested` = 6px corners, neutral background, no shadow |
| `collapsible` | `boolean` | `false` | Adds the chevron toggle to the header |
| `defaultCollapsed` | `boolean` | `false` | Uncontrolled initial state; ignored when `collapsed` is set |
| `collapsed` / `onCollapsedChange` | `boolean` / `(collapsed) => void` | — | Controlled collapse state |
| `resizeHandle` | `boolean` | `false` | Renders a resize affordance — presentational only |
| `fullHeight` | `boolean` | `false` | Stretches to the container height, e.g. to equalise panels in a grid row |
| `sx` | `SxProps<Theme>` | — | Passed to the surface |

A panel rendered inside another panel becomes `nested` automatically — pass `variant` to override
that. The signal is `InsidePanelContext`, which `Panel` sets for everything it wraps. A surface that
is a card without being a `Panel` declares it itself (`ViewDialog` and `ViewSidePanel` do); anything
that skips the declaration reads as a page surface, and the first box on it draws its own card.

### PanelHeader

| Name | Type | Default | Description |
|---|---|---|---|
| `label` (required) | `ReactNode` | — | Header title |
| `icon` | `IconType \| string` | — | Leading icon |
| `iconColor` | `ColorType` | `'primary'` | Palette colour of the icon and its badge |
| `iconBadge` | `boolean` | `true` | `false` renders a bare icon instead of a tinted rounded-square badge |
| `help` | `ReactNode` | — | Help icon after the label, with this content in a tooltip |
| `actions` | `ReactNode` | — | Right-aligned actions |
| `dragHandle` | `boolean` | `false` | Drag affordance at the far left — presentational only |

### PanelContent

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | Body |
| `paddingSize` | `'none' \| 'small' \| 'medium'` | `'medium'` | Content gutter |
| `flush` | `boolean` | `false` | Full-bleed content (a datagrid): zero padding, clipped to the panel's rounded edges. Overrides `paddingSize` |

### PanelFooter

| Name | Type | Default | Description |
|---|---|---|---|
| `left` | `ReactNode` | — | Left-aligned content, e.g. a back button |
| `right` | `ReactNode` | — | Right-aligned content, e.g. cancel / save |

:::tip
A panel whose body is a datagrid wants `<PanelContent flush>` — that is what makes the table meet
the rounded edges instead of floating inside a gutter.
:::

## PanelGrid

Lays panels out on a 12-column MUI grid, computing the spans when you do not.

```tsx
import {PanelGrid, Panel, PanelHeader, PanelContent} from '@eluvia/habarico';

<PanelGrid maxColumns={{xs: 1, sm: 1, md: 2, lg: 3, xl: 4}}>
  <Panel><PanelHeader label="Product" /><PanelContent>…</PanelContent></Panel>
  <Panel><PanelHeader label="Pricing" /><PanelContent>…</PanelContent></Panel>
</PanelGrid>
```

| Name | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Grid items |
| `maxColumns` | `number \| {xs, sm, md, lg, xl}` | `{xs: 1, sm: 1, md: 2, lg: 3, xl: 4}` | How many children may share a row per breakpoint; a number applies to all of them |
| `sx` | `SxProps<Theme>` | — | Passed to the grid |

The gap between cells, rows and columns alike, follows the density setting, the same as the rows
of a `PropertyList`: 8px compact, 14.4px standard, 24px comfortable. `usePanelGridSpacing()`
returns that gap in theme spacing units, for layout math that needs it ahead of rendering.

Spans are computed only while **no** child is a `PanelGridItem`. As soon as one is, the grid
switches to explicit mode and every child carries its own widths.

## PanelGridItem

One explicit column of a `PanelGrid`.

| Name | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Column content |
| `xs`, `sm`, `md`, `lg`, `xl` | `number` | — | Span at each breakpoint |

:::tip
`PanelGrid` is also where the "last panel on the path" flag is propagated — the signal a panel
reads to decide whether it may grow to fill the remaining height. Rendering children through your
own wrapper instead of `PanelGrid` breaks that chain, and nested cards stop lining up.
:::

## Section

A lighter, card-less grouping: a heading and a body, with `SectionHeader`, `SectionContent` and
`SectionFooter` as its slots. Reach for it where a `Panel`'s surface would be one card too many.

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | Typically a `SectionHeader` and a body |
| `fullHeight` | `boolean` | `false` | Stretches to the container height — mirrors `Panel`'s flag |
| `sx` | `SxProps<Theme>` | — | Passed to the container |

:::caution
`SimpleBox`, `SimpleListBox`, `GridBox` and `GridBoxItem` no longer exist. `Panel` (with
`PanelContent flush` for a table) replaces the first two, and `PanelGrid` / `PanelGridItem` the
last two.
:::

## See also

- [SchemaGridBox](./grid-box.md) — the schema-driven grid built on these
- [Layout components](../layout-components/index.md) — the page shells these live inside
- [FormShell](../layout-components/form-shell.md) / [ShowShell](../layout-components/show-shell.md) — hand-built forms and detail pages
