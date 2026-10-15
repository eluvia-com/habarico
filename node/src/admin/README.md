# `src/admin/` — admin layer

## Contents

- [What this layer is](#what-this-layer-is)
- [Acceptance test](#acceptance-test-why-the-layer-is-defined-this-way)
- [Internal structure](#internal-structure)
  - [The `components/` subsystems](#the-components-subsystems)
  - [Where does a member go?](#where-does-a-member-go)
- [Entry point & app shell (`BaseAdmin`)](#entry-point--app-shell-baseadmin)
  - [What `BaseAdmin` wires](#what-baseadmin-wires)
  - [`AdminConfigContext` — config for the shell components](#adminconfigcontext--config-for-the-module-level-shell-components)
  - [App shell — `AdminDashboardLayout`](#app-shell--admindashboardlayout)
  - [Settings bridge — react-admin ⇄ `SettingsContext`](#settings-bridge--react-admin--design-settingscontext)
  - [i18n](#i18n)
- [View shells (Show / Edit / Create / List)](#view-shells-show--edit--create--list)
  - [The admin view shells](#the-admin-view-shells)
  - [The presentation frame](#the-presentation-frame)
  - [Surfaces are per view type, not shared](#surfaces-the-paper-card-are-per-view-type-not-shared)
  - [Presentation surface & the dialog / side-panel variant](#presentation-surface--the-dialog--side-panel-variant)
  - [Slot conventions](#slot-conventions)
- [Forms (drafts & the unsaved-changes guard)](#forms-drafts--the-unsaved-changes-guard)
  - [Drafts — autosave & restore](#drafts--autosave--restore)
  - [Unsaved-changes navigation guard](#unsaved-changes-navigation-guard)
  - [Form-extension registry](#form-extension-registry)
- [Search highlighting](#search-highlighting)
- [Rules](#rules)

## What this layer is

The **admin layer is React Admin, restyled into our design system.** It binds
[React Admin](https://marmelab.com/react-admin/) (data provider, resources, list/show/edit
views, fields, inputs, buttons, datagrid, auth) to the presentational **design layer**
(`@design`) and the non-visual **foundation** kernel (`@foundation`).

It is **resource-aware** (it knows about React Admin resources, records and CRUD) but
**schema-agnostic**: nothing here reads a Habarico _schema_. Turning a schema into an admin
UI is the job of the layer above (`@schema`), which is built _on top of_ this one.

```
schema   →   admin   →   design   →   foundation
(schema-driven) (React Admin + our skin) (pure MUI presentation) (non-visual kernel)
```

Dependencies flow **strictly downwards**. The admin layer may import `@design`,
`@design/theme`, `@foundation` and `react-admin` — it must **never** import `@schema`.

## Acceptance test (why the layer is defined this way)

The layer is "correct" precisely when you can **build a working React Admin app out of
`admin + design + foundation` alone — with no schema layer — and it looks like our design.**

That test is exercised in Storybook: `src/admin/pages/*.stories.tsx` stand up a real
`<Admin>` (seeded with an in-memory `ra-data-fakerest` data provider and the design theme)
and render live List / Detail / Edit / Dialog / Dashboard screens using React Admin + our
design skin, **without any `Schema*` component**. They are the admin-layer analogue of the
design layer's `design/pages/*` mockups — one level up, and _live_ rather than static.

The story-support harness (`pages/_shell.tsx`, the fake data provider and the schema-free
admin layout adapter) is **not** part of the public API and is never exported from the
barrel, mirroring the `design/pages/_shell.tsx` convention.

## Internal structure

Unlike `design`, the admin layer is **not** itself a design system, so it does not use the
atomic tiers (atoms / molecules / organisms). The renderable members live under **`components/`**,
organised by **React Admin concern** — each cohesive area is its own sub-directory
(`components/auth`, `components/layouts`, `components/settings`, …). Cross-cutting, non-component
concerns stay at the layer root (`contexts`, `hooks`, `providers`, `utils`, `theme`, `pages`).
Every component is a **folder with its own `index.ts`** (e.g. `components/auth/AuthPage/index.ts`),
and the layer's root `index.ts` re-exports the public members — this differs from `design`, whose
tier directories have no `index.ts`. The **root** table below lists the layer-root areas; the
[**`components/` subsystems**](#the-components-subsystems) table breaks out the `components/`
sub-directories.

| Directory / file | Contents                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/`    | The renderable React Admin restyles, grouped by concern (`base`, `views`, `layouts`, `datagrid`, `fields`, `inputs`, `buttons`, `auth`, `dialogs`, `settings`, `common`) — see [The `components/` subsystems](#the-components-subsystems) below.                                           |
| `contexts/`      | Admin-generic React contexts: `RootRecordContext`, `UploadingContext`, `FormInputSourcesContext`, `FormExtensionsContext`, `ResourceContext`, `ViewPresentationContext`, `AdminConfigContext`, `IconsContext`, `UnsavedChangesContext`.                                                    |
| `hooks/`         | Admin-generic hooks (per-hook folder): `useUploadQueue`, `useRowClick`, `useDraftStore`, `useSubmitForm`, `useGetAll`, `useStrTemplate`, `useFieldHighlight`, `useTreeChoices`, `useFormArrayInputLabels`, `useUploadAreaLabels`, `useBasenameNavigate`.                                   |
| `providers/`     | Auth provider + its types: `buildServiceAuthProvider` (a plain factory, not a hook and not tied to any auth library — builds a React Admin `AuthProvider` from injected `login` / `logout` / `getAuthData` / … functions — and `MfaRequiredError`) and `ServiceAuthProvider` (`types.ts`). |
| `utils/`         | Admin utilities: `api.ts` (`handleErrorResponse` — throws react-admin `HttpError`), `choices.ts` (the schema-free `Choice`/`Choices` model), `highlight.ts` (`selfHighlightingField` + the generic `SearchObjectHighlight` search-match shape).                                            |
| `theme/`         | Admin-specific theme glue on top of the design theme: `raDefaults` (React Admin default props / overrides).                                                                                                                                                                                |
| `overrides/`     | `ra-iu-materialui` — the restyled forks of `ra-ui-materialui` components not yet foldered into `components/`, re-exported through the `@admin` barrel behind the same import path.                                                                                                         |
| `types.ts`       | Admin-layer generic types (`@admin/types`): `AdminRecord` / `AdminRecordMeta` — the schema-agnostic record `meta` sidecar (`repr`, `highlights`) the skin understands, of which the schema `HabRecord` is a structural superset.                                                           |
| `constants.ts`   | Admin-layer constants (`DEFAULT_SORT`, `DOUBLE_CLICK_DELAY`, `TOOLTIP_ENTER_DELAY`).                                                                                                                                                                                                       |
| `pages/`         | **Story-support** harness — live `<Admin>` demos (fake data provider + mock shell). Not shipped, never exported from the barrel; parallels `design/pages/`.                                                                                                                                |
| `index.ts`       | The layer barrel (`@admin`) — re-exports the public members from each area's `index.ts`, plus the RA forks from `@admin/overrides/ra-iu-materialui`.                                                                                                                                       |

### The `components/` subsystems

| Directory               | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base/AdminHashRouter/` | `AdminHashRouter` — the hash router of an admin the application renders outside a router of its own, created once (React Admin's own is re-created on every `<AdminContext>` render and loses a redirect issued after one). Used by `BaseAdmin` and `SchemaAdmin`.                                                                                                                                                                                                                               |
| `base/BaseAdmin/`       | The schema-free **entry point** — the admin-layer analogue of `SchemaAdmin`. Boots a plain React Admin `<Admin>` styled into the design layouts, wiring i18n, the dashboard shell, the account menu and the auth routes. See [Entry point & app shell](#entry-point--app-shell-baseadmin).                                                                                                                                                                                                       |
| `views/`                | **View shells & field/list layouts** — `ShowShell` / `EditShell` / `CreateShell` (own their RA controller + `ViewContent`), `FormShell` (form context), `ViewContent` / `ViewTitle` / `ViewActions` (presentation), `ViewToolbar` (shared bottom action bar), `ListSurface` (list paper card) + `DatagridActions` (its config toolbar), `ListShell` and the design-grid layouts `PropertyShowLayout` / `PropertyFormLayout`. See [**View shells**](#view-shells-show--edit--create--list) below. |
| `layouts/`              | App **shells**: `AdminDashboardLayout`, `AdminAuthLayout` — React Admin restyled into the design `DashboardLayout` / `AuthLayout`.                                                                                                                                                                                                                                                                                                                                                               |
| `datagrid/`             | `AdminDatagrid` — the React Admin datagrid restyled (grey header band, sticky right-pinned action column, drag-reorder, column resize; styling in `datagridSx`).                                                                                                                                                                                                                                                                                                                                 |
| `fields/`               | **Display components** (RA field restyles): `TextField`, `NumberField`, `BooleanField`, `DateField`, `TimeField`, `EmailField`, `PhoneNumberField`, `UrlField`, `ImageField`, `ChipArrayField`, `ChoicesField`, `TreeArrayField`, `WrapperField` + `localflavor/` (cz).                                                                                                                                                                                                                          |
| `inputs/`               | **Form input components** (RA input restyles): `TextInput`, `NumberInput`, `ChoicesInput`/`ChoicesArrayInput`, `AutocompleteInput`/`AutocompleteArrayInput`, `BooleanInput`/`TriStateBooleanInput`, `CheckboxInput`, `DateInput`/`DateRangeInput`/`DateTimeInput`, `TimeInput`, `PhoneNumberInput`, `UploadInput`, `FormArrayInput`, `TreeArrayInput` + `localflavor/` (cz).                                                                                                                     |
| `buttons/`              | **Admin action buttons**: the shared `ActionButton` primitive, form/record buttons (`SaveButton`, `SubmitButton`, `DeleteButton`, `LinkButton`, `LinkActionTrigger`), the list toolbar (`FilterButton`, `FilterDrawerButton`, `SavedQueriesButton`) and the datagrid-config buttons (`SelectColumnsButton`, `Reset{Sort,ColumnsWidth,Configurable}DatagridButton`).                                                                                                                              |
| `auth/`                 | Authentication surfaces: the account dialogs (`ChangePasswordDialog`, `UpdateIdentityDialog`) and pages (`AuthPage`, `ResetPasswordPage`, `LogoutPage`).                                                                                                                                                                                                                                                                                                                                         |
| `dialogs/`              | Shared admin-layer dialogs: `DraftRestoreDialog` (form draft restore) and `UnsavedChangesDialog` (navigation guard).                                                                                                                                                                                                                                                                                                                                                                             |
| `settings/`             | The React Admin ⇄ design `SettingsContext` **bridge** (`useAdminSettings`, `AdminSettingsStyles`).                                                                                                                                                                                                                                                                                                                                                                                               |
| `common/`               | Shared admin UI **primitives** too small for their own area: `Loading`, `NotFound` and `DynamicText`.                                                                                                                                                                                                                                                                                                                                                                                            |

### Where does a member go?

Classify by **concern**, not by size:

- **feature area** — a cohesive subsystem with several related components (and its own
  logic): its own top-level directory. _`auth`, `layouts`, `settings`._
- **entry point** — the layer's composition root: `BaseAdmin/`.
- **shared primitive** — a small, generic UI piece reused across areas (and by the schema
  layer): grouped under `common/`, not a top-level directory of its own. _`Loading`, `NotFound`, `DynamicText`._
- **RA component family** — a large flat collection of one kind of React Admin restyle: its
  own top-level directory. _`fields`, `inputs`, `buttons`, `datagrid`._
- **view shell / layout** — a per-view-type context+presentation shell or a field/list layout:
  `views/`. _`ShowShell`, `FormShell`, `ListShell`, `PropertyShowLayout`._
- **non-visual support** — data hooks, contexts, providers and utils: the usual per-layer
  skeleton (`hooks`/`contexts`/`providers`/`utils`).

## Entry point & app shell (`BaseAdmin`)

`BaseAdmin` (`components/base/BaseAdmin`) is the layer's **composition root** — the schema-free
analogue of `SchemaAdmin`. It boots a plain React Admin `<Admin>` (no schema fetching, no
`DynamicAdminUI`) styled into the design layouts, and is exactly the surface the
[acceptance test](#acceptance-test-why-the-layer-is-defined-this-way) stands up. Its props **are**
the public admin API — React Admin wiring (`dataProvider` / `authProvider` / `store` / `basename`),
the design light/dark themes, i18n, the layout slots, and the auth / account / form / list options.

### What `BaseAdmin` wires

- **React Admin `<Admin>`** with the design themes (`withRaDefaults(createLightTheme())` /
  `…Dark…` — the React Admin default props/overrides merged onto the design theme), an i18n provider
  (below), a per-user `store` (`useAdminStore`, overridable — e.g. `memoryStore()` in stories),
  `layout={BaseAdminLayout}`, `loginPage={BaseAdminAuthPage}`, the optional `dashboard`,
  `catchAll={NotFound}` and the `notification` component.
- **App-level providers** around `<Admin>`: `AdminConfigProvider` (see below),
  `FormExtensionsProvider` and `UnsavedChangesProvider` (the cross-cutting form state — draft
  autosave/restore and the unsaved-changes navigation guard).
- **No-layout custom routes** for `/reset-password/:token` and `/logout`.

### `AdminConfigContext` — config for the module-level shell components

React Admin renders `layout` and `loginPage` as module-level component **types**, so they can't be
given props. The schema-agnostic app-shell config — `logo`, `menu`, `search`, `breadcrumbs`,
`availableLanguages`, `contentMaxWidth`, the account/auth options, the form flags (`navigationGuard`,
`draftEnabled`), `defaultPerPage`, `iconsMap`, … — is therefore carried down through
**`AdminConfigContext`** (`contexts/AdminConfigContext`), provided by `BaseAdmin` and read by
`BaseAdminLayout`, `BaseAdminAuthPage` and the schema list toolbars. It is the single app-config
context both entry points share (so the schema layer's `SchemaAdmin` can provide the same context).

### App shell — `AdminDashboardLayout`

`BaseAdminLayout` is the thin `<Admin layout>` wrapper: it reads `AdminConfigContext` and maps it
onto **`AdminDashboardLayout`**, wrapping the routed view in the design `DashboardContent` container
(plain React Admin views bring no container of their own — unlike the schema views, which self-wrap).

`AdminDashboardLayout` (`components/layouts/`) is **React Admin restyled into the design
`DashboardLayout`**. It owns the cross-cutting chrome and feeds the design layout only presentational
slots:

- the **account menu** (update-identity / change-password / logout) and the two account **dialogs**
  (`UpdateIdentityDialog` / `ChangePasswordDialog`, wrapping the `updateIdentity` / `changePassword`
  nodes; a successful submit closes the dialog);
- the signed-in **identity** (`useGetIdentity`) for the account header;
- the date **`LocaleProvider`** keyed on the current locale, so date inputs follow the header
  language switch.

Because RA's `layout` prop expects a bare `ComponentType`, the shell takes its configuration as
props and is wrapped in the small `BaseAdminLayout` closure at the call site. The routed view's
title / actions reach the layout header through the presentation portal described in
[View shells](#view-shells-show--edit--create--list) (`ViewPresentationContext`), not through this
component.

### Settings bridge — react-admin ⇄ design `SettingsContext`

`useAdminSettings` (`components/settings/`) bridges the presentational `SettingsContext` (colour
mode, page width, density, striped rows, contrast, locale) to React Admin storage, and returns the
value fed into the design `LayoutProvider` / `SettingsProvider` — so the settings panel and the
header toggles drive real, persisted state:

- **colour mode** via the React Admin theme store (`useTheme`); **locale** via `useLocaleState`
  (the bridge also _owns_ the locale — it resets to the first `availableLanguage` when the current
  locale isn't offered); everything else under `preferences.layout.app.*` via `useStore`.
- **density & striped rows** are applied as `document.body` classes; `AdminSettingsStyles` renders
  the matching global CSS (scoped to the React Admin datagrid — which is why it lives in the admin
  layer, not `design`). Driving these via body classes means toggling them costs **zero table
  re-renders**.

### i18n

`useGetI18nProvider` builds the i18n provider from `availableLanguages`; the default locale is the
`defaultLocale` prop, else the closest of the browser languages, else `en`. The header language
switcher flips the React Admin locale through the settings bridge, which re-translates the shell and
swaps the date `LocaleProvider`.

## View shells (Show / Edit / Create / List)

The four CRUD views — **show / edit / create / list** — in both their full-page and
**dialog / side-panel** presentations are assembled from three layers. Two of them live **here in
the admin layer** and are reusable with or without a schema; the third is the schema layer on top:

1. **The schema shell** (`SchemaShow` / `SchemaEdit` / `SchemaCreate` / `SchemaList`, in `@schema`)
   is the only layer that reads a schema. It sets up the schema contexts, computes the slot nodes
   (title, actions, the field boxes / datagrid, the form / bottom actions) and the plain React Admin
   controller props, then renders the admin view shell. **Not part of this layer.**
2. **The admin view shell** (`ShowShell` / `EditShell` / `CreateShell` / `ListShell`, in `views/`)
   owns the React Admin data controller (`<Show>` / `<Edit>` / `<Create>` / `<List>`) and the
   surrounding record / form / list contexts. It has no visuals of its own — it renders the
   presentation frame and forwards the slots it was given. It takes the controller's props
   (`queryOptions`, `transform`, `mutationOptions`, `sort`, `filter`, …) as plain React Admin values,
   so the schema shell can configure it **without any schema type leaking down**.
3. **The admin presentation** (`ViewContent` + `ViewTitle` / `ViewActions` / `ViewToolbar`, plus the
   field/list layouts `PropertyShowLayout` / `PropertyFormLayout` / `AdminDatagrid`, in `views/`) is
   pure chrome and **page-type agnostic** — the page-vs-dialog difference is read from
   `ViewPresentationContext`, never branched on by callers.

So **production** stacks all three (`SchemaShow → ShowShell → ViewContent`), while a **schema-free
admin app** — and every `pages/*.stories.tsx` — stacks only the two admin layers
(`ShowShell → ViewContent`). That second path is exactly the [acceptance test](#acceptance-test-why-the-layer-is-defined-this-way) above.

### The admin view shells

Each shell owns its controller and renders the presentation frame; they differ in the context each
sets up:

- **`ShowShell`** wraps `<Show>` (its own actions off, `component="div"` so it adds no card),
  re-provides the loaded record as `RootRecordContext` + `RecordContext`, waits out the React Admin
  loading skeleton, and renders `ViewContent`. Slots: `title`, `toolbarActions`, `breadcrumbs`,
  `bottomActions`, `children`; plus `controllerProps`.
- **`EditShell`** / **`CreateShell`** wrap `<Edit>` / `<Create>` and render `ViewContent` around
  **`FormShell`** (`EditShell` waits for the record; a create has nothing to load). Slots: `title`,
  `toolbarActions`, `breadcrumbs`, `formActions` (the submit / delete bar), `children`; plus
  `controllerProps`, `onSubmit` / `onPostSubmit`, `defaultValues`. A **read-only** edit/create is a
  schema-shell decision — it renders `ShowShell` instead, so these shells carry no `readOnly` notion.
- **`ListShell`** wraps `<List>` / `<InfiniteList>`, provides `ListConfigContext` (from its
  `listConfig`) and an optional `ResourceContextProvider`, and renders `ViewContent` → `ListSurface`
  → the datagrid (with an optional docked side panel). Slots: `title`, `toolbarActions`,
  `breadcrumbs`, `listActions` (defaults to `DatagridActions`), `filters`, `sidePanel`, `children`;
  plus `controllerProps`, `listConfig`, `infinite`.
- **`FormShell`** is the form context the edit/create shells wrap: React Admin's `SimpleForm` (whose
  toolbar is a `ViewToolbar` holding the `formActions`, defaulting to a `SubmitButton`) plus the
  `UploadingProvider`, `FormInputSourcesProvider`, `RootRecordContext`, the `DraftController` and the
  `FormNavigationGuard`. The form's inputs arrive as `children`.

### The presentation frame

- **`ViewContent`** is a **card-less** flex column — it renders **no visible surface of its own**.
  It lays out the title, the toolbar actions, the content region, an optional bottom action bar and
  a breadcrumbs portal, taking their placement from `ViewPresentationContext`.
- **`ViewTitle`** / **`ViewActions`** are placement primitives (co-located in the `ViewContent`
  folder): they **portal** their content to the right target — the app header on a page, the dialog
  header in a dialog — via `ViewPresentationContext.setTitle` / `setActions`.
- **`ViewToolbar`** is the shared bottom action bar: a transparent, right-aligned React Admin
  `Toolbar` that collapses when empty. It backs both `ViewContent`'s `bottomActions` (detail views)
  and `FormShell`'s `SimpleForm` toolbar (form views), so detail and form get an identical bar.

### Surfaces (the paper card) are per view type, not shared

`ViewContent` deliberately renders **no card**. The visible paper surface is a **per-view-type**
presentation concern, because the view types differ:

- **Show / Edit / Create** have **no outer card**. Their content sits directly on the page
  background; any visible surface comes from the inner `Panel`s the content is grouped into (a
  detail is typically a `PanelGrid` of `Panel`s), not from the shell.
- **List** _is_ wrapped in a single paper card — **`ListSurface`** (a flex-column `Card`). Inside
  it, `ListShell` renders the list toolbar (`DatagridActions`, in the React Admin `<List>` actions
  slot), the inline filters (the `<List>` filters slot) and the `AdminDatagrid` body, styled by
  `listSx`. The card is owned by the **list presentation** (`ListShell`), never by `ViewContent` and
  never left to `children`.

So the rule is: **the surface belongs to the view-type presentation** — inner `Panel`s for
detail/form, one `ListSurface` card for list — never the shared `ViewContent`.

### Presentation surface & the dialog / side-panel variant

There is **no separate dialog shell.** Which surface a view renders into is a single context
value, `ViewPresentationContext` (`presentation: 'page' | 'dialog' | 'panel'`, `isInDialog`,
`setTitle`, `setActions`):

- On a **page** (no provider) it defaults to portaling the title/actions into the layout header.
- In a **dialog / side panel** the opener (`SchemaViewActionTrigger`, the side-panel controller)
  wraps the routed view in a `ViewPresentationProvider` whose `setTitle` / `setActions` portal
  into the dialog header, and whose `presentation` tells `ViewContent` to skip the breadcrumbs and
  route its `bottomActions` into `DialogActions`.

So the same shells are reused verbatim inside a dialog; only the surface context differs.

### Slot conventions

The shells share the same slot vocabulary, filled with plain nodes by whoever composes them (the
schema shell in production, the story/app author in a schema-free build). `ViewContent` places each
slot, taking its target from `ViewPresentationContext`:

| Slot             | Placed by                                            | Page                   | Dialog                |
| ---------------- | ---------------------------------------------------- | ---------------------- | --------------------- |
| `title`          | `ViewTitle` → `ViewPresentationContext.setTitle`     | layout header title    | `DialogTitle`         |
| `toolbarActions` | `ViewActions` → `ViewPresentationContext.setActions` | layout header actions  | `DialogTitle` actions |
| `breadcrumbs`    | `ViewContent` (skipped in a dialog)                  | layout breadcrumb bar  | —                     |
| `bottomActions`  | `ViewContent` bottom bar (`ViewToolbar`)             | in-flow footer toolbar | `DialogActions`       |
| `children`       | `ViewContent` content region                         | the fields / datagrid  | same                  |

Which shell fills the bottom bar differs by view type:

- **`ShowShell`** passes read-only detail actions to `ViewContent`'s `bottomActions`, so they portal
  to `DialogActions` in a dialog and render as a `ViewToolbar` footer on a page.
- **`EditShell`** / **`CreateShell`** leave `ViewContent.bottomActions` empty — the submit / delete
  bar is `FormShell`'s own `SimpleForm` toolbar (a `ViewToolbar`), rendered inside the form so submit
  stays wired.
- **`ListShell`** has no bottom bar: its `DatagridActions` toolbar sits at the top of the
  `ListSurface` card (the React Admin `<List>` actions slot), not at the bottom.

## Forms (drafts & the unsaved-changes guard)

`FormShell` (`components/views/FormShell`) is the form context the edit/create shells wrap. Beyond
the `SimpleForm` + toolbar (see [View shells](#view-shells-show--edit--create--list)), it sets up
the cross-cutting form machinery: it provides the `RootRecordContext` and the `UploadingProvider`,
and renders three form mechanisms inside the react-admin form subtree — **draft autosave/restore**,
the **unsaved-changes navigation guard**, and a **form-extension registry**. The first two are gated
by `AdminConfigContext` flags (`draftEnabled` / `navigationGuard`), so a plain build opts in.

### Validation mode

`SimpleForm` runs in **`onBlur`** mode: each field is validated when it loses focus, so validation
errors (both `required` and the rules the schema layer derives from `options.validators`) surface
next to the field before the form is submitted. Pass `mode` to override it —
`<FormShell mode="onSubmit">` restores submit-only validation — and it accepts any react-hook-form
strategy (`'onBlur'`, `'onSubmit'`, `'onChange'`, `'onTouched'`, `'all'`). The auto-generated schema
views (`SchemaCreate`, `SchemaEdit`, `SchemaAction`) use the default.

### Drafts — autosave & restore

- `DraftController` (rendered inside `SimpleForm`, active only when `draftEnabled`) debounce-saves
  the live form values to the React Admin store while the form is dirty, keyed
  `draft.<resource>.<recordId>` (`new` for a create), via **`useDraftStore`**.
- What gets persisted is sanitized by `prepareForDraft`: `File` / `FileList` values are dropped (not
  JSON-serializable), and strings over ~50 KB are skipped — a guard so base64-encoded file content
  can't exhaust the ~5 MB `localStorage` quota (those fields are simply empty on restore).
- On mount, if a draft already exists, `DraftRestoreDialog` offers **Restore**
  (`reset(draft, {keepDefaultValues: true})`) or **Discard**. The draft is cleared on discard and
  after a successful submit (`isSubmitSuccessful`).

### Unsaved-changes navigation guard

- `FormNavigationGuard` mirrors the form's dirty state into **`UnsavedChangesContext`**
  (`setHasUnsavedChanges`) so the rest of the app can react, and — when `navigationGuard` is on and
  the router supports blocking — blocks in-app navigation with `useBlocker`, showing
  `UnsavedChangesDialog` (Discard → `blocker.proceed()`, Stay → `blocker.reset()`).
- Two subtleties the code guards against: `useBlocker` throws outside a data router, so it is
  isolated in a child (`FormBlocker`) that renders only when `useCanBlock()` is true; and
  `isSubmitSuccessful` suppresses the guard during the post-save redirect (the form reset via new
  `defaultValues` lands on a later render, so `isDirty` is briefly still true).

### Form-extension registry

- **`FormExtensionsContext`** lets a component deep in the form subtree register an extra node
  (typically a dialog / overlay) by id; `FormShell` renders all registered nodes at the form root,
  so they live inside the form context (react-hook-form + record) without being nested where the
  registrant sits. Canonical pair: `SchemaAiAssistantButton` (registrant) ↔ `FormShell` (renderer);
  a no-op default keeps schema-free stories working without a provider.
- Sibling: **`FormInputSourcesContext`** tracks which input `source`s are currently mounted, for
  inputs that need to know about their live siblings.

## Search highlighting

When a list request matched a search, the backend attaches a per-record `meta.highlights` sidecar
(`SearchObjectHighlight[]`, see openapi `SearchHighlights`) — each entry naming a field path and
carrying the matched `value` plus optional `offsets`. The admin fields render that match so the user
sees **why** a row matched. The mechanism spans the field components, one hook and a tag:

- **`useFieldHighlight(source)`** (`hooks/`) returns the highlight for a field on the current record,
  or `undefined`. It normalizes the backend relation separator (`__`) to the FE's (`.`) and flags a
  relation field as a whole when any sub-attribute matched (source `customer` matches
  `customer__company_name`).
- **Self-highlighting fields render the mark inline.** `TextField` / `EmailField` / `UrlField` wrap
  `highlight.value` through `markToRichText` → the design `RichText`; `NumberField` /
  `PhoneNumberField` map the raw-value `offsets` onto their **reformatted** output via
  `applyOffsetsToFormatted` (the raw match position is meaningless once the value is reformatted).
  These components tag themselves with **`selfHighlightingField(...)`** (`utils/highlight.ts`).
- **Everything else is highlighted at the whole-value level.** One layer up, the schema
  `SchemaFieldContent` reads `useFieldHighlight` and, for fields **not** tagged
  `isSelfHighlightingField`, wraps the whole rendered value in a `<mark>` — the generic fallback for
  fields whose reformatting makes an inline offset wrong.

So the split is: the admin fields + `useFieldHighlight` + the `selfHighlightingField` tag are the
reusable, schema-free half; the whole-value fallback lives in the schema layer. `SearchObjectHighlight`
is defined in `@admin/utils/highlight` and re-exported through `@schema/types`.

## Rules

- **Never import `@schema`.** The admin layer is schema-agnostic: it may import `@design`,
  `@design/theme`, `@foundation` and `react-admin` — and nothing "up" the stack. Anything that reads
  a Habarico _schema_ belongs in `@schema`, one layer above.
- **Resource-aware, not schema-aware.** Components here may know about React Admin resources, records
  and CRUD, but never about a schema's fields / views / boxes. Take what you need as plain props /
  React Admin values so no schema type leaks down (see the view shells' controller props).
- **Restyle through the design layer.** Build on the `@design` primitives and the `@design/theme`
  tokens rather than styling React Admin ad-hoc, so the admin skin and custom design screens share
  one visual language. Don't hardcode design values.
- **Keep members reusable without a schema.** The bar is the
  [acceptance test](#acceptance-test-why-the-layer-is-defined-this-way): `admin + design + foundation`
  must compose a working app on their own.

The downward-only layering (`schema → admin → design → foundation`) is enforced in CI by the
`boundaries/dependencies` ESLint rule (see the repo-root `eslint.config.mjs`): an `@schema` import
from the admin layer fails `npm run lint`. That is the machine check behind the schema-agnostic
contract.
