---
title: ViewSchema & ActionSchema
sidebar_position: 4
---

A view is one screen of a resource — a list, a detail, a form, or a custom action. Boxes are the
layout containers inside a detail view; actions are the buttons the backend puts on it.

## ViewSchema

```typescript
type ViewType = 'edit' | 'create' | 'list' | 'show' | 'action';
type RequestMethodType = 'get' | 'post' | 'put' | 'patch' | 'delete';

type ViewEndpointParameters = {
  path?: string;
  method: RequestMethodType;
  reference?: string;
  actionName?: string;
};

type ViewSchema = {
  name: string;
  label?: string;
  type: ViewType;
  isDetail: boolean;
  endpoint: ViewEndpointParameters;
  list?: ListViewParameters;      // present on list views
  detail?: DetailViewParameters;  // present on show / edit / create / action views
  breadcrumbs?: MenuSchema[];
};

type ListViewParameters = {
  boxes?: FieldDescriptor[];      // the datagrid columns, in order
  filters?: FilterDescriptor[];
  toolbarActions?: ActionDescriptor[];
  rowActions?: ActionDescriptor[];
  listActions?: ActionDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;      // {fieldName; direction: 'asc' | 'desc'}
  sortable?: SortableParameters;        // {fieldName; sortForFilters}
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

type DetailViewParameters = {
  box: BoxSchema;                 // the single root box of the view
  toolbarActions?: ActionDescriptor[];
  bottomActions?: ActionDescriptor[];
};
```

:::caution
The list's columns arrive in `list.boxes`, not `list.fields` — the key is named after the generic
"box" container even though a list view only ever holds field descriptors.
:::

## BoxSchema

```typescript
type BoxType =
  | 'tab' | 'tab-item' | 'wizard'
  | 'simple' | 'list' | 'array' | 'object'
  | 'grid' | 'gallery';

// A box holds nested boxes and field descriptors in one ordered list
type BoxItem = BoxSchema | FieldDescriptor;

type BoxSchema = {
  name: string;
  type: BoxType;
  label?: string;
  card?: boolean;
  collapsible?: 'open' | 'closed';
  readOnly: boolean;
  toolbarActions?: ActionDescriptor[];  // rendered in the box's header (card header area)
  bottomActions?: ActionDescriptor[];   // rendered below the box's fields
  boxes?: BoxItem[];
  tab?: TabBoxParameters;
  wizard?: WizardBoxParameters;
  gridItem?: GridItemBoxParameters;
  list?: ListBoxParameters;
  array?: ArrayBoxParameters;
  object?: ObjectBoxParameters;
  gallery?: GalleryBoxParameters;
  options?: {
    dynamicRender?: DynamicRenderOptions;
  };
};

type TabBoxParameters = {
  showToolbarNavigation?: boolean;      // move the tab strip into the view toolbar
};

type WizardBoxParameters = {
  showToolbarNavigation?: boolean;
  validateSteps?: boolean;              // block Next until the current step validates
};

type GridItemBoxParameters = {xs?: number; sm?: number; md?: number; lg?: number; xl?: number};

type ListBoxParameters = {
  reference: string;          // Related resource name, e.g. "eshop/order-item"
  target?: string;            // FK field linking to the parent record
  rowActions?: ActionDescriptor[];
  toolbarActions?: ActionDescriptor[];  // explicit referenced-resource actions in the box header (no default fallback)
  listActions?: ActionDescriptor[];     // actions next to the filter bar; falls back to the resource's default list actions (e.g. create)
  filters?: FilterDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;
  sortable?: SortableParameters;
  schemaParams?: Record<string, string>;   // query params appended when the box fetches its schema
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

type ArrayBoxParameters = {
  target: string;
  inline?: boolean;
  listed?: {fieldName: string; otherValues?: (string | number)[]};
};

type ObjectBoxParameters = {target: string};

type GalleryBoxParameters = {
  reference: string;
  target?: string;
  imageField: string;
  filters?: FilterDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;
  schemaParams?: Record<string, string>;
};
```

:::caution
`readOnly` is the box flag — there is no `isReadonly`. Nested boxes and fields share one
`boxes` array, so the order of a mixed list is the order on screen.
:::

The `tab-item` box type is the child of a `tab` box and carries no parameters of its own. `gridItem`
is a placement rather than a box type: any box inside a `grid` box may carry it, so a grid cell is
simply the box that draws it — a `list` or `gallery` box sizes itself. A grid whose cells carry no
`gridItem` computes their widths from how many there are; one cell carrying it switches the whole
grid to explicit widths.

## ActionSchema

```typescript
type ActionType = 'view' | 'link' | 'resource' | 'save' | 'ai-assistant' | 'upload-images' | 'export';
type ViewModeType = 'dialog' | 'redirect' | 'sidepanel';
type AfterSaveType = 'stay' | 'prev' | 'show' | 'list';
type LinkTarget = 'self' | 'blank';

type ActionSchema = {
  type: ActionType;
  label?: string;
  icon?: string;
  color?: ColorWithInherit;   // 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'inherit'
  isDetail: boolean;          // true = shown only on detail views (show / edit)
  confirmDialog?: {title: string; message: string};
  view?: ViewActionParameters;                  // type = 'view'
  link?: LinkActionParameters;                  // type = 'link'
  resource?: ResourceActionParameters;          // type = 'resource'
  save?: SaveActionParameters;                  // type = 'save'
  uploadImages?: UploadImagesActionParameters;  // type = 'upload-images' (see FieldSchema)
  export?: ExportActionParameters;              // type = 'export'
};

type ViewActionParameters = {
  name: string;
  choices: {label: string; parameters: Record<string, string>}[];
  mode: ViewModeType;
  endpoint?: {reference?: string; actionName?: string; recordPk?: Identifier};
  parameters: Record<string, string>;
  dialogWidth?: string;       // mode: 'dialog' only — MUI breakpoint ("md") or CSS width ("800px")
  keepLinkedParent?: boolean; // keep the linked-parent segments in the redirect path
};

type LinkActionParameters = {url: string; target?: LinkTarget};

type ResourceActionParameters = {
  endpoint: {
    path?: string;
    method: RequestMethodType;
    reference?: string;
    actionName?: string;
    recordPk?: Identifier;
  };
  data: Record<string, string | number | boolean>;
  isBackground?: boolean;     // fire the request without leaving the current screen
};

type SaveActionParameters = {
  data: Record<string, string | number | boolean>;
  afterSave?: AfterSaveType;
};

type ExportActionParameters = {
  format?: string;
  fields?: string[];
};
```

### Presentation mode inside a dialog or side panel

A view action fired from a view that is itself shown in a dialog or in the side panel is resolved
against that container, not only against `mode`:

| action `mode`              | fired from a dialog                             | fired from the side panel                  |
| -------------------------- | ----------------------------------------------- | ------------------------------------------ |
| unset                      | the target view replaces the current one in the dialog | the panel closes and the frontend navigates (a routed target), otherwise a dialog opens |
| `'redirect'`               | the dialog closes and the frontend navigates to the target's route | the panel closes and the frontend navigates |
| `'dialog'`                 | the target view replaces the current one in the dialog | a dialog opens on top of the panel     |
| `'sidepanel'`              | docks into the list panel when one is reachable, otherwise replaces the view in the dialog | replaces the panel's own content |

So `mode: 'redirect'` is how an action reaches a record's own page from a dialog — a list rendered
in a dialog can link its rows out to their full pages. An overlay left behind this way is always
closed: its open state is owned by the surface underneath, which React keeps mounted when only the
route params change, so it would otherwise hang over the page just opened. Opening the redirect in a
new tab (ctrl/cmd-click) navigates nothing in this tab and leaves the overlay as it is.

:::caution
`mode: 'redirect'` requires the target view to be **routed** — its own `mode` must be absent or
`redirect`. Pointing an explicit redirect at a view declared as `dialog` or `sidepanel` is a
contradictory schema: such a view has no URL, so the action is refused and a warning is logged to
the console. That holds on every surface, a dialog included — nothing silently substitutes another
presentation for the one the action asked for. Drop the action's `mode` to open such a view by its
own, or route the target view.
:::

### Which URLs a link action may open

`LinkActionParameters.url` is templated with record values, so `%{data.website}` puts whatever a
user saved in that field into the navigation target. The frontend therefore honours only:

- absolute `http://` and `https://` URLs — `https://example.com/orders/%{data.id}`
- relative URLs — `/shop/orders/42`, `orders/42?tab=2#invoices`

Every other scheme is refused, the link is not opened and a warning is logged to the console. That
covers the dangerous ones (`javascript:`, `data:`, `blob:`, `vbscript:`, `file:`) and, because the
allowlist is exhaustive, `mailto:` and `tel:` as well — render a contact as a `string` field with
format `email` or `phone` instead.

A link is always opened with `noopener,noreferrer`, so the opened page never receives a
`window.opener` handle back to the admin.

## ActionDescriptor

Views and boxes reference actions the same way they reference fields — by name, overriding only
what differs. An inline `action` is what a descriptor carries when the action is not one of the
resource's registered actions.

```typescript
type ActionDescriptor = {
  name: string;
  label?: string;
  icon?: string;
  color?: ColorWithInherit;
  action?: ActionSchema;                  // inline definition instead of a named resource action
  view?: {
    choices?: {label: string; parameters: Record<string, string>}[];
    mode?: ViewModeType;
    parameters?: Record<string, string>;
    keepLinkedParent?: boolean;
  };
  confirmDialog?: {title: string; message: string};
  menuItems?: ActionDescriptor[];         // collapses the descriptor into a dropdown
};
```

## Action results

An action endpoint may answer with a `meta` block that tells the frontend what to show and what to
run next.

```typescript
type ActionStateType = 'running' | 'success' | 'error';

type ActionResult = {
  meta: {
    message?: string;
    state?: ActionStateType;
    triggerAction?: ActionSchema;   // action to run once this one finishes
  };
};
```

The same `meta.triggerAction` may come back on the record saved by a create or edit view, or by
the save of an action view. When it redirects in the same tab, it takes the place of the view's
after-save redirect (`afterSave`): the user lands on the trigger's target, its link is resolved
from the form's own route, and when the after-save redirect would have replaced the form's history
entry, the trigger replaces it too. Every other trigger — a dialog, a side panel, a resource
action, a link, or a redirect opened in a new tab — runs first and the after-save redirect follows.

## See also

- [Box components](../box-components/index.md) — what each `BoxType` renders
- [SchemaAction](../view-components/schema-action-component.md) — the component behind `type: 'action'` views
- [View slots](../view-components/view-slots-title-toolbar-actions-form-actions-list-actions.md) — overriding the action slots in JSX
- [FieldSchema](./field-schema.md) — `FieldDescriptor`, `FilterDescriptor` and the field options
- [REST API reference](/api) — the wire format these types describe
