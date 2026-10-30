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

// Address of a resource, optionally narrowed to one record and one of its actions.
type ResourceReference = {
  service: string;            // always set — filled in from the loaded schema when the backend omits it
  resource: string;           // bare resource name, e.g. "order-item"
  recordPk?: Identifier;
  actionName?: string;
  params?: Record<string, string | number | boolean>;  // query string of the addressed request
};

type ViewEndpointParameters = {
  path?: string;
  method: RequestMethodType;
  reference?: ResourceReference;
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
  toolbarActions?: AnyActionDescriptor[];
  rowActions?: AnyActionDescriptor[];
  listActions?: AnyActionDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;      // {fieldName; direction: 'asc' | 'desc'}
  sortable?: SortableParameters;        // {fieldName; sortForFilters}
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

type DetailViewParameters = {
  box: BoxSchema;                 // the single root box of the view
  toolbarActions?: AnyActionDescriptor[];
  bottomActions?: AnyActionDescriptor[];
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
  toolbarActions?: AnyActionDescriptor[];  // rendered in the box's header (card header area)
  bottomActions?: AnyActionDescriptor[];   // rendered below the box's fields
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
  reference: ResourceReference;  // Related resource; its params go with the box's schema request
  target?: string;            // FK field linking to the parent record
  rowActions?: AnyActionDescriptor[];
  listActions?: AnyActionDescriptor[];       // actions next to the filter bar
  filters?: FilterDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;
  sortable?: SortableParameters;
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
  reference: ResourceReference;
  target?: string;
  imageField: string;
  filters?: FilterDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;
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
type ActionType = 'view' | 'link' | 'resource' | 'save' | 'ai-assistant' | 'upload-files' | 'export';
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
  uploadFiles?: UploadFilesActionParameters;    // type = 'upload-files' (see FieldSchema)
  export?: ExportActionParameters;              // type = 'export'
};

type ViewActionParameters = {
  name: string;
  choices: {label: string; parameters: Record<string, string>}[];
  mode: ViewModeType;
  reference?: ResourceReference;  // absent = the resource the schema was generated for
  parameters: Record<string, string>;
  dialogWidth?: string;       // mode: 'dialog' only — MUI breakpoint ("md") or CSS width ("800px")
  keepLinkedParent?: boolean; // keep the linked-parent segments in the redirect path
};

type LinkActionParameters = {url: string; target?: LinkTarget};

type ResourceActionParameters = {
  endpoint: {
    path?: string;
    method: RequestMethodType;
    reference?: ResourceReference;
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

### What an export action exports

Next to the table of its resource — a list view's or a list box's `listActions` — an `export` action
exports the selected rows, or everything matching the current filters and sort. Anywhere else, such
as a box header, there is no table state to read: it exports every record of its resource that
belongs to the parent record its `reference` links back to (`params._target`), and every record of
the resource when it links to none. Filters the user set or the box's `extraFilters` do not apply
there.

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
  type?: 'action';                        // always on the wire; optional in code
  name: string;
  label?: string;
  icon?: string;
  color?: ColorWithInherit;
  action?: ActionSchema;                  // inline definition instead of a named resource action
  reference?: ResourceReference;          // resource whose schema the action is looked up in
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

### Linking an action from another schema

A descriptor finds its action in this order:

1. `action` — the inline definition, used as it is;
2. `reference` — the schema that address loads, where `name` is looked up;
3. otherwise the schema the descriptor is rendered in: the record's actions, or the resource's.

A `reference` also **binds** the action, even when `action` is inline: it runs against the
referenced resource and against `reference.recordPk`, not the surrounding ones. Without a
`recordPk` it keeps the surrounding record only when that record belongs to the referenced
resource — a row action linking the row's own resource still gets the row.

A linked button appears once its schema has loaded; until then, and when the schema has no action
of that `name`, the slot leaves it out. The schema is fetched once per distinct reference and
shared with every other reader of it, but it is a request after the page's own, so a linked button
shows up later than the rest.

Only the target record's key is known, not the record itself, so a linked action's `label` cannot
be templated with that record's values.

## DefaultActionsDescriptor

An action slot holds `ActionDescriptor`s and `DefaultActionsDescriptor`s side by side, told apart by
`type`. The latter stands for a resource's default actions and expands into one descriptor per
action it covers.

```typescript
type ActionScopeType = 'list' | 'detail' | 'all';

type DefaultActionsDescriptor = {
  type: 'default_actions';
  reference?: ResourceReference;  // absent = the resource the slot is rendered for
  scope?: ActionScopeType;        // 'list' = collection actions, 'detail' = record actions; 'all' by default
};

type AnyActionDescriptor = ActionDescriptor | DefaultActionsDescriptor;
```

The expansion keeps the actions the surface shows — `showInList` ones on a list, `showInDetail` ones
on a detail — and leaves out an action opening the very view the slot belongs to. With a
`reference`, the address decides the surface: one with a `recordPk` is that record's detail, one
without it the collection's list, and every expanded descriptor carries the reference.

A slot renders exactly what it lists; absent or empty, it renders nothing.

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
