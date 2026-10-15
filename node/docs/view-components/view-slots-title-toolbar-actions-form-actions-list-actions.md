---
title: View slots — title, toolbarActions, formActions, listActions
sidebar_position: 7
---

Each schema view (`SchemaList`, `SchemaShow`, `SchemaCreate`, `SchemaEdit`) exposes named slots for the most
common customization points. All slots accept a `ReactNode` and can be set in two ways:

- **Backend schema** — the server-returned `ViewSchema` drives default values automatically.
- **React prop** — passing a prop overrides the default for that render.

## Slot overview per view

| Slot             | SchemaList | SchemaShow | SchemaCreate | SchemaEdit |
|------------------|:----------:|:----------:|:------------:|:----------:|
| `title`          |     ✓      |     ✓      |      ✓       |     ✓      |
| `toolbarActions` |     ✓      |     ✓      |      ✓       |     ✓      |
| `formActions`    |     —      |     —      |      ✓       |     ✓      |
| `listActions`    |     ✓      |     —      |      —       |     —      |

> **Note:** `SchemaAction` renders its title and toolbar directly from `ViewSchema.label` /
> `ViewSchema.detail.toolbarActions` and its form actions from `SchemaFormActions`. It does not currently
> expose these as top-level props — customize via the `children` prop instead.

## `title`

Rendered in the card header of the view. The default component reads `viewSchema.label` and renders it as
a `DynamicText` node (supports translations).

- **Default on list views** — `<SchemaViewTitle />` — shows `viewSchema.label`.
- **Default on detail/edit views** — the same `<SchemaViewTitle />`: it shows `viewSchema.label`
  when set, and falls back to the record's `meta.repr` when the view is opened in a dialog without a
  label. (The separate `DetailSchemaViewTitle` was folded into it.)

```tsx
// Hide the title entirely
<SchemaList title={null} />

// Static string
<SchemaCreate title="New product" />

// Custom component (has access to full React context)
<SchemaEdit title={<MyRecordTitle />} />
```

**Backend schema field:** `ViewSchema.label` (string, optional). When set, `SchemaViewTitle`
renders it automatically — no React prop needed.

## `toolbarActions`

Buttons rendered in the top-right toolbar of the view card, next to the title. The default component
(`SchemaViewToolbarActions`) reads `viewSchema.list.toolbarActions` or `viewSchema.detail.toolbarActions`
(depending on view type) and renders them as `SchemaButtons`. The number of buttons shown inline
depends on where the toolbar renders: in the page header there is room for one (two on wide
screens), elsewhere three to five depending on the breakpoint; the rest collapse into a `⋮` menu.

```tsx
// Disable toolbar actions entirely
<SchemaList toolbarActions={null} />

// Extra static button alongside schema-driven ones
<SchemaCreate
  toolbarActions={
    <>
      <SchemaViewToolbarActions />
      <HelpButton />
    </>
  }
/>

// Fully custom toolbar
<SchemaEdit toolbarActions={<MyToolbar />} />
```

**Backend schema fields:**

- `ListViewParameters.toolbarActions` — array of `ActionDescriptor` for list views.
- `DetailViewParameters.toolbarActions` — array of `ActionDescriptor` for detail/edit/show views.

Each `ActionDescriptor` references an action by `name`. The library resolves the button type (create,
edit, custom action, …) from the resource schema automatically.

## `formActions`

Buttons rendered inside the form toolbar at the bottom of create/edit forms. Defaults to
`<SchemaFormActions />`, which renders `SchemaButtons` with `variant="contained"` when
`viewSchema.detail.bottomActions` is configured, or a plain `<SaveButton />` otherwise.

```tsx
// Default save button is enough — no prop needed in most cases

// Add a secondary "Save & continue" button
<SchemaCreate
  formActions={
    <>
      <SchemaFormActions />
      <SaveAndContinueButton />
    </>
  }
/>

// Replace entirely with a custom save button
<SchemaEdit formActions={<MyCustomSaveButton size="medium" variant="contained" />} />
```

**Backend schema field:** `DetailViewParameters.bottomActions` — array of `ActionDescriptor`. When present,
`SchemaFormActions` renders those buttons instead of the default `SaveButton`.

## `listActions`

The secondary toolbar rendered below the main toolbar in list views, containing utility controls:
column selector, reset column widths, reset sort, reset datagrid configuration, and the toggle-filters
button. Defaults to `<SchemaListActions />`.

```tsx
// Remove the utility toolbar
<SchemaList listActions={null} />

// Keep defaults and add a custom button
<SchemaList
  listActions={
    <>
      <SchemaListActions />
      <ExportButton />
    </>
  }
/>
```

The utility controls are determined by library configuration (e.g. the `columnSelector` flag on
`SchemaAdmin`). In addition, `SchemaListActions` renders any actions listed in the backend schema
field `ListViewParameters.listActions` next to them.

## Full override example

```tsx
import {
  SchemaList,
  SchemaCreate,
  SchemaEdit,
  SchemaShow,
  SchemaViewTitle,
  SchemaViewToolbarActions,
  SchemaFormActions,
  SchemaListActions,
} from '@eluvia/habarico';

// Custom list with extra export button in the toolbar
<SchemaList
  title={<SchemaViewTitle />}           // same as default, shown for clarity
  toolbarActions={
    <>
      <SchemaViewToolbarActions />
      <MyExportButton />
    </>
  }
  listActions={<SchemaListActions />}         // same as default
/>

// Create form without a title, custom save button
<SchemaCreate
  title={null}
  formActions={<SaveAndPublishButton />}
/>

// Edit form — title falls back to record repr in dialogs
<SchemaEdit
  title={<SchemaViewTitle />}           // same as default
  formActions={<SchemaFormActions />}   // same as default
/>
```
