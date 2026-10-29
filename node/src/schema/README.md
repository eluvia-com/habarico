# `src/schema/` — schema layer

## Contents

- [What this layer is](#what-this-layer-is)
- [Acceptance test](#acceptance-test-why-the-layer-is-defined-this-way)
- [Internal structure](#internal-structure)
  - [The `components/` subsystems](#the-components-subsystems)
- [Key concepts](#key-concepts)
- [Entry point (`SchemaAdmin`)](#entry-point-schemaadmin)
  - [What `SchemaAdmin` wires](#what-schemaadmin-wires)
  - [Dynamic resource/route generation](#dynamic-resourceroute-generation)
  - [Locale seeding](#locale-seeding)
  - [The rest of `base/`](#the-rest-of-base)
- [Customization providers](#customization-providers)
- [Dashboard & widgets](#dashboard--widgets)
- [View routing & presentation](#view-routing--presentation)
- [User preferences & backend sync](#user-preferences--backend-sync)
- [Rules](#rules)

## What this layer is

The **schema layer is the schema-driven core of `habarico`.** Its input is a Habarico
_schema_ (a top-level `ServiceSchema` plus a per-resource `ResourceSchema`) and its output is a
whole admin UI — menu, list / show / edit / create / action views, fields, inputs, boxes and
actions — **generated**, not hand-written.

Where the **admin layer** (`@admin`) gives you resource-aware, schema-agnostic widgets you wire up
by hand, this layer **reads the schema** and decides _which_ widgets to render and _how_. It is
built _on top of_ `admin + design + foundation`.

```
schema   →   admin   →   design   →   foundation
(schema-driven) (React Admin + our skin) (pure MUI presentation) (non-visual kernel)
```

Dependencies flow **strictly downwards**. The schema layer is the **topmost** layer: it may import
`@admin`, `@design`, `@design/theme` and `@foundation` (and `react-admin`) — and nothing imports it back.

## Acceptance test (why the layer is defined this way)

The layer is "correct" precisely when a **complete admin can be generated from a Habarico schema
alone — with no per-screen code.**

That test is exercised in Storybook: `src/schema/pages/*.stories.tsx` boot a real `<SchemaAdmin>`
wired to a mock `SchemaProvider` and an in-memory `ra-data-fakerest` data provider, then let the
hand-authored mock schema generate the entire UI — **no live backend, no hand-built views**. They
are the schema-layer analogue of the admin layer's `admin/pages/*` screens — one level up, driven
by a schema instead of explicit `<Resource>` / view components.

The story-support harness (`pages/_shell.tsx` and `pages/_data.ts` — the mock providers and the
hand-authored schema fixtures) is **not** part of the public API and is never exported from the
barrel, mirroring the `admin/pages/_shell.tsx` / `design/pages/_shell.tsx` convention.

## Internal structure

Like `admin`, the schema layer is **not** a design system, so it uses a plain `components/`
directory (organised by schema concern), with the cross-cutting concerns (`contexts`, `hooks`,
`providers`, `utils`) as siblings at the layer root. Every component / hook / context is a **folder
with its own `index.ts`**, and the layer's root `index.ts` re-exports the public members. The whole
schema-driven core lives under `src/schema/**` — the former top-level `src/components/base`,
`src/providers`, `src/hooks`, `src/contexts` and `src/utils` folders were dissolved into it, and the
`@schema` / `@schema/*` aliases resolve here directly.

| Directory / file      | Contents                                                                                                                                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/`         | The schema-driven UI, grouped by concern (`base`, `views`, `boxes`, `fields`, `inputs`, `buttons`, `collections`, `filters`, `breadcrumbs`, `dynamic`, `dashboard`, `widgets`) — see [The `components/` subsystems](#the-components-subsystems) below.                        |
| `contexts/`           | The schema context ring — `SchemaRootContext` (the schema root: services schema + all providers), `Resource*Context`, `ViewSchemaContext`, `FieldSchemaContext`, `ActionSchemaContext`, `SchemaViewRouterContext`, etc.                                                       |
| `hooks/`              | Schema-aware hooks — schema fetching (`useGetResourceSchema`, `useGetServiceSchemas`, `useGetBaseResourceSchema`), resource-element building, actions (`useCallAction`, `useTriggerAction`), aggregates and the dashboard store.                                              |
| `providers/`          | The `SchemaProvider` / `DataProvider` and the pluggable `default*Provider` customization providers (box / button / field / input / widget).                                                                                                                                   |
| `utils/`              | Schema helpers — `api.ts` (schema/record shaping, box & field-descriptor helpers, error handling), descriptor generation, field selection, the preferences store and related utilities.                                                                                       |
| `types.ts`            | The schema type definitions exposed as `@schema/types` — `ServiceSchema`, `ResourceSchema`, `BoxSchema`, `ViewSchema`, `FieldSchema`, `MenuSchema`, `HabRecord`, the `FieldType` / `FieldFormat` / `BoxType` / `ViewType` unions, and the descriptor types the views consume. |
| `constants.ts`        | Schema-layer constants (e.g. `defaultListWidgetTypes`).                                                                                                                                                                                                                       |
| `pages/`              | **Story-support only** (never exported): the schema-layer story harness — `_shell.tsx` (`SchemaStoryShell`, boots a real `SchemaAdmin`), `_data.ts` (mock `SchemaProvider` / data provider + hand-authored schema fixtures) and the `*.stories.tsx` screens.                  |
| `index.ts`            | The layer barrel (`@schema`) — re-exports the public members from each area.                                                                                                                                                                                                  |
| `Welcome.stories.tsx` | The layer's Storybook documentation page (`schema/Welcome`).                                                                                                                                                                                                                  |

### The `components/` subsystems

| Directory      | Role                                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base/`        | **Entry points & app scaffold** — `SchemaAdmin` (the root, see below), `SchemaResource` / `SchemaSubResource` (fetch + provide a resource's schema to its views), `SchemaLayout` (app shell + generated menu), `SchemaSearch` (global search).                        |
| `views/`       | The view shells `SchemaList` / `SchemaShow` / `SchemaCreate` / `SchemaEdit` / `SchemaAction`, the `SchemaViewRouter`, the view title / toolbar / action parts, and `SchemaSidePanel`. Each reads the schema, computes the slots, and renders an **admin view shell**. |
| `boxes/`       | The **layout tree**: `SchemaBox` dispatches on `BoxType` to the `tab` / `grid` / `array` / `list` / `object` / `gallery` / `simple` / `wizard` containers; the leaves are fields / inputs.                                                                            |
| `fields/`      | Read-only field renderers keyed by `FieldType` + `FieldFormat`: the `SchemaField` dispatcher, the typed fields, the reference / relation fields and `SchemaRecordLink`.                                                                                               |
| `inputs/`      | Write-mode input renderers: `SchemaInput` (a readonly-vs-writable split), the typed inputs, the resource-reference picker and the upload input.                                                                                                                       |
| `buttons/`     | Action buttons built from an `ActionSchema`: `SchemaButton(s)`, the action triggers, the create / edit / show / menu buttons, `ResourceButton`, `ExportButton` (backend export), and the AI-assistant / upload-files buttons.                                         |
| `collections/` | Collection renderers: `SchemaDatagrid` (the admin datagrid wired with schema columns / row actions) and `SchemaImages` (a draggable image gallery).                                                                                                                   |
| `filters/`     | `SchemaFilter` — the list filter inputs, resolved through the input provider.                                                                                                                                                                                         |
| `breadcrumbs/` | The breadcrumb trail (`ViewSchemaBreadcrumbs`, from the menu / route schema).                                                                                                                                                                                         |
| `dynamic/`     | Conditional-render wrappers (`DynamicRenderWrapper`, `DynamicBoxSchemaComponentWrapper`) driven by a schema's `showQuery` / `requiredQuery`.                                                                                                                          |
| `dashboard/`   | `SchemaDashboard` — the configurable widget grid (see [Dashboard & widgets](#dashboard--widgets)).                                                                                                                                                                    |
| `widgets/`     | The pluggable dashboard widget types (`table`, `aggregate`, the charts) plus the add-widget wizard dialog and its shared config pickers.                                                                                                                              |

## Key concepts

- **Two schema levels.** A `ServiceSchema` lists the service's resources and drives registration +
  the menu; a `ResourceSchema` describes one resource's fields, views and actions.
- **Type + format pick the widget.** A field's `FieldType` (`string`, `integer`, `boolean`, …) and
  `FieldFormat` (`date`, `relation`, `choices`, `decimal`, …) together select the field / input
  component to render.
- **Boxes are the layout.** A view's `box` schema is a tree of `BoxType`s (`tab`, `grid`, `array`,
  `list`, `gallery`, `simple`, …) that maps onto layout containers; leaves are field descriptors.
- **Every record is a `HabRecord`.** At runtime each record extends React Admin's `RaRecord` with a
  `meta` sidecar — its per-record `schema` (`RecordSchema`), a `repr` display string, `tags` and an
  optional `triggerAction`.
- **Customization is pluggable.** Field / input / box / button / view / widget providers let a
  consumer override the generated components — the consumer provider is consulted first, the
  `default*Provider` is the fallback (see [Customization providers](#customization-providers)).

## Entry point (`SchemaAdmin`)

`SchemaAdmin` (`components/base/SchemaAdmin`) is the layer's **composition root** — the schema-driven
analogue of the admin layer's `BaseAdmin`. Where `BaseAdmin` boots a plain React Admin `<Admin>` you
feed explicit `<Resource>`s, `SchemaAdmin` **fetches the service schemas and generates the resources,
routes, menu and views**. It is built directly on the admin app shell: it reuses `AdminConfigProvider`,
`FormExtensionsProvider`, `UnsavedChangesProvider`, `useGetI18nProvider`, the `withRaDefaults` themes,
the auth pages and `Loading` / `NotFound` / `Notification` from `@admin`.

### What `SchemaAdmin` wires

Provider stack, outermost → in:
`QueryClientProvider` → `LocaleProvider` → **`AdminConfigProvider`** (the shared app-shell config,
the same context `BaseAdmin` uses) → **`SchemaRootContextProvider`** → `FormExtensionsProvider` →
`SchemaAdminRuntime`.

- **`SchemaRootContextProvider`** holds the schema layer's own state: it fetches the `ServicesSchema`
  (via the consumer's `schemaProvider`), builds the `ServiceDataProvider` (via `dataProviderFactory`),
  and exposes them plus the generated `resources`, the customization-provider pairs (see below),
  `supportedWidgetTypes`, `hasDashboard` and the current user identity. It sits **outside** `<Admin>`
  so the first schema fetch can run before React Admin mounts. The identity is not its own: it
  arrives in `value` from `useStoreIdentity` in `SchemaAdmin` — the same one the per-user store
  (`useSchemaAdminStore`) is scoped by — and is kept current by `SchemaIdentitySync`, rendered by
  `DynamicAdminUI` inside `<Admin>`. The provider is public; `docs/base-components/` shows the stack
  assembled by hand.
- **`SchemaAdminRuntime`** consumes `SchemaRootContext` (it needs the resolved `dataProvider` /
  `authProvider` — a component can't read a context it provides) and renders React Admin's
  `<AdminContext>` → **`DynamicAdminUI`**, with `layout={SchemaLayout}`, the auth login page,
  `catchAll={NotFound}` and the dashboard.

### Dynamic resource/route generation

`DynamicAdminUI` is the schema analogue of React Admin's `<AdminUI>`: once `SchemaRootContext.isLoaded`
is true it renders the **generated resource elements** (`useResourceElements`, built from the fetched
schemas) so React Admin registers their routes; until the routes are registered it holds `catchAll`
on `Loading` (a deferred value avoids a not-found flash). It also mirrors the React Admin identity
back into `SchemaRootContext`.

### Locale seeding

The React Admin store is the single source of truth for locale. Because the first schema fetch runs
**above** `<Admin>` (where `useLocaleState` isn't available yet), `SchemaAdmin` reads the persisted
locale from the store with `useSyncExternalStore` and seeds both the schema fetch and the i18n provider
with it — so there's no browser-default→persisted blink, and a language switch (which writes the store)
**refetches the schemas**.

### The rest of `base/`

`SchemaLayout` provides the app shell and computes the menu from the resource schemas (`useSchemaMenu`,
which must run inside `<Admin>`); `SchemaResource` / `SchemaSubResource` fetch and provide a resource's
schema to its views; `SchemaSearch` powers global search. There is no built-in dashboard: pass a
component through the `dashboard` prop to mount one at `/`, or leave it unset for a shell without one.

## Customization providers

The heart of the layer is turning a **schema descriptor** into a React component through a **pluggable,
three-level override chain**. Each family — fields, inputs, boxes, buttons, views, widgets — has a
resolver hook (`useGetField`, `useGetInput`, `useGetBox`, `useGetButton`, `useGetWidget`, …) that the
`Schema*` dispatchers (`SchemaField`, `SchemaInput`, `SchemaBox`, `SchemaButton`, …) call to pick the
component for a given `FieldType` + `FieldFormat` (or `BoxType` / `ActionType` / widget type).

Each resolver consults, in order, and takes the first that returns an element:

1. **a per-resource provider** — set by `SchemaResource` for one resource
   (`ResourceFieldProviderContext` and its `Resource{Input,Box,Button}` siblings), for
   resource-specific overrides;
2. **the consumer's global provider** — `fieldProvider` / `inputProvider` / `boxProvider` /
   `buttonProvider` / `widgetProvider`, passed to `SchemaAdmin` and carried in `SchemaRootContext`, for
   app-wide overrides;
3. **the `default*Provider`** — the built-in mapping (`defaultFieldProvider`, `defaultInputProvider`,
   …) that renders the standard **admin-layer** components.

Returning `undefined` falls through to the next level; returning `null` explicitly suppresses the
render. This lets a consuming app restyle or replace any generated widget without forking the library,
and it is why the admin-layer field / input / button primitives stay schema-agnostic — the
`default*Provider` is the only thing that maps a schema onto them.

## Dashboard & widgets

The dashboard is the default home screen and the layer's most context-heavy subsystem.

- **`SchemaDashboard`** (`components/dashboard`) renders the design-layer **`DashboardGrid`** from the
  widget configs held in **`useDashboardStore`** (persisted in the React Admin store under the
  dashboard preferences). It toggles between **detail** and **edit** mode; in edit mode the grid is
  drag/resize-able, `findFreeSlot` positions new widgets, and layout changes are buffered and flushed
  on "Done" (the store validates overlaps, so intermediate states are swallowed). The edit-mode toggle
  is **portaled into the layout header** via the admin `ViewPresentationContext.setActions`. Add / edit
  / delete run through a wizard dialog (`WidgetDefinitionDialogContent`).
- **Pluggable widget types.** `useGetWidget` resolves a widget's `type` to a **`WidgetDefinition`**
  (`providers/types.ts`) — the consumer's `widgetProvider` first, then `defaultWidgetProvider`. A
  definition carries the render `Component`, an optional `ConfigStep` (the wizard's config step; a
  generic label-only step is used when omitted), `defaultLayout` (incl. the `minW` / `minH` resize
  bounds), `labelKey`, `flushContent`, `dataSource` (`'resource' | 'aggregate' | 'none'`) and
  `requiresGroupBy`. Built-ins (`components/widgets`): `table`, `aggregate`, `simple-aggregate`, `bar`,
  `pie`, `line`. Each rendered widget is wrapped in a `ResourceContextProvider` so relation hooks
  resolve against its resource, and the panel title links to that resource's list view (`useListHref`).
- **`dataSource` drives the wizard.** `resource` widgets read a regular list endpoint, `aggregate`
  widgets use the resource's `/aggregate` endpoint, and `none` needs no resource; chart widgets set
  `requiresGroupBy`.
- **The add-widget wizard** (`WidgetDefinitionDialog` + the `shared/` pickers) gates which resources
  and types are offered through `resourceSupportsDataSource(resource, dataSource)` (`components/widgets/utils.ts`),
  used by both the wizard's `ResourceStep` (which resources) and `TypeStep` (which types). A resource
  is only eligible when it sets `dashboardEnabled`; `aggregate` additionally needs `aggregateEnabled`
  and `resource` additionally needs a `list` view. These flags come from `BaseResourceSchema`
  (`dashboard_enabled` / `aggregate_enabled` in the backend schema — see `openapi.yaml`).

## View routing & presentation

A schema view (`list` / `show` / `create` / `edit` / `action`) can open as a full **page**, a
**dialog** or a docked **side panel** — and the same view components serve all three. The mechanism is
split across two layers:

- **`SchemaViewRouterContext`** (schema) is the routing half: it carries _where we are_ (`resource`,
  `id`, `data`) and _how to move_ (`changeView` / `prevView` / `getViewLink`). `SchemaViewRouter`
  renders the view for the current target and is **surface-agnostic**.
- **`ViewPresentationContext`** (admin) is the presentation half: it decides whether the view paints on
  a page, in a dialog or in a side panel, and portals the view's title / actions to the right target.
  The openers (`SchemaViewActionTrigger`, `useRecordLink`, `SchemaSidePanel`) wrap `SchemaViewRouter` in
  the admin `ViewDialog` / `ViewSidePanel`, which provide that context; the action's `ViewMode`
  (`'redirect' | 'dialog' | 'sidepanel'`) chooses which.

Down the stack, the `Schema*` views render the **admin view shells** (`ShowShell` / `EditShell` /
`CreateShell` / `ListShell`): the schema layer computes the slots and controller props, while the admin
layer owns the React Admin controller and the presentation frame (see admin/README → **View shells**).

## User preferences & backend sync

UI state — the dashboard layout, theme, locale, datagrid column selection, saved queries, … —
persists through React Admin's `useStore`.

- **Multi-service.** A single `SchemaAdmin` can serve **several backend services** via its
  `serviceConfigMap`: each `ServiceConfig` has its own `url` (and menu section), and its own data
  provider is built by `dataProviderFactory`.
- **Backend sync (opt-in per service).** When a service sets `syncPreferences: true`, a whitelisted
  subset of store keys (`PREFERENCES_WHITELIST` in `utils/preferencesStore.ts`) is mirrored to that
  backend's `user-preferences` endpoint group (see `openapi.yaml`); everything else stays local. The
  store factories live in the admin layer — `@admin/utils/createBackendStore` (backend-synced) and
  `createPerUserStore` (per-user local). The `user-preferences` API is optional: clients tolerate a
  `404` on the whole group and fall back to local defaults.

## Rules

- **Only this layer reads a Habarico _schema_.** It is the topmost layer: it may import `@admin`,
  `@design`, `@design/theme`, `@foundation` and `react-admin` — and **nothing** imports `@schema`.
- **Generate, don't hand-build.** Turn schema descriptors into UI through the customization providers
  and the admin view shells / widgets; don't re-implement React Admin wiring or re-style primitives
  here. To change what is rendered, extend a `default*Provider` or pass a consumer provider — don't
  branch inside the `Schema*` dispatchers.
- **Schema vocabulary lives in `@schema/types`.** New schema types go there; generic, schema-agnostic
  vocabulary belongs in a lower layer (`LinkTarget` in `@foundation`, the record-`meta` contract in
  `@admin`) so the layers below can share it.
- **Keep per-resource behaviour in the per-resource providers / contexts**, not in global conditionals.

The downward-only layering (`schema → admin → design → foundation`) is enforced in CI by the
`boundaries/dependencies` ESLint rule (see the repo-root `eslint.config.mjs`): the schema layer is the
topmost layer — it may import `@admin`, `@design` and `@foundation`, and nothing may import `@schema`.
