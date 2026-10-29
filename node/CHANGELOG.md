# Changelog

## [Unreleased]

### Added

- `DashboardGridPanelLayout` gained an optional `stackedH` — the panel's height in grid rows when
  `DashboardGrid` stacks its panels into one column (container width at or below 996px). Without
  it the stacked panel keeps its `h`, so existing layouts render unchanged. (HAB-1004)
- `DashboardGrid` in `edit` mode on a narrow grid (container width at or below 996px) keeps the
  panels stacked in one column and lets each be resized in height from its bottom edge; the panels
  below move along. Panels cannot be dragged there. `onLayoutChange` reports the new height as the
  panel's `stackedH` and passes `x`/`y`/`w`/`h` back unchanged, so the wide layout is left as it
  was — a consumer that copies only `x`/`y`/`w`/`h` from it drops the change. (HAB-1004)
- Reference fields gained a `variant?: 'chip' | 'link'` prop (default `'chip'`), so a
  project can render the record a reference points at as a plain text link instead of a chip.
  `SchemaReferenceField` and `SchemaReferenceArrayField` both take it; the array form also stacks
  text links one per line (a row of bare links reads as one run-on sentence), in a detail view and
  in a datagrid cell alike, while the chip form keeps its wrapping row. The representation behind
  both forms, `RecordRepresentation` (and its schema-aware `SchemaRecordRepresentation`), is
  exported for direct use as `children` of `ReferenceField` / `ReferenceArrayField`. The default is
  unchanged, so existing projects look and behave exactly as before. `SchemaReferenceArrayField` is
  now exported from the package, which it was not. Chosen by the application through a
  `fieldProvider` override — the schema is untouched, and neither the contract nor the Python/Ruby
  DSL changes.
  (HAB-973)

### Changed

- **BREAKING:** `Panel`'s resize affordance is switched on by `resizable?: boolean` (default
  `false`) and placed by `resizeHandle?: 'corner' | 'bottom'` (default `'corner'`): `bottom` draws
  it in the middle of the bottom edge, for a panel resized in height only. `resizeHandle` is no
  longer a boolean — replace `resizeHandle` with `resizable`. (HAB-1004)
- `DashboardGrid` stacks its panels on a narrow grid in the reading order of the 12-column layout
  — top to bottom, then left to right — instead of in the order of the `panels` array. A panel
  placed at the top of the dashboard is now at the top of the stack too. (HAB-1004)
- **BREAKING:** the `upload-images` action is renamed to `upload-files` — it bulk-uploads documents
  (PDF, DOCX, XLSX, ZIP, …) as much as images, and the name said otherwise. No alias keeps the old
  names:
  - the `ActionType` value `'upload-images'` → `'upload-files'` and the `ActionSchema` slot
    `uploadImages` → `uploadFiles`;
  - the type `UploadImagesActionParameters` → `UploadFilesActionParameters`, its field
    `imageField` → `fileField`;
  - the button `SchemaUploadImagesButton` → `SchemaUploadFilesButton`, its prop `uploadImages` →
    `uploadFiles`;
  - the translation namespace `ra.upload_images.*` → `ra.upload_files.*`, in every locale. It is
    shared by `UploadInput` and `useUploadAreaLabels`, so an application overriding these strings
    must rename them even when it does not use the action. The renamed keys:
    `dialog_title`, `select_files`, `remove_all_tooltip`, `remove_all`, `upload_success`,
    `upload_error`, `uploading`, `processing`, `upload_count`, `drop_files`, `click_to_upload`,
    `or_drag_and_drop`, `upload_complete`, `upload_failed`, `file_too_large`, `file_too_large_max`,
    `file_type_not_allowed`, `image_processing_failed`, `unresolved_errors`,
    `files_remaining_hint` and `try_again`. An override left under the old key is ignored without
    an error: the built-in text shows instead.

  The dialog title, the "remove all" tooltip, the success message and the generic upload error
  speak of files instead of photos in every locale, and the button's default icon, shown when the
  action carries no `icon`, is `UploadFile` instead of `AddPhotoAlternate` (`IconType` gained
  `UploadFile`). The default `accept` still admits images only (`.png`, `.jpg`, `.jpeg`, `.bmp`,
  `.gif`); an action uploading documents must set `accept`, in its parameters or on the options of
  its `fileField`. The action works only with a backend that
  sends `upload-files` (HAB-993) — against an older one, which sends `upload-images`, the button is
  not rendered and no error is reported; upgrade the backend and the frontend together. To migrate,
  rename `uploadImages` / `imageField` and the `ra.upload_images.*` overrides, and a custom
  `buttonProvider` matching `'upload-images'`. (HAB-1000)
- **BREAKING:** `RecordRepresentationChip` and `RecordRepresentationLink` are unified into a single
  `RecordRepresentation`, whose new `variant?: 'chip' | 'link'` prop (default `'chip'`) chooses the
  shape — the same vocabulary the reference fields' own `variant` already uses, now carried
  unchanged all the way down. `SchemaRecordRepresentationChip` and `SchemaRecordRepresentationLink`
  collapse into `SchemaRecordRepresentation` the same way. The MUI chip variant moves from
  `variant` to **`chipVariant`**, which `variant` is now spent on; `size`, `color` and `icon` are
  unchanged. Props are discriminated by `variant`, so the chip's look on `variant="link"` is a type
  error rather than a prop that silently does nothing — `RecordRepresentationChipProps` /
  `RecordRepresentationLinkProps` (and their `Schema` counterparts) name the two branches for a
  component that only ever renders one of them, and `RecordRepresentationProps` is their union.
  To migrate: rename the component, rename a `variant` meant for the chip to `chipVariant`, and add
  `variant="link"` where the link form was used. Rendering and behaviour are unchanged. (HAB-973)
- **BREAKING:** `BooleanField`'s `chipVariant` prop is renamed to **`variant`**, so the whole field
  family names the MUI chip variant the same way. Its values (`'text' | 'filled' | 'outlined' |
  'soft'`) and the `'soft'` default are unchanged; rename the prop at the call site. (HAB-973)

### Fixed

- Every input draws its border in the theme's `palette.divider`. The date, date-time and time
  pickers used MUI X's own grey (and a different one when disabled); `InputLayout`
  (`UploadInput`, `TreeArrayInput`), `SchemaWrappedFields` and `SchemaRangeInput` each used a grey of
  their own. The pickers take the color and the field tint from new `MuiPickersOutlinedInput` and
  `MuiPickersInputBase` theme overrides. (HAB-1018)
- A click on a menu group (an item with sub-items) navigated to its first child and only then
  expanded it. The group now opens or closes its sub-menu in place, and the page changes only once a
  child is clicked; it is rendered as a button with `aria-expanded` rather than a link. A group
  holding the current page still starts open and reopens whenever navigation leads into it. In the
  collapsed rail a click opens the group's sub-menu at once, as hovering does, so it works on touch
  screens too. The mobile drawer stays open while a group is expanded. (HAB-996)
- The bottom-edge resize handle of a stacked `DashboardGrid` panel (edit mode at a container width
  of 996px or less) is easy to hit with a finger: its hit area is a 96×44px target spanning the
  panel's bottom edge and the gap below it, and dragging it resizes the panel instead of scrolling
  the page. (HAB-1004)
- A file row of `UploadInput` and of the `upload-files` dialog shows an uploaded document (PDF,
  DOCX, ZIP, …) as its file-type tile instead of a broken-image thumbnail. Only a file whose name
  has an image extension a browser can render (PNG, JPG, GIF, WebP, AVIF, SVG, BMP, ICO) gets a
  thumbnail. (HAB-1000)
- The datagrid's row hint no longer stacks on top of a control that owns its own click. Hovering a
  reference chip in a cell used to show two tooltips at once — the chip's "Show object" and the
  row's "double-click for detail" — and the row's one promised the wrong action, since the click
  about to happen was the chip's. `useDatagridRowTooltip` now treats a target inside
  `a[href]`, `button` or `[role="button"]` the way it already treats the row-actions cell, which
  also covers URL and e-mail fields and any control a project puts in a cell of its own. Decided
  there rather than by having each control stop the event: a swallowed `mouseover` never reaches
  the row, so a hint already on screen would stay. `RecordRepresentationLink` gained the button
  semantics it was missing (`role`, `tabIndex`, Enter / Space) so the text representation is both
  keyboard-operable and recognised by that test.
  (HAB-973)
- `ReferenceField` and `ReferenceArrayField` now merge a caller's `sx` with their own link reset
  instead of dropping it. The reset sat before the `{...rest}` spread, so any caller passing `sx`
  replaced it outright and got React Admin's anchor styling back on a field that only looked linked.
  (HAB-973)

## [7.2.0] — 2026-10-19

### Changed

- **BREAKING:** the package is renamed from `@eluvia/habarico` to `habarico` and published to
  npmjs.com, betas under the `beta` dist-tag. Replace the dependency with `habarico` and every
  `from '@eluvia/habarico'` import with `from 'habarico'`; no `.npmrc` entry or `GITLAB_TOKEN` is
  needed to install it.

## [7.1.0] — 2026-10-12

### Added

- `SchemaAdmin` and `BaseAdmin` gained an optional `alwaysEnableSaveButton?: boolean` prop (default
  `false`). `true` keeps `SaveButton` enabled on every form of the admin even when nothing has been
  changed, so a record can be saved as it is; it is still disabled while saving or uploading. The
  value travels in the new optional `alwaysEnableSaveButton` field of `AdminConfig`, so a
  hand-assembled `AdminConfigProvider` keeps working unchanged.

## [7.0.0] — 2026-10-10

### Added

- `ResetFiltersDatagridButton` — resets just the list filters to `filterDefaultValues`, leaving
  sort and column settings alone. `DatagridActions` lists it in the `⋮` menu right above "Reset
  sorting" whenever the list has filters — in the drawer or only inline in the toolbar — and shows
  it in the filter drawer's footer in place of "Reset table settings", which stays in the `⋮` menu.
  `ListConfig` gained an optional `hasInlineFilters` key for the inline case; `ListShell` defaults
  it to whether its `filters` prop is passed. New translation key `ra.action.reset_datagrid_filters`
  in every bundled locale. (VD-2875)

- `SchemaAdmin` gained an optional `rowTooltip?: boolean` prop (default `true`). `false` hides the
  gesture tooltip ("Double-click: Show") on list rows across the whole admin, while clicking and
  double-clicking a row still open it. The value reaches `SchemaDatagrid` through the new optional
  `rowTooltip` field of `SchemaRootContext`, so a hand-assembled `SchemaRootContextProvider` keeps
  working unchanged. (VD-2853)
- `AdminHashRouter` — the hash router of an admin the application renders outside a router of its
  own, created once for the lifetime of the admin. Wrap a hand-assembled `<AdminContext>` in it
  (see the "SchemaRootContextProvider" page); React Admin's own router is created again on every
  render of `<AdminContext>` and loses a redirect issued after one. Inside the application's router
  it renders its children unchanged; when it provides the router, pass it the `basename` instead
  of `<AdminContext>`. (HAB-978)
- `PanelHeader` gained an optional `status` prop — a soft tinted chip with a colored icon shown
  next to the label, with the status text revealed in a tooltip to save space. It sits in the header
  row after the help icon, uses a semantic palette color (`{label, color, icon}`) and mirrors the
  leading icon badge's shape and the `soft` `Chip` variant's tint.
  (HAB-943)
- `Panel` gained an optional `emphasized?: boolean` prop (default `false`) to single a panel out
  (e.g. a selected or active section): a 2px `primary.main` outline on the surface plus an
  `action.hover` tint on its `PanelHeader`. The outline is drawn as an *inset* box-shadow, so it
  never resizes the panel relative to its grid siblings, and layers in front of the base card shadow
  on a `root` surface. The prop is set once on `Panel`; the header reads the emphasis from
  `PanelContext`, so nested panels are unaffected.
- `PanelHeader` and `SectionHeader` gained an optional `loading?: boolean` prop (default `false`)
  to signal a background operation (e.g. a publish/update running on a detail panel). Both fade the
  affordance in/out and never shift the title, actions or body — no layout jump — but each uses the
  form that fits its anatomy: `PanelHeader` (a card with a bottom edge) overlays a slim indeterminate
  progress bar on that edge, mirroring the datagrid's loading bar; `SectionHeader` (card-less, no
  bottom edge) shows a small spinner in a reserved slot beside the title instead, so the label is
  never covered. Both use the theme's `primary` color and
  track light/dark, and `PanelHeader` works in `root` and `nested` panels with an empty or
  fully-populated header. (VD-2787)
- A row of the `listed` array box (`SchemaChoicesArrayBox`) can be ticked by clicking it anywhere,
  not only its checkbox. A click an input, a button or a link handles itself never reaches the row,
  so editing a ticked row cannot untick it; free (`otherValues`) rows have no choice to toggle and
  ignore the gesture. `FormTable` gained the `onRowClick` / `canClickRow` props this is built on.
  (HAB-879)
- `NavigationHeader` design molecule — a header row carrying a horizontal navigation strip (a `Tabs`
  or a `Stepper`) and an optional right-aligned actions slot, the navigation-strip counterpart to
  `SectionHeader`. The strip takes the available width and scrolls when it overflows; the actions stay
  pinned flush to the right. Card-less and fully flush (no surface, divider or padding of its own), so
  it drops onto a page background or into a card body alike. Used by the tab and wizard boxes. (HAB-959)
- Storybook stories for the schema-layer components that were still missing one, following the
  layer's story standard (no Controls, `layout: 'padded'`, the shared `_storyKit` context ring):
  - **`SchemaDatagrid`** — the schema-driven table behind every list view. Covers the column sources
    (method schema vs. an explicit `fields` list, plus the wrapper and action descriptors), the
    *generated* row-actions column and how to drop it, the two row-activation slots and
    `defaultRowAction`, drag-to-reorder with its `indexField` / `sortForFilters` preconditions, and
    the empty state.
  - **`SchemaArrayInput`** — the multi-value editor dispatcher: the reference branch (autocomplete
    and the `tree-relation` checkbox tree), the enum branch, and the comma-separated text fallback.
  - **`SchemaImagesBox`** — the image-collection box: the referenced-resource fetch, caption fields,
    the card-less form, `list.sortable` (drag on, pagination off) and the empty collection.
  - **`SchemaButton`** — the single-action renderer, with the button provider's dispatch matrix
    (`view` / `resource` / `link` / `save` / `export`), the three surfaces, `confirmDialog`, colour
    and label handling, and the silent drop of a `view` action whose view schema does not resolve.
  (HAB-878)

- `applyFileModifier(file, modifier)` — applies a `FileModifier` (resize / crop) to a picked `File`
  and resolves to the transformed `File`. Without a modifier the original instance comes back
  untouched and is never read, so a large non-image file is not pulled into memory. The result's
  mime type is taken from the produced Data URI rather than from the input, because
  `canvas.toDataURL()` silently falls back to `image/png` for a type it cannot encode; the
  extension follows, so the stored name cannot contradict the bytes. (HAB-754)
- `ra.upload_images.file_type_not_allowed`, `ra.upload_images.image_processing_failed`,
  `ra.upload_images.unresolved_errors` and `ra.upload_images.processing` — the two reasons a file
  can now be rejected on its own row, the field-level message that keeps the form from being saved
  while one is unresolved, and the label for a row whose work is under way. (HAB-754)
- `UploadFileItem.processing` and the matching `UploadAreaLabels.processing` — a row state for work
  that reports no percentage, so the image transform and the inline upload show a spinner and
  "Processing…" instead of a percentage bar stuck at zero. `useUploadQueue` also returns
  `busyCount`, the number of rows with work under way. (HAB-754)
- `useRemoveArrayItem` — row removal for a field array you render yourself. Wraps the `remove` of
  `useArrayInput()` / `useFieldArray()` and re-seeds the array's default values without the removed
  row, which react-hook-form does not do: paths inside an array are positional, so a row that shifts
  into a vacated index has its unset fields back-filled from whatever the record carried there, and
  saved with it. `FormArrayInput` and `SchemaChoicesArrayBox` use it; reach for it when you build a
  container of your own. (HAB-837)
- `createHttpClient` and `getSchemaFromResource` are now exported from the data provider module.
  They were closures inside `getDataProviderFactory`, so a package extending the data provider had
  to rebuild the auth-header and `Accept-Language` handling for its own endpoints and keep the copy
  in step by hand. Behaviour is unchanged — the built-in methods now call the exported helpers.
  (HAB-857)
- `useSchemaProvider` — the schema provider in context, typed for the package reading it. The
  built-in methods are always present; a type argument adds the methods a package contributes
  through `schemaProviderFactory`, and adds them as **optional**, because the application may have
  wired the built-in provider instead. It is the honest shape and it puts the assertion in one
  place instead of in every extending package:
  `const {getAggregateSchema} = useSchemaProvider<EnterpriseSchemaProvider>();`
  (HAB-857)
- `SchemaAdmin` accepts `preferencesWhitelist`, overriding which store keys are mirrored to the
  backend `user-preferences` endpoint. Defaults to the exported `PREFERENCES_WHITELIST` — spread it
  to add keys of your own instead of restating the list. The store is re-memoized on the list's
  contents rather than its identity, so an inline array literal does not drop the store on every
  render. (HAB-857)

- `useTabBox(path)`, exported from `@eluvia/habarico` — one tab box's slice of the tabs store: the
  tab it shows (`activeTab`) and how to switch it (`setTab(name)`, taking the name of a tab inside
  the box, not a full path). Using it also claims that path for as long as the box is mounted,
  which is what lets a view tell its own tabs from the ones another view left in the URL. Prefer it
  over `useTabsLocation()` for building a tabbed layout — a tab box that writes tabs without
  claiming its path has them swept away.
  (HAB-493)
- `RecordRepresentationChip` — the ambient record rendered as a chip, optionally linking to its own
  show / edit view. It lives in the admin layer and is schema-agnostic: it takes an already-resolved
  `viewType`, because deciding whether a resource *has* a show or an edit view needs a schema, and it
  hands the `UseRecordLinkProps` half of its props straight to `useRecordLink` — so a caller opting
  into an overlay (`linkMode: 'dialog' | 'panel'`) supplies the `renderContent` that fills it.
  `SchemaRecordRepresentationChip` is now a thin wrapper deriving those options from the schema
  through `useSchemaRecordLinkOptions`. **The name is reused, not restored:** this
  is not a drop-in for the `RecordRepresentationChip` that the rename below replaced — code written
  against that one wants `SchemaRecordRepresentationChip`. (HAB-843)

- A view's first box renders as a card by default on a page surface, so page content no longer
  floats on the background when the root box carries no label. Inside a dialog or a side panel the
  overlay's own surface is the card, so the first box stays card-less. `SchemaBoxProps` gained
  `isRoot` for it, passed by the show / edit / create / action view contents and forwarded to boxes
  registered through a custom `boxProvider`. The default is handed down through layout: a first box
  holding no fields of its own (a grid, a tab or wizard step, a bare wrapper) draws no card and
  passes it to its children, so the card lands on the first box that actually holds content and a
  root grid never wraps the whole detail in one card. Set `card: false` to opt out, `card: true` to
  force the surface anywhere.
- `SchemaTabBox` and `SchemaWizardBox` honour `card` and `label` instead of ignoring them: they
  evaluate the card like a grid box minus the toolbar (a label or `collapsible` turn it on and an
  explicit `card` wins both ways; `toolbarActions` do not, because the tab strip and the stepper row
  are not a card header) and render it through `BoxLayout`, with the label in the card header and
  the tab strip / stepper and the footer inside. `toolbarActions` move into that header when the box
  has a label, as on any other box, and stay in the tab strip / next to the stepper otherwise.
  `SchemaGridBox` also honours the `label` prop now instead of reading `schema.label`, so a grid
  used as a tab step no longer repeats the tab title in a card header of its own. Without a card they render
  exactly as before, and the root-box default travels on to the step.
  (HAB-827) (HAB-827)
- The Storybook is published publicly at
  [storybook.habarico.com](https://storybook.habarico.com), and the documentation pages of the
  components link to their story. Its manager UI now carries the Habarico branding — logo, brand
  colours and Montserrat — while the canvas keeps rendering components with the library's own
  light/dark theme. Each release also lands under its minor series
  (`storybook.habarico.com/<series>/`), so an archived documentation page opens the Storybook of the
  version it documents.
  (HAB-763)
- `SchemaAdmin` `search` prop — the component rendering the global search overlay's contents,
  threaded to `SchemaLayout` the same way `extraMenuItems` is. The slot is offered only when the
  backend advertises global search *and* a component is supplied; `resolveSearchSlot` holds that
  decision and is covered by tests.
  (HAB-813)
- `TabsLocationProvider`, exported from `@eluvia/habarico` — the store `useTabsLocation()` now
  reads from context. `ViewContent` mounts exactly one per view (page, dialog or side panel)
  automatically, so a tab box opened inside a dialog or side panel can never collide with a tab box
  on the page behind it, even when both use the same box name. Its `syncWithLocation` prop
  (`true` on a page, `false` inside an overlay — mirrors react-admin's `TabbedShowLayout` /
  `TabbedForm`) decides whether the store mirrors into the URL hash or stays private in-memory
  state.
- Frontend validation of schema-defined rules — `options.validators` from the backend schema (an
  array of `ValidatorRule` objects, each `{type, value, message}` with `type` one of
  `max_length`/`min_length`/`max_value`/`min_value`/`regex` and `message` optional) are mapped to
  react-admin validators and enforced in all auto-generated forms. A regex pattern that is not
  JavaScript-compatible is skipped with a console warning and left to backend validation.
  (HAB-409,
  HAB-447)
- Pluggable validator providers — the rule-to-validator mapping follows the same override pattern as
  the field/input/box providers. `defaultValidatorProvider` is the built-in mapping; pass a
  `validatorProvider` to `SchemaAdmin` to add a validator for a new rule `type` or override a
  built-in one (return `undefined` to defer to the default, `null` to suppress a rule). The
  `useSchemaValidators` hook resolves a field schema's rules through this chain, and
  `buildSchemaValidators` / the `ValidatorRule` type are exported for reuse in custom inputs.
  (HAB-447)
- `FormShell` `mode` prop — react-hook-form validation strategy of the underlying `SimpleForm`.
  (HAB-447)
- Public entry point now exports `SchemaAiAssistantButton` (with `SchemaAiAssistantButtonProps`),
  which the documentation describes but which was unreachable from `@eluvia/habarico`.
  (HAB-762)
- Seven symbols the public entry point was missing, all needed to build a field, input, datagrid or
  widget outside the package: the base prop types `FieldProps` and `InputProps`, the context hooks
  `useFieldSchemaMapContext` and `useLocalResourceSchemaContext` (whose providers were already
  public), `SchemaRootContextState` (the shape `useSchemaRootContext` returns),
  `SchemaDatagridRowActions` and `COLOR_TYPES`.
  (HAB-813)
- Chunked upload transport registry — `uploadFile` resolves the transport used for files at or above
  their `transport.threshold` through `registerChunkedUploadTransport` instead of importing one
  directly, so the S3-multipart/tus implementation can live outside the core — it is registered by
  `habarico-enterprise` when imported (see Removed). `registerChunkedUploadTransport`,
  `getChunkedUploadTransport` and the `ChunkedUploadTransport` type are exported for applications
  that want to supply their own transport. When a schema asks for a chunked upload and no transport
  is registered, the upload fails with an explanatory error rather than silently inlining a
  past-threshold file as base64.
  (HAB-813)
- `FormTable` `addDisabled` prop — disables only the "Add" affordance, leaving existing rows
  removable, for a table whose every possible row is already present. Independent of `disabled`,
  which turns the whole table off.
  (HAB-835)
- Backend-driven exports: new `export` method on `ServiceDataProvider` calling
  `GET <resource>/export/` with `format`, `fields`, `ids`, `filter` and `order_by` query
  parameters (`filter`/`order_by` use the same serialization as `getList`, newly extracted into
  the shared `serializeListFilter` / `serializeOrderBy` helpers), returning the file as a blob
  with the filename parsed from `Content-Disposition` (RFC 5987 included). `useExporter` triggers
  the backend export and downloads the returned file in the browser; `ExportButton` exports the
  selected rows (`ids`) or everything matching the current list filters and sort, with
  `format` / `fields` supplied by the export action schema via `defaultButtonProvider`. A
  `202 Accepted` response shows an info notification (`ra.notification.export_running`,
  translated in all locales) — full async-export UI is HAB-633.
  (HAB-531)

### Changed

- **BREAKING:** `TABLE_DENSITY_PADDING_Y` is renamed to `DENSITY_TABLE_PADDING_Y`, next to the other
  density coefficients; import it under the new name. The `TableDensity` type is removed — use
  `Density` (or `DataTableDensity` for the `DataTable` prop), the same union. (VD-2869)
- **The four schema-layer stories that predated the layer's story standard now follow it.**
  `BoxActions`, `SchemaChoicesArrayBox`, `SchemaImages` and `SchemaFieldContent` each built their own
  context ring inline (their own mock providers, their own half-typed `SchemaRootContextState`) and
  each drifted somewhere else: `BoxActions` on `layout: 'fullscreen'` with a `component` a
  cross-cutting concept story should not set, `SchemaChoicesArrayBox` and `SchemaImages` on
  story-local `args`/Controls, `SchemaFieldContent` on the *admin* layer's field shell. They now all
  mount through `@schema/components/_storyKit` on the shared e-shop fixtures, with
  `controls: {disable: true}` and `layout: 'padded'`. Two of them also documented a rule the code
  does not have: a collection with `indexField` set **forces** the list onto that field rather than
  waiting for it, so "dragging off because the sort differs" was unreachable — the stories now show
  the real off-switch, a `sortForFilters` mismatch. (HAB-878)
- **Each schema story now gets its own React Admin store.** `CoreAdminContext` falls back to a
  module-level `memoryStore()` **singleton** shared by every instance on the page, and
  `StoreContextProvider` empties it on both `setup()` (mount) and `teardown()` (unmount) — so on an
  autodocs page, where every story of the file mounts its own `CoreAdminContext`, each mount wiped
  what the already-mounted stories had written. The visible symptom was a `SchemaDatagrid` docs story
  rendering **no columns at all**: `DatagridConfigurable` publishes its column list to the store from
  an effect, and once that entry is wiped the grid falls back to an empty column set — which is why
  poking the grid (trying to drag a row) brought it back. `SchemaStoryProviders` now creates one
  `memoryStore()` per mount, isolating story preferences the way a real admin isolates a user's.
  A sweep of all 158 autodocs pages found no other page affected. (HAB-878)
- The schema story kit also gives each story its **own datagrid preference key** (the story id)
  instead of one shared `story.list`, and `SchemaStoryProviders` takes a `preferenceKey` override for
  the case a per-story store cannot cover: a single story mounting two *differently shaped*
  datagrids, which otherwise hand each other a stored column set built for different columns and
  resize in a loop until React bails out with "Maximum update depth exceeded" — a crash
  `RenderErrorBoundary` swallows while the story test still reports a pass. (HAB-878)

- Translation keys `ra.validation.invalid_format` and `ra.validation.czech_id_card_number` in every
  locale. The first is the fallback of a schema `regex` rule without a message (see Fixed); the
  second is the message `CzechIdCardNumberInput` from `@eluvia/habarico-enterprise` shows for a value
  that matches none of the Czech ID document formats, in place of React Admin's regexp message.
  (HAB-970)
- A schema admin can be assembled by hand around `SchemaRootContextProvider` — everything
  `SchemaAdmin` wires up is public, with a complete example on the new "SchemaRootContextProvider"
  page. `defaultViewProvider`, `SchemaLayout` and `withRaDefaults` are exported, and two new
  pieces carry the signed-in user: `usePerUserStore` holds it above `<Admin>` (bootstrapped from
  `authProvider.getIdentity()`) together with the per-user store scoped to it, creating a new store
  whenever someone else signs in, and `SchemaIdentitySync` keeps the `userIdentity` of
  `SchemaRootContext` current from inside the React Admin context across sign-ins, sign-outs and
  impersonations. (HAB-971)

- **BREAKING:** `SchemaRootContextProvider` no longer resolves the identity itself: its `value`
  takes `userIdentity` and `setUserIdentity`, which `SchemaAdmin` supplies from the identity it
  scopes the per-user store to. `SchemaAdmin` users are unaffected; a hand-assembled
  `SchemaRootContextProvider` takes both from `usePerUserStore` and renders
  `SchemaIdentitySync` inside `<AdminContext>` (see the "SchemaRootContextProvider" page). (HAB-971)
- **A tab's change/error status now shows as a dot only — the label text keeps its normal colour.**
  `FormStatusLabel` previously tinted the tab label yellow (unsaved changes) or red (validation
  errors) alongside the status dot; the text colour no longer changes, so only the coloured dot
  signals the status. A tab that is both dirty and invalid still shows the red (error) dot — errors
  take priority. (HAB-967)
- **The inline (`inline: true`) array box now wears the shared datagrid skin.** Its read-only table
  used a bespoke, minimal style (grey header + a plain background swap on hover); it now renders the
  same `StyledDatagrid` core as the list datagrid, so it gets the design-system row highlight (a
  primary tint plus a 4px accent stripe on hover) and matches `AdminDatagrid` / the design `DataGrid`
  and `DataTable`. Extracted `StyledDatagrid` (a restyled React Admin `Datagrid` with a pluggable
  `body`) out of `AdminDatagrid` as the presentational core the two now share; `AdminDatagrid` keeps
  the resource-aware wiring (preferences, row-click navigation, drag-and-drop, resizable columns).
  (HAB-937)
- **The default Cancel (detail switch) in an overlay edit view is now `outlined`.** In a dialog the
  header Cancel button was `contained`, reading like a second primary action next to the footer Save;
  it now renders `outlined` on every button surface (dialog and page alike), so the fill stays with
  the primary Save. The narrow panel header keeps its icon button (variant does not apply). (HAB-959)
- **A card-less tab box renders its toolbar actions flush to the right.** The tab strip now uses the
  new `NavigationHeader` design molecule instead of an ad-hoc flex row: the toolbar sits in the
  strip's own header pinned to the right edge (the stray right padding is gone). A tab box with a
  `label` is unchanged — its toolbar lands in the card header. The buttons are `small` either way,
  consistent with every box header. (HAB-959)
- **A card-less wizard box renders its toolbar actions the same way.** Its stepper row now uses the
  `NavigationHeader` design molecule too, so `toolbar_actions` sit in the stepper's own header pinned
  flush to the right when the box is card-less, and move to the card header when it has a `label` —
  matching the tab box, `small` buttons either way. The Prev/Next navigation and `bottom_actions` are
  unchanged (footer below the steps). (HAB-959)

- **`lodash` replaced with `lodash-es`.** Every import now names the functions it uses
  (`import {get, merge} from 'lodash-es'`) instead of pulling the whole library in through the `_`
  default import, so rollup tree-shakes what the library does not touch. Both bundles are about
  614 kB smaller (`lib/index.cjs` 4 470 kB → 3 856 kB, `lib/index.esm.js` 4 396 kB → 3 782 kB) and
  nothing changes for consumers: `lodash-es` is bundled in, not externalized, so the CJS build is
  still plain CommonJS. `templateToStr` and `DynamicText` renamed their local option flags to
  `shouldTrim` / `shouldTruncate` / `shouldUpperFirst`, because the old names shadowed the
  functions they gate; the `options` keys themselves are unchanged.
  (HAB-949)
- **A list box in a hidden tab no longer fetches.** `SchemaListBox` is the most expensive box
  there is — its own resource-schema request, then a list request, then a datagrid — and a tab box
  in edit mode mounts every tab, so on a resource with several list boxes most of them paid all of
  that while sitting behind `display: none`. It now reads the `isHidden` that `ParentBoxContext`
  already carries down (a tab box sets it for every tab but the active one) and keeps its body —
  and with it the schema request — unmounted until the box is actually on screen; it is sticky from
  then on, so switching away does not unmount the list and refetch it on the way back. The
  stickiness is `useWasBoxEverVisible()` (`@schema/contexts/ParentBoxContext`), reusable by any box
  that can sit in a hidden tab. `useGetLocalResourceSchema` also gained the `enabled?: boolean`
  option (default `true`) for a caller that has to hold a schema request back without unmounting —
  the query keeps its key either way, so a schema already in the cache is still returned
  immediately.

- **A tab box in edit mode mounts its active tab first and the rest right after.** Read mode
  renders only the active tab; edit mode has to mount them all, because a field that is not mounted
  is not registered with react-hook-form and would not be submitted — so the inactive ones are
  hidden with `display: none`. On a resource with many tabs that made the read → edit switch pay
  for the whole form in one synchronous commit. The inactive tabs are now let in on a
  `startTransition` right after the first commit, so the switch paints immediately and they fill in
  behind it. They still all end up mounted and registered, only a frame later; nothing about the
  rendered output changes. A passive effect drives it rather than `requestAnimationFrame`, so it
  also runs in a backgrounded tab.

- **Render cost of a schema form cut where it was paid per field.** Large edit forms (a resource
  with tens of fields across several tabs) spent measurable time rebuilding objects that never
  changed between renders. Four allocations were hoisted or memoized, none of which changes what is
  rendered:
  - `PropertyList` built its context value fresh on every render, so every `PropertyItem` in the
    list re-rendered (and rebuilt its own layout `sx`) whenever any ancestor re-rendered. It is now
    memoized on the resolved values.
  - `PropertyItem` rebuilt its layout `sx` — for `orientation="auto"` a nested object embedding a
    whole container-query block — and its root `sx` on every render; both are now memoized on what
    they derive from. The five `sx` objects that never vary with props (label cell, value cell,
    label/value typography, help icon) moved to module scope.
  - `SchemaInput` constructed the `DynamicText` label element and immediately threw it away in bare
    mode, once per field per render — and every schema form field is bare, because the surrounding
    `PropertyItem` owns the label. It is now built only when it is used.
  - `SchemaAdmin` passed a freshly built theme to `AdminContext` on every render. React Admin's
    `ThemeProvider` keys its `createTheme()` cache on the theme object's identity, so this
    re-created the MUI theme and re-rendered everything below it. Both themes are now memoized on
    the incoming props. An application passing its theme inline
    (`lightTheme={createLightTheme()}`) still defeats this and should memoize at the call site.

- Toolbar actions of a view shown in a dialog now render as `small` buttons instead of `medium`,
  matching the compact dialog title bar (`SchemaViewToolbarActions`). Page and panel presentations
  are unchanged. (HAB-956)
- An edit view shown in a dialog or side panel with no toolbar actions of its own now gets a default
  "Cancel" action in its header that switches back to the record's detail view (when the resource has
  one), matching the page edit view's fallback. Unlike the page, the overlay header gets **only** the
  detail switch — the primary Save already lives in the dialog/panel footer, so it is not duplicated
  in the header (`EditToolbarActions`).
  (HAB-956)
- The Storybook manager UI (`.storybook/manager.ts`, `manager-head.html`) now uses "DM Sans
  Variable" — the library's own primary font (`src/design/theme/core/typography.ts`) — instead of
  Montserrat, and the sidebar brand logo (`.storybook/brand/logo.svg`) is now filled in habarico's
  actual product green (`#01CDB1`, the default `HabaricoLogo` color) instead of navy, and its left
  edge now lines up with the search field and story tree below it instead of sitting a few pixels
  further left. Previously the chrome around a story clashed with the design system it documents.
  (HAB-877)

- List box **default (auto-generated) actions are now scoped by `is_detail`**: when `list.list_actions`
  is not set, the datagrid toolbar falls back only to the reference's **collection** actions
  (`show_in_list && !is_detail`, e.g. create/export/bulk), and the per-row buttons fall back only to its
  **record** actions (`show_in_list && is_detail`, e.g. detail/edit/delete). Previously both used the
  same `show_in_list` set, so record actions leaked into the list toolbar. The **images box** now
  scopes its per-image buttons the same way — they too fall back only to record actions, so a
  collection action like create no longer leaks onto individual images. Explicitly listed actions are
  unaffected. `is_detail` is the record-vs-collection discriminator (URL with/without a pk). The
  `generateDescriptorsFromSchema` helper's third argument changed from `onlyDetail: boolean` to
  `scope: 'detail' | 'list' | 'all'`, and `SchemaButtons`' `onlyDetail` prop is now `scope`.
- The **images box list-actions toolbar** (`SchemaImagesBoxActions`) now renders its buttons as
  `size="small"`, `variant="outlined"` (with the filter button matched to `small`), the same compact
  look as the datagrid list box's list-actions toolbar — replacing the previous `medium`/`contained`
  buttons. Button color still follows each action's schema `color` (defaulting to `inherit`).
- The **images box per-image row actions** now render as dense `surface="iconButton"`, `size="small"`
  buttons, matching the datagrid's per-row actions, instead of the previous default-size buttons.
- The **images box list-actions toolbar is now hidden entirely when empty** — with no filters and no
  list actions (e.g. `list.list_actions: []`), `SchemaImagesBoxActions` renders nothing instead of an
  empty `TopToolbar` taking up space above the image grid.
- An **empty `list.list_actions` (`[]`) now suppresses** the datagrid toolbar actions instead of
  triggering the default fallback; only an absent/`undefined` value falls back (aligning it with
  `row_actions`, where `[]` already meant "none").
- Box **toolbar actions** (`box.toolbar_actions` and `list.toolbar_actions`) now render as
  `size="small"`, `variant="contained"` buttons across every box type (simple, list, gallery/images,
  wizard, array, grid, tab and object), for a consistent header-toolbar look. Footer
  (`bottom_actions`), the datagrid list-actions toolbar and per-row actions are unchanged.
- `snakeCaseToCamelCase` converts a key only when it is plain `snake_case` — words of letters and
  digits joined by single underscores. Any other key is not a valid name of the schema contract and
  now passes through exactly as it arrived, rather than being rewritten into one neither side
  recognizes: a run of two or more underscores (the lookup `created_at__gte`), a leading or trailing
  one (`_target`). The previous conversion collapsed such runs, because its regex counted an
  underscore as a word character, silently turning `created_at__gte` into `createdAt_gte`. Of the
  390 property names in `contract/openapi.yaml` only the aggregate bucket key `category__name`
  converts differently, and it now survives intact.
  (HAB-921)
- `AuthPage` no longer switches between the login, forgotten-password and register screens with a
  MUI `Slide`. All three screens were mounted at once and slid horizontally, so the card flickered
  and jumped in height as two differently sized screens briefly co-existed. Only the active screen
  is rendered now, wrapped in a keyed `Fade`, so it fades in cleanly without resizing mid-transition
  (the horizontal-scroll wrapper that `Slide` needed is gone too).
  (HAB-883)
- The auth form layouts (`AuthPage`'s login / forgotten-password / MFA steps and
  `ResetPasswordPage`) now share one spacing convention matching the design system's auth blueprint:
  inputs render with `margin="none"` and explicit bottom spacing, right-aligned within a
  full-width column, replacing the per-form mix of `gap`, default input margins and ad-hoc
  margin hacks. (HAB-883)
- **BREAKING:** the account dialog slots now take the **whole dialog**, not just its form, and
  `BaseAdmin`'s slots are renamed to match `SchemaAdmin` (its source of truth): `updateIdentity` /
  `changePassword` (`ReactNode | false`) become `UpdateIdentityComponent` / `ChangePasswordComponent`
  (`FC | false`), the same names and shape `SchemaAdmin` already uses. Both entry points render the
  component through the account menu with `open` / `onClose` injected; the default
  `UpdateIdentityDialog` / `ChangePasswordDialog` now own their `CustomDialog`, header and footer
  Save button and close themselves on a successful submit. Previously the slot was only the dialog's
  content (a form receiving `onSuccess`) and the dialog chrome was supplied by the library. A custom
  override must now render its own `CustomDialog` and call `onClose`.
  (HAB-883)
- `AvatarField`'s hover UI is reworked: instead of a single frosted "remove" band (whose
  `backdrop-filter` also smeared the round border, notably inside the MUI `Dialog`), hovering a
  filled avatar now blurs the image directly (a plain `filter`, clipped by the circle) under a scrim
  with two explicit `IconButton`s — change and remove — so the two actions are finally distinct. Adds
  a `ChangeIcon` prop; the default glyphs are `AddAPhoto` (empty / change) and `NoPhotography`
  (remove). (HAB-883)
- The update-identity and change-password dialogs now show a subtitle (new
  `ra.auth.update_identity_subtitle` / `ra.auth.change_password_subtitle` keys, translated in every
  bundled locale). (HAB-883)

- `ChangePasswordDialog` and `UpdateIdentityDialog` are now built on `CustomDialog` /
  `CustomDialogTitle` instead of a bare MUI `Dialog` with a hand-rolled close `IconButton`, and
  render an actual `DialogActions` footer with the Save button in it instead of stacking it inline
  at the end of the form fields. Both dialogs are now `fullWidth`. (Their slot contract also changed
  — see the breaking entry above.)
  `UnsavedChangesDialog` and `DraftRestoreDialog` are rebuilt on the design system's `ConfirmDialog`
  rather than reimplementing the same confirm/cancel dialog shape by hand (no prop changes on those
  two). (HAB-883)
- **BREAKING:** `RecordRepresentationChip` is renamed to `SchemaRecordRepresentationChip` (and
  `RecordRepresentationChipProps` to `SchemaRecordRepresentationChipProps`), matching the `Schema`
  prefix used by every other component in `fields/` that depends on schema context — it resolves
  the record's link through `useSchemaRecordLink`, which reads `hasShowView`/`hasEditView` from the
  schema, so it was never schema-agnostic like `ReferenceField`/`ReferenceArrayField`, whose prefix
  it wrongly matched. Applications importing it directly update the import and JSX tag name; no
  behavior changes. Note that `RecordRepresentationChip` exists again under Added above, as the
  schema-agnostic admin-layer chip — a different component, not this one.
  (HAB-856)
- **BREAKING:** `linkMode` on `ReferenceField`, `ReferenceArrayField`,
  `SchemaRecordRepresentationChip` and `SchemaRecordLink` is typed `ViewPresentation`
  (`'page' | 'dialog' | 'panel'`) instead of the backend contract's `ViewModeType`
  (`'redirect' | 'dialog' | 'sidepanel'`). The two are the same concept under wire-level and
  admin-level names, and the translation now happens where the wire value is actually read:
  `SchemaResourceReferenceField` and `SchemaResourceReferenceArrayField` map
  `options.relation.linkMode` through the newly exported `viewModeToPresentation`, so the
  record-link chain below them carries no schema type at all. The schema-driven path is unchanged —
  the backend still sends `sidepanel` and resources behave exactly as before; `RelationFieldOptions`
  and the view-action `mode` keep speaking `ViewModeType`, because those *are* the wire contract.
  Applications that pass `linkMode` by hand swap `'redirect'` for `'page'` and `'sidepanel'` for
  `'panel'`. (HAB-843)
- **BREAKING:** `useSchemaRecordLink` is replaced by `useSchemaRecordLinkOptions`, which takes only
  `link` and returns only the `useRecordLink` options a schema can supply — a `viewType` resolved
  against the resource's schema, plus the schema's view router as the overlay renderer — rather
  than the resolved `{handleClick, dialog}`. The rename is the point: the chip it feeds, the
  admin-layer `RecordRepresentationChip`, calls `useRecordLink` on those options itself, so this
  hook must stop at the options, and a name promising a link would misdescribe it.
  `keepLinkedParent`, `linkMode` and `dialogWidth` are the caller's own and go to `useRecordLink`
  directly instead of being passed through unchanged. Callers that had the link resolved for them
  compose the two:
  `useRecordLink({...useSchemaRecordLinkOptions({link}), keepLinkedParent, linkMode, dialogWidth})`. (HAB-843)
- **BREAKING:** `ReferenceField` and `ReferenceArrayField` moved from the schema layer to the admin
  layer, and their `link` / `keepLinkedParent` / `linkMode` / `dialogWidth` props are replaced by a
  single `recordLinkProps` — the `useRecordLink` options handed to the default chip. Neither ever
  read a schema; they sat in `@schema` only because their default child did, and
  `boundaries/dependencies` now confirms that is no longer true. Both keep their names, and the
  root barrel is flat, so `import {ReferenceField} from '@eluvia/habarico'` still resolves — to the
  same component in a new home. A schema-aware chip has to arrive as `children` rather than through
  `recordLinkProps`, because the resource and record contexts it reads are the *referenced* ones and
  exist only inside the field:
  `<ReferenceField reference="owners" source="owner_id"><SchemaRecordRepresentationChip link /></ReferenceField>`.
  React Admin's own `link` prop is dropped from the type instead of being accepted and ignored, and
  the link-styling reset the two fields and `SchemaRecordLink` each carried their own copy of is now
  one exported `recordLinkSx` / `recordLinkResetSx`. (HAB-843)
- **BREAKING:** the `Resource` in `SchemaResourceReferenceField`, `SchemaResourceReferenceArrayField`,
  `SchemaResourceReferenceInput` and `SchemaResourceReferenceArrayInput` is dropped — they are
  `SchemaReferenceField`, `SchemaReferenceArrayField`, `SchemaReferenceInput` and
  `SchemaReferenceArrayInput` (their `…Props` types follow). The qualifier only ever existed to
  keep them apart from the `ReferenceField` / `ReferenceArrayField` that used to sit in the schema
  layer; those moved to `@admin` in the entry above, so the plain names are free and the longer
  ones say nothing. It also settles an inconsistency that was already there — their siblings
  `SchemaReferenceFieldContent` and `SchemaTreeReferenceArrayField` never carried `Resource`.
  Applications update the import and the JSX tag name; no behaviour changes. (HAB-843)
- **A `small` button is now 28px tall instead of 30**, matching the height MUI's `small`
  `IconButton` already renders at — so a small button and a small icon button finally line up in
  the same toolbar — and the line a read `PropertyItem` row reserves. Its vertical padding is
  zeroed, which is what keeps the label inside that height. `medium` (36)
  and `large` (48) are untouched. (HAB-856)

- **A field action button now renders at the in-row size (`small`, 28px), instead of a default
  `medium` 36px.** Inline is where these buttons live — a datagrid cell or a detail `PropertyItem`
  row — and 36 was taller than everything around it, so the button was growing the row rather than
  sitting in it. Applications with field actions will see those buttons shrink; toolbar and
  bottom-bar actions are untouched. (HAB-856)

- Schema-computed breadcrumb trails now collapse the same way the data-driven ones do: past two
  crumbs the middle ones fold behind a `…` whose popover lists them (a router link each when it has
  a path). The portal trail could not do this before — `PortalBreadcrumbsOutlet` is a bare `<ol>`
  the crumbs are portalled into as an opaque, recursive JSX tree — so `BreadcrumbsPortal` now wraps
  it in a collapse controller: each `PortalBreadcrumbItem` registers its content, their order is
  read from the outlet's DOM, and the middle crumbs render `display: none` while an extra `…` crumb
  is appended. Matches `DataBreadcrumbs`; no API change. (HAB-781)
- **BREAKING:** `UploadFileOptions.fileModifier` is gone, and `uploadFile` no longer applies a
  resize/crop. The transform belongs to storing the file into the field, not to the transport that
  ships it — see the fix above. Applications that drove `uploadFile` directly with a `fileModifier`
  call `applyFileModifier` on the file first and pass the result. (HAB-754)
- `maxFileSize` and `accept` are enforced by the upload queue rather than by `UploadArea` as the
  file is picked, and they are checked around the modifier rather than before it. `accept` runs
  twice: once on the file as picked, so a file of the wrong kind is named as such instead of being
  pushed through a canvas that cannot decode it, and again on the transformed file, whose mime type
  and extension the transform may have changed. `maxFileSize` runs only afterwards, since the
  modifier is what decides the final size — an 8 MB photo stored at 40 kB is no longer rejected by
  a 5 MB cap. Two consequences: a rejected file is reported on its own row with a message instead
  of silently vanishing from the drop, and it occupies one of the `maxFiles` slots until it is
  removed. `UploadArea` still takes both props — they feed the drop-zone hint and the picker's
  `accept` attribute — and still caps the list with `maxFiles`. (HAB-754)
- The image transform and the inline upload no longer pass unnoticed. Both left the row at
  `progress: null`, which rendered no status at all and — because `UploadingContext` counted only
  rows carrying a progress value — left `SaveButton` enabled throughout, so a record could be
  saved while the file the user had just dropped was still being read and re-encoded. Both now
  mark the row `processing`, which shows a spinner and counts towards `busyCount`. (HAB-754)
- `UploadInput` keeps the field invalid while a row is showing an error, so the form can no longer
  be saved as though the file had never been picked. A rejected file never reaches the form value -
  it is simply not stored - so nothing else would have stopped the submit. The message is
  `ra.upload_images.unresolved_errors`; clearing the row (remove or a successful retry) clears the
  error. (HAB-754)
- `SaveButton` validates the form when it is clicked instead of leaving submission to whatever
  `formState` happens to hold. `form.trigger()` recomputes every field against the current values:
  an invalid form is stopped and reported with `ra.message.invalid_form`, while an error that has
  outlived its cause no longer blocks anything. That covers the two cases a `formState`-gated
  button gets wrong — a cross-field rule whose *other* field has since been corrected, and a
  `type: 'server'` error left over from a previous submission, both of which used to leave the form
  unsubmittable. The button's disabled state is unchanged: it still reflects only in-flight work
  (`saving`, an upload in progress, a pristine form), never validity, so a retry is always
  possible. (HAB-754)
- Retrying an entry starts over from the file as picked — transform, checks, then upload — instead
  of resuming at the upload with whatever the entry currently holds. An entry is usually sitting on
  an error precisely *because* it failed a check or failed to transform, and resuming would upload
  the very file that was rejected: a `.docx` refused for its type went through on the second click,
  and a photo whose resize failed was uploaded at full resolution. A retry now costs one more
  canvas pass, which is the cheaper half of the trade. (HAB-754)
- `useFileModifier` returns no modifier for a non-image file, whatever `resizeWidth` and
  `cropAspectRatio` say. Resize and crop are canvas operations with nothing to do on a document, so
  a `.docx` dropped on an image field is now rejected for its type instead of failing to decode. (HAB-754)

- **BREAKING:** `SchemaAdmin`'s `schemaProvider` prop is replaced by `schemaProviderFactory`,
  which takes the same shape as `dataProviderFactory` — `(getAuthHeaders) => SchemaProvider`,
  passed unbound, because the auth headers come off the auth provider. It defaults to the built-in
  `getSchemaProvider`, so an application that used it can drop the prop entirely; one that built
  the provider itself passes the factory instead of the instance. A package extending the library
  supplies its own: `habarico-enterprise` returns the built-in provider plus the aggregate schema
  endpoint. There is one schema provider, not a base and an extension.
  (HAB-857)
- `SchemaAdmin`'s `dataProviderFactory` prop is now optional and defaults to the built-in
  `getDataProviderFactory`. It was required, yet the built-in factory is what every application
  passed — it speaks the Habarico REST contract, which is the contract `SchemaAdmin` already
  assumes everywhere else. Supply your own only for a backend that does not.
  (HAB-857)

- Whether a surface is a card is declared by that surface instead of derived from the view's
  presentation: `ViewDialog` and `ViewSidePanel` set `InsidePanelContext` themselves (`Panel`
  already did) and `ResetBoxProvider` no longer overwrites it. A view routed with a page
  presentation while sitting inside a card - a dashboard widget, or any embedded composition mounted
  without a `ViewPresentationProvider`, where the presentation falls back to `page` - keeps the
  enclosing surface, so its boxes render `nested` and its first box draws no card inside that card.
  (HAB-827)
- `BoxSchema.card` is three-state (`boolean | null`) and an explicit value now wins over every
  implicit signal: `card: false` keeps a box card-less even when it has a label or toolbar actions,
  rendering the label in the card-less `Section` header instead of a `Panel`. Unset (`null` or
  absent) keeps today's behaviour - a label, `toolbarActions` or `collapsible` turns the card on.
  Resolved by the new `useBoxCard` hook, exported next to `useBoxLayout`. (HAB-827)
- Declared license changed from `ISC` to `MIT`, matching the Ruby gem and the MIT-licensed
  `react-admin` dependency; a `LICENSE` file was added.
  (HAB-842)

- **BREAKING:** `useTabsLocation()` must now be called under a `TabsLocationProvider` ancestor
  (mounted automatically by `ViewContent`, so every page, `ViewDialog` and `ViewSidePanel` needs no
  changes). A custom tabbed layout built outside `ViewContent` needs to wrap itself in one
  explicitly, passing `syncWithLocation`, or the hook throws. `hasLiveTab` is removed from the
  hook's return value — it existed only to re-check a possibly-stale `window.location.hash` read
  against a race in the old `useLocation()`-derived implementation; the new store-backed
  implementation reads are always synchronous, so the race (and the workaround) no longer applies.
  A caller using it can just check `getActiveTab(value) !== undefined` instead.

- **Forms now validate on blur** (`mode="onBlur"`) instead of only on submit. Validation errors
  appear next to a field as soon as it loses focus. To restore the previous behavior for a specific
  form, pass `<FormShell mode="onSubmit">`.
  (HAB-447)

- **BREAKING:** The record-link mechanics moved to a new, schema-agnostic `useRecordLink` in the
  admin layer: it takes an already-resolved `viewType?: 'show' | 'edit'`, a `linkMode?:
  ViewPresentation` (`'page' | 'dialog' | 'panel'` — the same type `useViewPresentation` returns, so
  "which surface to open the target in" and "which surface am I currently in" share one vocabulary),
  plus optional `changeView`, `openSidePanel` and `renderContent` callbacks for in-place navigation,
  side-panel docking and the dialog fallback, instead of resolving a resource's `show`/`edit` views
  itself. The previous schema-aware hook (which read `link: boolean | 'show' | 'edit'` and wired in
  `SchemaViewRouter`) is now `useSchemaRecordLink`, exported from `@eluvia/habarico` in place of the
  old `useRecordLink`; it still takes the backend's `linkMode?: ViewModeType`
  (`'redirect'|'dialog'|'sidepanel'`) and translates it to `ViewPresentation` internally.
  `SchemaRecordLink` (formerly `RecordLink`) and `RecordRepresentationChip` keep their public
  `link`/`linkMode` props unchanged; direct consumers of the old `useRecordLink` should switch to
  `useSchemaRecordLink` for the same behavior, or to the new `useRecordLink` if they need the
  schema-agnostic version with a custom `changeView`/`openSidePanel`/`renderContent`.
  `useRecordLink` throws if `linkMode` is `"dialog"` or `"panel"` but no `renderContent` is
  supplied — a caller misconfiguration, not a runtime state.
  (HAB-788)

- **BREAKING:** `RecordLink` → `SchemaRecordLink`. The component is schema-driven — it resolves a
  resource's `show`/`edit` views from the schema through `useSchemaRecordLink` — so it now carries
  the `Schema` prefix like the hook it wraps, leaving the bare name free for the schema-agnostic
  variant built on `useRecordLink`. `RecordLinkProps` → `SchemaRecordLinkProps`. Consumers importing
  either symbol from `@eluvia/habarico` must rename their import; props and behaviour are unchanged.
  (HAB-788)

- **BREAKING:** `ViewPresentationState.isInDialog` (returned by `useViewPresentation`) is removed —
  it was always exactly `presentation !== 'page'` (true for both `'dialog'` and `'panel'`, the two
  overlay surfaces), tracked as a separate field in two places with nothing to keep them in sync.
  Consumers reading `isInDialog` should derive it locally: `presentation !== 'page'`.
  (HAB-788)

- **BREAKING:** The auth provider no longer carries a vendor name: `useEluviaAuthProvider` →
  `useServiceAuthProvider`, `buildEluviaAuthProvider` → `buildServiceAuthProvider`. The name now
  matches the `ServiceAuthProvider` type it returns. Consumers importing either symbol from
  `@eluvia/habarico` must rename their import; behaviour is unchanged.
  (HAB-806)

- **BREAKING:** Schema type names in `@schema/types` are aligned with `doc/openapi.yaml` 3.0.0, so
  the same entity is called the same thing in the contract, the diagram and all three client
  libraries. 78 of the file's 101 types now carry their contract name, up from 38. No wire format
  changes — this is types only.
  (HAB-731,
  HAB-708)

  | old | new |
  |---|---|
  | `BaseResourceSchema` | `GlobalResourceSchema` |
  | `BaseViewSchema` | `GlobalViewSchema` |
  | `BaseResourceActionSchema` | `GlobalResourceActionSchema` |
  | `ResourceSchema` | `LocalResourceSchema` |
  | `EndpointSchema` | `EndpointsSchema` |
  | `MenuViewParameters` | `ViewActionParameters` |
  | `MenuLinkParameters` | `LinkActionParameters` |
  | `MenuViewEndpointParameters` | `ViewActionEndpointParameters` |
  | `MenuViewDescriptorParameters` | `ViewActionDescriptorParameters` |
  | `MenuViewChoices` | `ActionViewChoice` |
  | `ListBoxProperties` … `ArrayBoxProperties` (7 boxes) | `ListBoxParameters` … `ArrayBoxParameters` |
  | `ArrayListedBoxProperties` | `ListedOptions` |
  | `WrapperDescriptorProperties` | `FieldWrapperProperties` |
  | `ChoicesOptions` / `ImageOptions` / `AiOptions` / `RelationOptions` / `PhoneOptions` / `UploadOptions` | `*FieldOptions` |
  | `NumberFormat` | `NumberFieldOptions` |
  | `DynamicRender` | `DynamicRenderOptions` |
  | `HttpMethod` | `RequestMethodType` |
  | `FieldFormat` | `FieldFormatType` |
  | `ViewMode` | `ViewModeType` |
  | `ActionResultState` | `ActionStateType` |
  | `SortPayload` | `SortDescriptor` |
  | `SearchSchema` | `SearchResourceSchema` |
  | `SearchObjectResult` | `SearchResultObject` |
  | `SearchResult` | `SearchResourceObjects` |
  | `SchemaWidgetType` / `SchemaWidgetConfig` / `SchemaWidgetLayout` / `SchemaAggregateFunction` | `WidgetType` / `WidgetConfig` / `WidgetLayout` / `AggregateFunctionType` |
  | `SchemaDashboardConfig` | `DashboardPreference` |

  The `Schema*` prefix is dropped from the widget types: on a component it means "schema-driven"
  (`SchemaListBox`), on a type in `@schema/types` it says nothing. `Color` is gone as a separate
  name — it was only ever an alias, so `@schema/types` now re-exports the design layer's
  `ColorType` under the contract's name. `SortPayload` still refers to react-admin's type wherever
  it is imported from there; only our own declaration became `SortDescriptor`.

  Deliberately **not** renamed: `HabRecord` and `RecordMeta` keep react-admin's record vocabulary
  and the structural-superset relationship with `@admin`'s `AdminRecord`; `LinkTarget` stays in
  `@foundation`, where a contract name would not belong. (The ticket's `LinkTarget` → `TargetType`
  line was mistaken — the contract has `TargetType` and `LinkTargetType` as two different
  entities, and this is the second one.)

- **BREAKING:** The hooks and contexts follow the schemas they carry, so a `Global*` schema is no
  longer read by a `Base*` hook: `useGetBaseResourceSchema` → `useGetGlobalResourceSchema`,
  `useBaseResourceSchemaContext` → `useGlobalResourceSchemaContext`,
  `useGetBaseResourceSchemaContext` → `useGetGlobalResourceSchemaContext`,
  `useGetResourceSchema` → `useGetLocalResourceSchema`, `ResourceSchemaContext` →
  `LocalResourceSchemaContext` (with its provider and hook),
  `useResourceSchemaRefresh` → `useLocalResourceSchemaRefresh`. The component layer needed no
  renames — it already names components after what they render, and that naming was already
  discriminator-first. (HAB-731)

- **BREAKING:** `getBaseViewSchema` → `getGlobalViewSchema` on the context returned by
  `useGlobalResourceSchemaContext` / `useGetGlobalResourceSchemaContext`. It resolves a
  `GlobalViewSchema` out of a `GlobalResourceSchema`, so it is named after what it returns like
  everything else in the batch above — it was the one `Base*` name the rename missed, because it is
  a returned member rather than an exported symbol. Its local counterpart on
  `useGetLocalResourceSchema` / `useLocalResourceSchemaContext` stays `getViewSchema`, matching the
  contract's `ViewSchema`. Internal identifiers followed the same rule and are not part of the
  public API: `getBaseResourceSchema` / `getBaseResourceSchemaContext` →
  `getGlobalResourceSchema*`, the `baseResourceSchema` locals → `globalResourceSchema` (they hold a
  *global* schema), `ResourceSchemaContextType` → `LocalResourceSchemaContextType`,
  `GetResourceSchemaProps` → `GetLocalResourceSchemaProps`, `SchemaResourceProviderProps` →
  `LocalResourceSchemaProviderProps`, and `useLocalResourceSchemaContext`'s error message now names
  the context and provider that actually exist.
  (HAB-731)

- **BREAKING:** `LocalResourceSchema.pkFieldName` and `RecordSchema.pkFieldName`, previously
  declared as `pkName`. The backend has always sent `pk_field_name`, which the DataProvider's
  snake→camel conversion turns into `pkFieldName` — the declared `pkName` was never populated.
  Nothing read it, which is why it drifted unnoticed.
  (HAB-731)

Four wire-format keys the backends now send differently. Nothing here is a type rename — the schema
type names are aligned separately in HAB-731.
Requires a backend on Python ≥ 6.0.0 or Ruby ≥ 1.0.0 (HAB-730, HAB-732).

- **BREAKING:** `ResourceSchema.endpoint` renamed to `endpoints`, as the contract has always
  described it. Affects `useGetResourceSchema`, `useResourceSchemaContext`, `TableWidget` and
  `ResourceSchemaLoader`. (HAB-732)
- **BREAKING:** `FieldOptions.numberFormat` renamed to `number`, so the slot is named after what it
  applies to, like its `image` / `phone` / `choices` siblings. The `numberFormat` prop on
  `NumberField` and `NumberInput` is the component API and is unchanged — only the schema option
  moved. (HAB-732)
- **BREAKING:** `FieldOptions.target` is typed as `LinkTarget` (`self` / `blank`) and no longer
  carries the HTML anchor value. The client prepends the underscore when rendering, as `LinkButton`
  and `LinkActionTrigger` already did — the two spellings of the same thing are now one.
  (HAB-732)
- **BREAKING:** `BoxSchema.isReadonly` renamed to `readOnly`, matching `FieldSchema.readOnly` and
  `FieldDescriptor.readOnly`. (HAB-732)
- **BREAKING (backend contract):** *every* data request now carries the active locale, not just the
  ones issued by the list / show / edit / create / action views. The locale travels as
  `params.meta.locale` and as an `Accept-Language` header on every `dataProvider` method (`getList`,
  `getOne`, `getMany`, `create`, `update`, `updateMany`, `delete`, `deleteMany`, `callAction`,
  `aggregate`, `search`) — previously only the schema endpoints sent the header. Backends are
  expected to localize per-record `meta` (`repr`, `tags`, `schema.actions`) according to the request
  locale; custom `dataProvider` implementations receive `meta.locale` on every method and should
  forward it. (HAB-792,
  HAB-782)
- Added the `RequestMeta` type (`locale?: string` plus arbitrary keys) and used it for the `meta`
  field of `ActionParams` and `SearchParams`, which were previously typed `unknown`.
  `AggregateParams` gained a `meta` field of the same type, used to pass the locale to
  `dataProvider.aggregate`. (HAB-792)

- **BREAKING:** `@eluvia/auth` is no longer a dependency of `@eluvia/habarico` (removed from both
  `devDependencies` and `peerDependencies`). The library now exposes plug points instead of a
  built-in integration:
  - `buildServiceAuthProvider` no longer imports `@eluvia/auth` internally — it now takes
    `getAuthData`/`clearAuthData` as parameters alongside the existing action functions, so any
    auth library (or hand-rolled auth state) can be plugged in. The `useServiceAuthProvider` hook
    (the `@eluvia/auth`-specific convenience wrapper) is removed; call `buildServiceAuthProvider`
    directly with the functions from your auth library of choice.
  - The built-in Google login button (which called `@eluvia/auth`'s `useGoogleLogin`) is removed.
    `ServiceAuthProvider` gained an optional `getSsoLoginMethods: () => LoginSsoMethod[]` — each
    entry supplies only the OAuth-driving hook (`{location, redirectPath, onSuccess} =>
    {isCallback, loading, error, login}`); habarico still owns the button/spinner UI and renders
    one button per entry below the credentials form. `buildServiceAuthProvider` takes a matching
    `ssoLoginMethods` param. Wrap `@eluvia/auth`'s `useGoogleLogin` (or any other OAuth hook with
    that shape) to register it again.
  - `useUploadQueue` (and `UploadInput`) no longer import `@eluvia/auth`'s `getAuthHeaders`.
    `ServiceAuthProvider` gained a required `getAuthHeaders: () => Record<string, string>` field —
    uploads read it off the admin's `authProvider` automatically. `buildServiceAuthProvider` takes
    a matching `getAuthHeaders` param and exposes it on the built provider; pass the same function
    you already give `getDataProviderFactory`/`getSchemaProvider`. (There was briefly a standalone
    `getAuthHeaders` prop on `SchemaAdmin`/`BaseAdmin` for this in an earlier beta of this same
    Unreleased cycle — it never shipped and is superseded by this.)
  See the README's "Service Auth Provider" and "SSO Login Methods" sections for the updated wiring.
  (HAB-824)

- **BREAKING:** `getDataProvider` → `getDataProviderFactory`. The name now matches what it
  actually returns — a `dataProviderFactory` (`(servicesSchema) => ServiceDataProvider`), not a
  data provider itself, matching the `dataProviderFactory` prop it's meant to feed and the
  already-correctly-named `getSchemaProvider` (which does return a `SchemaProvider` directly).
  Consumers importing `getDataProvider` from `@eluvia/habarico` must rename their import; behaviour
  is unchanged. (HAB-824)

- **BREAKING:** the client-side CSV export was removed in favour of the backend export:
  `useExporter` now has the signature `useExporter(resource)` and calls the backend export
  endpoint instead of generating CSV from loaded records via `jsonexport` (dependency removed);
  `ExportButton` no longer accepts `maxResults` and does not use the react-admin `exporter` from
  list context (the `exporter` wiring was removed from `ListContent`, `SchemaListBox` and
  `SchemaImagesBox`). Because the button now drives a schema-typed data-provider method, it moved
  from the admin layer to the schema layer (`@schema/components/buttons/ExportButton`) — the
  `@eluvia/habarico` package-root import is unchanged. Consumers relying on the old client-side
  export must switch to a backend providing the `export` list action.
  (HAB-531)

### Removed

- **BREAKING:** `createPerUserStore` no longer takes `getUserId`: pass the signed-in user as
  `identity` instead — or use the new `usePerUserStore` hook, which resolves the user and creates a
  new store when someone else signs in. Backend sync (`backendApi` + `whitelist`) starts only once
  a user is signed in; an unscoped store stays local. A callback resolved on every access kept one store across a change of
  user, so what was already on screen stayed with the previous user and could be written under the
  next one's keys. (HAB-971)
- **BREAKING:** `UpdateIdentityForm` and `ChangePasswordForm` are removed — they are merged into
  `UpdateIdentityDialog` / `ChangePasswordDialog`, which are now the full, overridable account
  dialogs (see the Changed entry above).
  (HAB-883)
- **BREAKING:** `DialogActionsPortal` is removed. It only existed so a form nested in an account
  dialog could portal its Save button into the dialog footer; now that each account dialog owns its
  own footer, the button sits there directly and the portal is no longer needed.
  (HAB-883)

- **BREAKING:** the aggregation and global-search call layer moved to `habarico-enterprise`. Both
  reach endpoints only a paid backend serves and neither had a caller in this package. Gone from
  here: `SchemaProvider.getAggregateSchema`, `ServiceDataProvider.aggregate` and
  `ServiceDataProvider.search` with their implementations, the `useAggregate`, `useSimpleAggregate`
  and `useGetAggregateSchema` hooks, and `serializeGroupByItem`. Install the paid package and pass
  `dataProviderFactory={getEnterpriseDataProviderFactory}` and
  `schemaProviderFactory={getEnterpriseSchemaProvider}`, or render `EnterpriseSchemaAdmin`, which
  passes both.
  (HAB-857)
- **BREAKING:** the dashboard moved with it — `useDashboardStore`, `overlaps` / `assertNoOverlaps`
  and the `WidgetConfig` / `WidgetLayout` / `DashboardPreference` / `WidgetType` /
  `BuiltInWidgetType` / `ChartOptions` vocabulary. HAB-813 kept these on the grounds that they
  mirror the free `preferences.dashboard` store, but this package cannot compose a schema-driven
  dashboard at all: `SchemaDashboard` and every widget are paid, and `SchemaAdmin`'s `dashboard`
  prop takes a hand-written React component. The preference itself stays free on both backends —
  only its client-side typing moved. `DashboardGrid` stays here too.
  (HAB-857)
- **BREAKING:** the aggregate wire types and the widget-component contract are no longer exported:
  `AggregateSchema`, `AggregateBucket`, `AggregateParams`, `GroupByItem`, `GroupByBucket`,
  `AggregateFunctionType`, `TruncGranularity`, `FieldGroupByOption`, `SearchParams`,
  `ServiceSearchResult` / `SearchResourceObjects` / `SearchResultObject` / `SearchResourceSchema`,
  and `WidgetDefinition`, `AdminWidgetProvider`, `AdminWidgetProviderProps`,
  `ResourceWidgetProviderProps`, `WidgetRenderProps`, `WidgetConfigStepProps`, `WidgetDataSource`,
  `WidgetConfigFormState`, `WidgetConfigFormSetters`. `SearchObjectHighlight` stays — the free
  `useFieldHighlight` and six field components read it.
  (HAB-857)
- **BREAKING:** `FieldSchema` and `FieldDescriptor` lose `aggregations` and `groupBy`, and
  `GlobalResourceSchema` / `LocalResourceSchema` lose `aggregateEnabled` and `dashboardEnabled`.
  No free backend emits any of the four — they are contributed by the paid packages — so
  `habarico-enterprise` carries them on `AggregateFieldSchema`, `AggregateFieldDescriptor` and
  `DashboardResourceSchema` instead. `toFieldDescriptor` no longer copies the two field members.
  (HAB-857)
- **BREAKING:** `PREFERENCES_WHITELIST` no longer lists `preferences.dashboard`. The key is still a
  free preference on both backends, but only the paid dashboard writes it, so
  `EnterpriseSchemaAdmin` contributes it through the new `preferencesWhitelist` prop. An
  application wiring the paid dashboard by hand adds it the same way.
  (HAB-857)

- **BREAKING:** the dashboard and every built-in widget moved to `habarico-enterprise` —
  `SchemaDashboard`, `TableWidget`, `AggregateWidget`, `SimpleAggregateWidget`, `BarWidget`,
  `PieWidget`, `LineWidget` and `WidgetDefinitionDialogContent`. They all read the aggregate
  endpoint, which only a paid backend serves. `SchemaAdmin`'s `dashboard` prop has no default and
  no longer accepts `'none'` — leave it unset for an admin without a root page. Resolving a widget
  type went with them: `useGetWidget`, `defaultWidgetProvider`, `defaultListWidgetTypes` and the
  `widgetProvider` / `supportedWidgetTypes` props (with their `SchemaRootContext` entries) are
  removed, because nothing in the free package ever called them — the paid package owns the
  catalogue behind its own `WidgetCatalogProvider`. Install it and pass `dashboard={SchemaDashboard}`
  — or render `EnterpriseSchemaAdmin`, which does it for you.

  `DashboardGrid` — the design-layer grid the dashboard is built on — stays free. The layout store
  and the widget vocabulary were kept here too at the time; they moved to the paid package under
  HAB-857, see the entry above.
  (HAB-813)
- **BREAKING:** global search now needs `habarico-enterprise`. `SchemaSearch` and
  `useGetServiceSearch` — the container that queries the global search endpoint — moved there, and
  `SchemaLayout` no longer imports them. The presentational half stays free and is newly exported:
  `SearchContent`, `SearchOverlay`, `SearchToggle` and `getSearchShortcutLabel` are design-layer
  components that take results as a prop. With no search component supplied the shell offers no
  search at all, including the toggle and the <kbd>Cmd</kbd>+<kbd>K</kbd> shortcut — a shortcut
  opening onto an empty overlay is worse than none.
  (HAB-813)
- **BREAKING:** the AI components moved to `habarico-enterprise` — `SchemaAiAssistantButton` (with
  `SchemaAiAssistantButtonProps`) and `SchemaPredictiveTextInput`. `defaultButtonProvider` no longer
  answers the `ai-assistant` action and `defaultInputProvider` no longer answers the `ai` /
  `ai-text` formats; install the paid package and pass its `enterpriseButtonProvider` /
  `enterpriseInputProvider` (or render `EnterpriseSchemaAdmin`). The action type and both formats
  stay in the free vocabulary, so a backend may keep declaring them — untreated, they render
  nothing and a plain text input respectively.
  (HAB-813)
- **BREAKING:** the Czech localflavor components moved to `habarico-enterprise` — `CzechIcoInput`,
  `CzechDicInput`, `CzechBirthNumberInput`, `CzechIdCardNumberInput`, `CzechBankAccountInput`,
  `CzechBankAccountField`, the `czechBankAccount` helpers and the `Bank` / `BankAccount` types.
  `defaultInputProvider` and `defaultFieldProvider` no longer answer the `czech-*` formats; the
  format names stay in the shared vocabulary and fall back to plain text/number rendering.
  `PhoneNumberField`, `PhoneNumberInput` and the whole `foundation/utils/localflavor/phone` module
  stay free — only the Czech half moved.
  (HAB-813)
- **BREAKING:** the chunked upload transport (S3 multipart / tus) moved to the paid
  `habarico-enterprise` package, together with the `@uppy/core`, `@uppy/aws-s3` and `@uppy/tus`
  dependencies. Base64 uploads are unchanged and stay in the free package, as do `UploadInput`,
  `UploadArea`, `SchemaUploadInput`, `useUploadQueue` and the uploading context — the split runs
  inside the upload module, not between components. A project whose schema sets `options.upload`
  now installs `habarico-enterprise` and imports it once; without it those uploads fail with an
  explanatory error instead of silently inlining a past-threshold file as base64.
  (HAB-813)

### Fixed

- `PanelGrid` spaces its cells by density, the same as the rows of a `PropertyList` (`compact`
  8px, `standard` 14.4px, `comfortable` 24px), instead of a fixed 8px — rows and columns alike, for
  panel cards as well as for a grid box that splits one form into columns, whose inputs now sit
  evenly apart at every density. The new `usePanelGridSpacing()` returns the gap and replaces the
  `PANEL_GRID_COLUMN_SPACING` constant. (VD-2869)
- The filters in the toolbar of a `SchemaListBox` sit as close to the box's left edge as to its
  top and bottom (0.3rem) instead of 16px in, which left the search input visibly further from the
  edge than from the box's top. (VD-2868)
- The impersonation warning in `SchemaAdmin` ("The current user is impersonated from original
  user …") is aligned with the page content below it. It sat outside the content container and
  stretched across the full width of the shell; it now follows `contentMaxWidth` and the content
  padding like the routed views do. (VD-2868)
- A `trigger_action` that redirects after a create or edit lands on its own target. The view's
  after-save redirect ran first and the trigger's link was then built relative to that redirect's
  URL, so an action pointing back at the parent record ended up nested under the saved record's
  show view, which is where the user stayed. A trigger that navigates itself now replaces the
  after-save redirect (and its history entry, when that redirect would have replaced it), and its
  link is resolved against the current route; dialog, side-panel, resource and link triggers and
  redirects into a new tab still run the after-save redirect after them. The same applies to a
  trigger returned by the save of an action view. `BaseActionTriggerProps.onDone` receives an
  optional `ActionTriggerResult` (`{navigated?: boolean}`), and `SchemaViewActionTrigger`,
  `SchemaActionTrigger` and `useTriggerAction` gained an optional `replace` prop. (VD-2868)
- Logging out never deletes the user's preferences stored on the backend: `store.reset()` of
  `createBackendStore` — which React Admin calls on every logout — resets only the local store
  and no longer calls `api.deleteAll()`. The request went out regardless of `clearOnReset` /
  `clearStoreOnLogout`, and only a token already discarded by the logout kept it from wiping the
  user's columns, saved queries, layout, theme and locale on every device. (HAB-972)
- The drop area of `UploadInput` (and the `upload-images` dialog) lists the accepted formats as the
  extensions users know, also when `accept` holds media types: `image/png` and `image/gif` read
  "PNG, GIF" instead of "IMAGE/PNG, IMAGE/GIF", and the Office types read "DOC", "DOCX", "XLSX"…
  JPEG reads "JPG (JPEG)" whether it is named `.jpg`, `.jpeg` or `image/jpeg`, so the default image
  list no longer shows "JPG" and "JPEG" as two formats. A format named twice is listed once; a
  wildcard (`image/*`) or a media type without a known extension is left out of the text, while the
  file check still honours it. (HAB-988)
- The bottom actions (e.g. Save) of a card-less box no longer sit flush against the content above
  them — typically the card of a nested box. The footer of a card-less `simple` / `object` / `grid`
  box is now spaced from its content like a tab box's footer already was. (VD-2852)

- The active tab of a tab box, and the active step of a wizard box, now fill the box's height when
  the box is last on its path, the same way a simple box stretches its nested box. A form in a tab
  or a step placed beside a taller panel used to keep its natural height, while the same form
  without tabs matched the panel beside it. (VD-2852)

- The mobile navigation drawer of `DashboardLayout` (below the `lg` breakpoint) now closes after
  every navigation. It used to close only on a click of a leaf menu item, so clicking the logo in
  the drawer header or a menu item with children (which links to its first child) navigated but
  left the drawer open over the new page. The layout now closes the drawer whenever the route
  changes, which also covers an app-supplied `menu.Component` and redirects. (VD-2858)

- The `⋮` overflow trigger of schema action toolbars (`SchemaButtons`, and so the page, panel and
  dialog toolbars built on it) is labelled in the user's language. `SchemaButtons` never
  passed a label to `OverflowToolbar`, which as a presentational component falls back to an
  untranslated `More`, so the trigger's tooltip and `aria-label` read `More` in every locale. It
  now passes the translated `ra.action.more_actions` (`Další akce` in Czech).
- A long breadcrumb trail no longer breaks the `DashboardLayout` header between the `sm`
  breakpoint and wide screens. The view's actions used to shrink along with the trail, so a long
  action label wrapped onto two or three lines and made the header taller, and the trail was cut
  off with no ellipsis or tooltip. The header now stays one line: the actions never shrink, and the
  current crumb truncates with an ellipsis and a tooltip to the room actually left. It is no longer
  limited by the viewport-based `maxWidth` cap, which still applies to parent crumbs. When a long
  trail would be left under ~320px, the page toolbar (`SchemaViewToolbarActions`) turns icon-only,
  then moves everything into the `⋮` menu. This is measured on the header row itself — the sidebar,
  the header icons and the length of the trail all count. A short trail keeps the labelled buttons.
  Portal and data breadcrumbs behave the same, and the `link` / `view` menu crumbs
  (`MenuSchemaBreadcrumb`) and the `create` crumb are now width-capped and tooltipped like the
  others. A `PortalBreadcrumbItem` with a plain-text label ellipsizes too (wrap it in
  `EllipsisWithTitle` for a tooltip). The current crumb is the last one in the trail, so a crumb
  without a `path` in the middle keeps its width and cap. (VD-2819)
- `SchemaResource`'s `buttonProvider` prop is now forwarded into the `list`/`create`/`edit`/`show`
  views `useGetResourceRouterElement` wires up. It was already destructured and typed on
  `SchemaResourceProps`, and the `getViewWithProviders`/`getViewWithProvidersWithPageContent`
  helpers already wrapped a view in `ResourceButtonProvider` when given one — but the hook itself
  never read `buttonProvider` off `resourceElementProps` or passed it into any of the four calls, so
  it silently fell into the leftover props spread onto react-admin's `<Resource>` instead, and the
  provider's callback was never invoked. A resource-level `buttonProvider` set on `SchemaAdmin`
  (global) was unaffected. (HAB-974)
- The per-user store follows the signed-in user again without a page reload, in both `SchemaAdmin`
  and `BaseAdmin`. It resolved the identity only once on mount, so after signing in on a fresh
  page every preference (`*.listParams` searches and filters, hidden columns, …) was written under
  the unscoped `RaStore.<key>` and the local-only ones were lost on the next reload; signing out and
  in as someone else kept the previous user's keys, so the new user saw and overwrote that user's
  list state and saved queries and never had their own backend preferences loaded; an impersonation
  kept the admin's keys. The store is now re-scoped (and re-hydrated from the backend) whenever
  React Admin resolves a different identity. Values written unscoped before the fix are left where
  they are. While nobody is signed in the store no longer syncs with the backend, so the login page
  stops requesting (and retrying) preferences it has no token for. (HAB-971)
- An array box on an inactive tab or wizard step no longer flashes its inputs in the wrong
  arrangement on the first display of that tab. Every panel mounts up front with the inactive ones
  under `display: none` (so their inputs stay registered), where a row has no layout box and
  measures `0` — which `FormTableRow` committed as its width, and so as the narrow-container
  fallback. Revealing the tab re-renders neither the row nor its measuring effect (none of its props
  change, and the row is memoized), so the fallback stayed on screen until the `ResizeObserver`
  caught up a frame later. A measurement taken with no layout box is now ignored, so the row keeps
  the width it last had — a form does not change width because a tab was switched, and that is what
  lets the tab come back with its layout already right. When the form *is* resized while the row
  waits on a hidden tab, a second observer on the form shell (which keeps its box throughout, marked
  by `FORM_WIDTH_REFERENCE_CLASS`) notices and drops the width, and a row with no width holds its box
  and hides its content until it has measured itself again rather than lay real inputs out by a number
  it does not have. A row that mounts visible never reaches that state — it is measured in a layout
  effect, before the first paint.
  (HAB-975)
- `FormArrayInput` no longer triggers ra-core's array-input default-value path on every render.
  It left React Admin's `ArrayInput` on its default `defaultValue` of `[]`, which is not `null` and
  so walks past the `defaultValue == null` guard in `useApplyInputDefaultValues`; that hook's effect
  has no dependency array, so each pass through it reached `fieldArrayInputControl.replace()` plus
  `reset({}, {keepValues: true})`. It now passes `defaultValue={null}` and stops at the guard. Its
  own `defaultValue` prop (the shape of a new row) was never RA's array-level default and is
  unaffected.
  (HAB-975)
- `SaveButton` stopped subscribing to `isValidating`. react-hook-form flips that flag true and back
  around every validation run, so each save button re-rendered on every keystroke that validates —
  once per keystroke, since React batches the on/off pair of a synchronous validator into one commit.
  The flag was redundant: `handleClick` revalidates the whole form with `form.trigger()` before
  submitting, so gating the button on it only duplicated that guard. The button now re-renders on
  dirty and submit transitions only.
  (HAB-975)
- `FormStatusLabel` and `useRemoveArrayItem` narrowed their `useFormState()` subscriptions with
  `name`. Without it react-hook-form matches every emission, so all of a form's tab labels and array
  inputs re-rendered on any emission the subscription's keys let through — for the labels, a keystroke
  into any field in any tab once the form revalidates on change. `FormStatusLabel` scopes to its own
  group's fields, tracking membership through `formGroups.subscribe` so the subscription is rebuilt
  as inputs register; `useRemoveArrayItem` scopes to its array's path. Un-named emissions (a
  `reset()`) still pass both, which is what keeps the dirty map and the default-value realignment
  correct.
  (HAB-975)
- `FormStatusLabel` (the dirty/error status dot on tab and wizard-step labels) no longer re-renders
  on every keystroke. It used ra-core's `useFormGroup`, which reads four `formState` keys and scopes
  to none, so once the form revalidates on change — the regime `reValidateMode` switches on after the
  first save attempt — a keystroke into any field in any tab re-rendered every label (measured: nine
  labels, nine re-renders per typed character; before that first save attempt, with the default
  `mode: 'onBlur'`, validation does not run on change and neither implementation re-rendered). The
  dot only needs the group's dirty/error state, so it now subscribes react-hook-form's `formState`
  proxy to exactly `dirtyFields` and `errors`, scoped with `name` to the group's own fields —
  resolved via ra-core's `useFormGroups().getGroupFields`, the same registry `useFormGroup` reads.
  The re-renders it drops sit inside commits that happen anyway; no commit is removed.
  (HAB-975)

- The first keystroke into a form opened in a dialog no longer re-renders the entire dialog form
  (measured: a 5,357-fiber / 15 ms commit). The `isDirty` flip makes `FormNavigationGuard` set
  `hasUnsavedChanges`, and `SchemaViewActionTrigger` — the ancestor of everything inside the dialog
  it opened — subscribed to that context value only to copy it into a ref for its click handler.
  The context is now split: a stable control half (`useUnsavedChangesControl`, getter + setter whose
  context value never changes) that the trigger and the guard consume, and the original subscribing
  `useUnsavedChanges` kept for consumers that render off the value. The dirty flip now re-renders
  nothing.
  (HAB-975)

- Switching a tab no longer re-renders the app shell and half the form (measured: a 4,512-fiber /
  53 ms commit per switch, plus a 2,585-fiber / 33 ms one). Two mechanisms, both confirmed by a
  React DevTools profile of a single tab switch:
  - `TabsLocationProvider` mirrored the open tab into the URL hash via react-router's `navigate()`,
    and the new location object re-rendered every `useLocation`/`useSearchParams` consumer in the
    app — the nav menu (`usePathname`), breadcrumbs, and every `dynamicRender` wrapper (through
    `useSchemaViewRouterContext`). The mirror now writes through `window.history.replaceState`
    directly — deep-linking and reload behave the same, nothing re-renders. The router's own
    `location.hash` goes stale between real navigations, so `useGetLinkWithData` (the one consumer
    that carries the hash into show ↔ edit links) now reads `window.location.hash` instead.
  - `FormInputSourcesContext` carried `{sources, register, unregister}` in one value, so a mounting
    tab's inputs registering their sources changed the context and re-rendered every already-mounted
    input in the form. The registration callbacks (stable) now live in their own
    `FormInputSourcesRegistrationContext` — inputs subscribe via the new
    `useFormInputSourcesRegistration()` and never re-render from registrations;
    `useFormInputSourcesContext()` keeps its API for consumers that need the `sources` list itself.
  (HAB-975)

- A templated label (`%{formData.*}` / `%{data.*}` in a field label, help text or box label) no
  longer re-renders the whole form from its root on every keystroke. `DynamicTextContent` and
  `useStrTemplate` called react-hook-form's `watch()`, which registers its names in the control's
  global watch set (add-only — a name outlives the label that watched it) and re-renders the
  component that owns `useForm` — ra-core's `<Form>` — on any change to a watched field, defeating
  the form's entire per-field render isolation. Both now share one `useTemplateFormData` hook that
  subscribes only itself, through react-hook-form's `subscribe({name})`; unlike `useWatch` that is
  also safe where there is no form at all (a list or show row action's templated label), so no
  form/non-form component split is needed.
  (HAB-975)

- Typing into an array table no longer re-renders every cell of the table. `SchemaWriteableArrayBox`
  rebuilt its field-schema map (`generateFieldSchemaMap`, a lodash merge per field) and its
  `SchemaInput` children on every render; the fresh children defeated `FormArrayInput`'s column memo
  and with it `FormTableRow`'s `React.memo` for every row. Both are now memoized, as are the same
  unmemoized `generateFieldSchemaMap` calls in `SchemaReadonlyArrayBox` and `SchemaImages`, and
  `SchemaMultipleFieldList`'s per-render `rowSchema` object.
  (HAB-975)

- `FormTableRow` and `DetectableOverflow` (behind every ellipsized label/chip) both ran a
  measurement effect with no dependency list — a forced synchronous layout
  (`getBoundingClientRect`/`scrollWidth`) after every render of every instance, on top of a second
  measure from the effect's own `setState`. Both effects are now gated on the props that can
  actually change the measured content; the `ResizeObserver` each already carries keeps covering
  size changes a render doesn't cause.
  (HAB-975)

- `NumberInput` derived its prefix/postfix in the render body, constructing an `Intl.NumberFormat`
  (one of the priciest stdlib constructors — each loads locale data) and calling `formatToParts` on
  every render; that derivation is now memoized. `parseLocaleNumber`, which runs on every render and
  keystroke of every `NumberInput`, built two more instances plus two `new RegExp` compiles per call
  to resolve the locale's separators — those are constants per locale, so they are now resolved once
  and cached with their compiled regexes, keyed by locale alone.
  (HAB-975)

- An input's `validate` array is now memoized in `SchemaWriteonlyInputContent`. Rebuilding it per
  render re-created every validator closure — including a `new RegExp` compile per schema `regex`
  rule — and its fresh identity made react-admin's `useInput` re-compose and re-register the
  validator with react-hook-form on every render of every input. Also memoized the
  `UploadingContext` and `FormInputSourcesContext` provider values (fresh objects per render, same
  context-invalidation pattern as the box providers fixed earlier).
  (HAB-975)

- `SchemaPropertyItem` — the per-field row rendered once per field in every plain (non-array) box,
  the single most common render path in the library — is now wrapped in `React.memo`. Before, any
  unrelated re-render of the surrounding box (a sibling field's own value changing, an ancestor
  context update) re-executed every other field's row too, not just the one that actually changed —
  the same fan-out `FormTableRow` had for array lists, just far more widely travelled. Also memoized
  two context values feeding into it that had the same "fresh object every render" gap:
  `PanelGridItem`'s `PanelGridContext` value and `SchemaGridBox`'s per-cell `labelWidth` override of
  `PropertyListContext` (the latter needed a small `LabelWidthOverride` subcomponent, since a `useMemo`
  can't live inside the `.map()` that builds each grid cell).
  (HAB-975)

- Switching a tab/wizard box's own tab no longer re-renders every *other* tab/wizard box in the same
  view. `useTabBox` subscribed to the shared `TabsStore`'s whole open-tabs list (`getTabs()`, a flat
  array covering every tab/wizard box on the page), which `setTab` always rebuilds as a new array —
  so `useSyncExternalStore` re-rendered every tab box on the page on any tab switch anywhere, not
  just the one whose own active tab changed. It now derives its snapshot from `getActiveTab(path)`,
  scoped to its own path, so a switch elsewhere in the view no longer touches it.
  (HAB-975)

- Switching tabs/wizard steps, and editing in general, no longer re-renders every other box in the
  form. `ParentBoxProvider` and `FieldSchemaMapProvider` were both handed a fresh `value` object on
  every render (neither memoizes its own), which invalidates the context for every descendant
  regardless of whether anything actually changed — a context change re-renders a consumer even
  through a `React.memo` boundary, since memo only compares props. Particularly costly in
  `SchemaTabBox`/`SchemaWizardBox`, where every tab/step stays mounted at once: switching one
  re-rendered all of them, not just the one moving. Fixed by memoizing the context values
  (`SchemaSimpleBox`, `SchemaArrayBox`, `SchemaWriteableObjectBox`, `SchemaReadonlyObjectBox`) and by
  extracting each tab/step into its own `React.memo`-wrapped component (`SchemaTabBoxPanel`,
  `SchemaWizardBoxStep`) so switching only re-renders the tab/step actually changing. Also memoized
  `FormDynamicBoxSchemaComponentWrapper`'s filtered `schema` object, which was rebuilt fresh on every
  render and would otherwise still invalidate every `useMemo` keyed on `schema` downstream (including
  the array-list fix above).
  (HAB-975)

- A `dynamicRender.showQuery` / `requiredQuery` no longer re-renders every conditional field in the
  form on every keystroke. `useDynamicFormData` now watches only the fields a given condition
  actually reads (extracted from its parsed expression), instead of subscribing to the whole form —
  a large form with many `dynamicRender` fields no longer slows down as it grows, and a field that
  declares both `showQuery` and `requiredQuery` (regressed in HAB-957, which gave each its own
  full-form watcher) no longer pays for two full-form subscriptions. A condition referencing `parent`
  falls back to watching the whole form, since it cannot be resolved to a concrete field path.
  `createConditionFunction` also caches its parsed expression per query string instead of
  re-parsing it with `jsep` on every render.
  (HAB-975)

- A form with several array lists (`FormArrayInput`, `SchemaChoicesArrayBox`'s checklist) re-rendered
  every row of every list on any unrelated change elsewhere in the form. `FormTableRow` is now
  wrapped in `React.memo`, and `FormTable`'s own `removeAt` plus both callers' `columns`/`rows`/
  `onChange` are memoized to match — a fresh reference on any one of those undid the memoization for
  every row regardless. A row now only re-renders when its own data or column definitions actually
  change.
  (HAB-975)
- Signing out no longer leaves the admin requesting the backend without credentials. The signed-in
  user held above `<Admin>` stayed the last one after a sign-out, so the next render of
  `SchemaAdmin` (a language switch on the login page, any re-render of the application) refetched
  the service schemas, which React Admin had just cleared from the cache, without a token, and the
  per-user store kept syncing preferences for the user who had left. `SchemaIdentitySync` (and the
  identity sync of `BaseAdmin`) now reports the sign-out, the schema queries are also skipped while
  `authProvider.isAuthenticated()` is `false` (new optional fifth argument of
  `useGetServiceSchemas`), and the store is a local one until the next sign-in. The backend store
  no longer retries a hydration rejected with 401 or 403, retries again after a teardown and setup
  of the same store (React StrictMode), and cancels a pending retry on teardown; the preference
  calls of the schema provider reject with an `HttpError` carrying the response status. (HAB-978)
- `SchemaAdmin` and `BaseAdmin` rendered without a router of the application's no longer lose a
  redirect issued right after they re-render — after a sign-out the screen stayed on the loading
  indicator of the logout page while the URL already showed the login page. React Admin's own hash
  router is created again on every render of `<AdminContext>`; both now render `AdminHashRouter`
  instead. (HAB-978)

- `DashboardGrid` in `edit` mode lets a panel be dragged into the grid's top-left cell again on a
  grid narrower than ~996px. Below that width the grid's invisible drop spacer lost its position
  and sat on the top-left cell, where it blocked the drop.
  (HAB-1003)
- A view trigger and a record link that navigate out of an overlay now close it through a
  dedicated `closeOverlay`, which `SchemaViewRouter` supplies only for a dialog or a side panel,
  instead of through `prevView`. `prevView` means "go back", and on a page surface that is a
  navigation of its own: in a `ViewDialog` mounted outside the schema's view routing (a consumer
  composing one by hand) the page fallback would have fired and taken the user to the previous view
  rather than to the record just opened. `prevView` keeps its two meanings for Cancel and
  `afterSave: 'prev'`, where that is the point.
  (HAB-964)

- **BREAKING:** a record link (a reference field's chip, `SchemaRecordLink`) now resolves its
  `link_mode` the same way a view action resolves `view_mode`, so a chip and an action opening the
  same record behave alike. Three things change: a page link clicked inside a dialog used to do
  nothing at all and now navigates to the record's page and closes the dialog; a navigation that
  leaves an overlay closes it (the side panel included); and a panel link fired from inside the side
  panel replaces the panel's content instead of opening a dialog on top of it. A field that sets no
  `link_mode` now also inherits the target view's own `mode`, so a link to a view declared as
  `dialog` / `sidepanel` opens that way instead of navigating to a route the view does not have. A
  link that asks for an overlay no longer falls back to a redirect when it cannot swap the view in
  place: answering with a surface other than the one requested hid the wiring mistake, which is now
  reported to the console instead.
  (HAB-964)

- **BREAKING:** an action with an explicit `view_mode: 'redirect'` pointing at a view that is not
  routed (its own `mode` is `dialog` or `sidepanel`, so it has no URL) is now refused on every
  surface, with the warning it already logged on a page and in the side panel. Inside a dialog such
  an action used to swap the view in place, which made the one surface able to paper over the
  contradiction the only one that never reported it. A schema hitting this either drops the action's
  `mode` — the view then opens by its own — or routes the target view. A default gesture with no
  action `mode` is unaffected and still shows a non-routed view inside the dialog.
  (HAB-964)

- A `SchemaViewRouterContextProvider` that describes only where we are no longer breaks the view
  navigation for everything below it. Both navigations are optional in
  `SchemaViewRouterContextProps`, but the provider's value was spread *over* the routed fallbacks,
  so a context carrying either key as `undefined` overwrote them and left consumers with a
  non-function (typed as possibly-undefined, which is why the library reached for a non-null
  assertion internally). The fallbacks are applied after the spread instead.
  (HAB-964)

- A dialog no longer reaches the docked side panel of the list behind it. The nearest
  `SidePanelProvider` is the one that list mounted, and React context reaches through the dialog's
  portal, so a `sidepanel` action (or a `link_mode: 'sidepanel'` record link) fired from inside a
  dialog docked the target into another surface's panel and left the dialog stacked over it —
  invisible to the user. `ViewDialog` now resets the controller to the no-panel default for its
  content, so such a trigger falls back to the dialog it is already in (an in-place view swap).
  Content that brings a panel of its own — a full list, which mounts one in `ListShell` — still
  provides it below that boundary and keeps working.
  (HAB-964)

- A view action with an explicit `view_mode: 'redirect'` fired from a view shown in a dialog or in
  the side panel now closes that overlay and navigates to the target view's own route, instead of
  swapping the target into the overlay — a record opened in a dialog could not be reached on its own
  page at all. A gesture without an explicit mode (a plain row click, a button on an action with no
  `view_mode`) keeps swapping the view inside the overlay as before, and a navigation that leaves an
  overlay behind now always closes it — including a default gesture in the side panel, which used to
  navigate and leave the panel open over the page it opened. Opening the redirect in a new tab
  leaves the overlay untouched.
  (HAB-964)

- A schema `regex` rule without a `message` no longer reports an invalid value as "Must match a
  specific format (regexp): [object Object]". `defaultValidatorProvider` built it on React Admin's
  `regex()`, whose pattern arg does not survive the JSON the error is passed as. The rule now tests
  the pattern itself and falls back to `ra.validation.invalid_format` ("Invalid format"); a rule's
  own `message` is shown as before. Any Django field with a `RegexValidator` produced such a rule.
  (HAB-970)
- Storybook Controls and "Show code" audited and fixed across `admin/**` and `design/**` story
  files: crash-prone free-text Controls (locale/format strings) now use safe `select`s, several
  Controls that changed nothing on screen (`PanelHeader`'s `status`, `StyledDatagrid`'s
  `configurable`, an `ActionButton`/`ActionButtonWithChoices` `confirm` switch silently dropped by
  its own display-name override, others) now either work or were removed, "Show code" now shows
  real composed usage instead of a local demo wrapper's tag or a stale/duplicated snippet, and the
  autodocs page no longer repeats the primary story a second time. Story descriptions no longer
  reference internal task numbers or narrate implementation history. The `AdminDatagrid` /
  `StyledDatagrid` story shells also used a `Box` margin instead of padding, which collapses
  through `body` and silently disappeared from the Docs preview frame's auto-sized height; switched
  to padding.
  (HAB-865)
- `SchemaListBox` spacing is aligned with the panel it sits in, which matters most in a nested
  (grey) panel such as a detail opened in a dialog. The toolbar and the pagination now end on the
  panel's 16px content gutter instead of sitting further in than the full-bleed datagrid rows.
  The toolbar no longer reserves MUI's 56–64px page-toolbar height, so there is no empty band
  above the table. The "no results" message has no padding or paper-coloured background of its
  own, so it no longer shows as a white box inside the panel.
  In a view dialog, the list box's toolbar and pagination were also padded 16px on every side:
  `ViewDialog` applied its action-bar padding to every `.MuiToolbar-root` in the dialog. The rule
  is now scoped to the dialog header and footer, so the pagination is back to 52px instead of 82px.
  (HAB-960)
- More Storybook Controls/"Show code" fixes across `admin/common`, `admin/buttons` and
  `admin/datagrid`: `FormStatusLabel`'s `States` showcase used a zero-arity `render`, breaking its
  `controls.include: []` and leaving "Show code" on with no override — fixed with an unused `_args`
  parameter and `docs.canvas.sourceState: 'none'`. `ActionButton`'s `Playground` and
  `ActionButtonWithChoices`'s new `Playground` (replacing its former no-controls `Default`-only
  setup) each gain a `confirm` boolean control — the real prop takes a `{title, content, options}`
  object, not something a Controls widget can build, so the Playground re-types it as a switch that
  wires in a fixed destructive-action example; the standalone `Confirm` / `WithConfirm` stories stay
  as the real, copy-pasteable usage, now with `docs.canvas.sourceState: 'none'` since `Playground`
  is the one story meant to show code. `ActionButton`'s remaining `Surface` / `ShowLabel` / `Loading`
  showcases get the same treatment. Along the way, an `argTypes` entry that also set a display-name
  override (`name: 'Confirm'`) turned out to be silently dropped from the story's resolved
  `argTypes` entirely — its control never rendered even though it stayed listed in `controls.include`
  and had a default in `args`; removing the `name` override (the row just shows its key, matching
  `hasFilters` on `DatagridActions`) fixed it. `AdminDatagrid`'s story shell wrapped its content in a
  `Box` with a margin (`m: 2`) instead of padding — a margin collapses through `body` (nothing
  separates them), so it wasn't counted in the height Storybook's Docs preview frame auto-sizes to,
  and the panel sat flush against the frame's bottom edge while the top/side gaps (unaffected by
  collapsing) still showed; switched to `p: 2`, which can't collapse.
  (HAB-865)
- A field's `dynamicRender.showQuery` hid its value in a detail box but left the row's label behind,
  empty. The component that owns the space a field or box takes up now evaluates `showQuery` and
  hides that space as a whole: a detail row drops its label with the value, a grid cell drops with
  its box, and a datagrid cell keeps the cell and hides only its content. Each query is evaluated
  once, where before a grid cell and a tab or wizard step checked the same box twice. `SchemaInput`,
  `SchemaField` and `SchemaBox` rendered on their own still hide themselves, `hiddenEl` included.
  A wrapper field's own `showQuery` now applies as well; before, only the fields inside it were
  evaluated.
- `PropertyFormLayout` read a `<FormDataConsumer>` or a fragment child as a single input with no
  `source`: the input kept its own floating label instead of moving into the label column, and a
  consumer that returned nothing still left an empty row. Both are now unwrapped: every input they
  hold gets its own row, and a consumer returning nothing leaves no row.
- A wizard box keeps its **Next** button on the last step, disabled, instead of removing it. The
  control no longer vanishes when you reach the end — it stays in place, just greyed out — while any
  `bottomActions` (e.g. Save) still show beside it. (HAB-959)
- A tab box's scroll buttons no longer pop in and out as you scroll an overflowing tab strip. MUI
  mounts both scroll buttons once the strip overflows but hides the one whose direction can't
  currently scroll (`opacity: 0`), so a lone arrow showed at each scroll extreme and the second only
  faded in mid-scroll. A new `MuiTabs` scroll-button theme override greys the disabled arrow out
  (MUI's standard disabled opacity) instead of hiding it, so both stay on screen together for as long
  as the strip overflows — while a strip whose tabs fit still shows no arrows at all. (HAB-959)
- The `…` popover of a collapsed portal breadcrumb trail no longer renders folded crumbs blank.
  The collapse controller used to collect each crumb's label element and re-render it beside the
  popover, which resolved it against whatever React context sat there rather than the crumb's own:
  a route crumb's `ResourceRepresentation` picked up the page's resource, fetched a record that does
  not exist under it and rendered nothing. Menu crumbs were unaffected — their labels are plain
  strings. A folded crumb now renders its popover entry in its own place in the tree and only
  portals it into the list, so every context the call site wrapped it in is kept. The controller no
  longer stores labels at all, which also drops the stale label a crumb kept after its `path`
  changed without remounting. (HAB-961)

- A density stored by an older version is no longer applied as-is. `normal` was renamed to
  `standard` in 6.7.0, but the value written before that stays in the browser's store, where
  nothing overwrites it — a backend omits the key it deleted as invalid, and an app that does not
  sync preferences never reads from a backend at all. It left the picker in `SettingsPanel` with
  no button selected and put an unknown `density-normal` class on `<body>`, so the datagrid
  rendered compact. `useAdminSettings` now falls back to the default (`standard`) for any value
  that is not a density; the stored value is left untouched and the next explicit choice
  overwrites it. The values are listed in the new exported `DENSITIES`, beside the `Density` type.
  (HAB-939)
- `MenuItem`'s `dense` prop had no visible effect: the theme override pinned a fixed `padding`,
  `minHeight: 'auto'` and `body2` typography on the root slot unconditionally, at the same
  specificity as (and registered after) MUI's own `dense` variant, silently overriding it —
  including the font-size step MUI's `dense` normally applies. The override now checks
  `ownerState.dense` and restates the compact `minHeight`/vertical padding, and steps the
  typography down to `caption` (one size below the item's own resting `body2`), for both the
  plain-text root and a `ListItemText`-based label.
  (HAB-926)
- `TextField`'s `emptyText` was rendered outside the value's container, so it never got the
  `overflow: hidden` / `textOverflow: ellipsis` treatment applied to a real value — a long
  `emptyText` could overflow a narrow datagrid column instead of truncating like the value does.
  It now renders through the same container as the value, which also set `white-space: nowrap`
  directly on that container instead of relying on it being inherited from the `FunctionField`
  root — a value with spaces wrapped onto multiple lines instead of staying on one line and
  ellipsizing, since single continuous words happened to have no wrap point either way.
- `TextField`'s explicit `multiline={false}` had no effect outside a collection: the single-line
  vs. wrapped choice was `multiline || !isInCollection`, so a falsy `multiline` (`false` or unset)
  was indistinguishable and the location-based default (wrap outside a collection) always won.
  It now uses `multiline ?? !isInCollection`, so a `multiline` explicitly passed as `true` or
  `false` always wins, and only an unset one falls back to the per-location default. (HAB-941)

- Extended the `design/atoms/**` / `design/molecules/**` / `design/organisms/**` /
  `design/layouts/**` Storybook Controls/"Show code" fix pass to `design/pages/NewOwnerDialog` and
  `design/hooks/**`. Highlights:
  - `NewOwnerDialog` pointed `component` at the reusable `CustomDialog` molecule instead of its own
    local demo wrapper, so autodocs auto-inferred `CustomDialog`'s full prop list (`open`,
    `onClose`, `maxWidth`, …) into Controls even though the story's `render` hardcodes everything —
    every control was dead. `component` now points at the local, zero-prop demo component instead
    (the same pattern already used by `Dashboard`, `PropertyDetail`, `PropertyEdit` and
    `PropertyList`), so there is nothing left for docgen to auto-infer a table from.
  - `useDialog`, `useMenu` and `usePopover`'s single interaction demo pointed `component` at the
    underlying MUI `Dialog`/`Menu`/`Popover`, again auto-inferring a full, entirely dead Controls
    table; each now sets an explicit, honest `controls.include: []`. Their `render` functions (and
    `useMenu`'s second `Actions` story) were all written `() => (...)`, which — independently of
    `controls.include` — tripped the same zero-arity `__isArgsStory` bug already fixed in
    `design/layouts/**`: Storybook derives that flag from `render.length > 0`, so it silently
    disabled the Controls filter *and* "Show code"'s dynamic JSX serialization at once. Every
    `render` now declares an unused `_args` parameter, fixing both symptoms together.
  - `useConfirm`'s demo defined its `UseConfirmDemo` wrapper *inside* `render` itself, so it got a
    fresh component identity on every invocation — React remounted it (losing the dialog's open
    state) on any re-render. `useConfirm` doesn't read the theme, so — like the sibling `useDialog` /
    `useMenu` / `usePopover` demos — it now calls the hook directly in `render`, fixing the remount
    bug.
  - All four `design/hooks/**` stories gained a `docs.source.transform` override. "Show code" only
    ever serializes the JSX `render` returns, never the `const {Dialog, openDialog} = useDialog()`
    (or `useMenu`/`usePopover`/`useConfirm`) line above it — the entire point of these pages — and
    the wrapper component `useDialog`/`useMenu`/`usePopover` return is an anonymous function created
    inside `useMemo` with no `displayName`, so it printed as the meaningless `<Component>` instead of
    `<Dialog>`/`<Menu>`/`<Popover>`. Each story now overrides the snippet with the real call site,
    hook destructure included.
  - Ported the same `.storybook/preview.ts` (`parameters.jsx.displayName` resolver) and
    `.storybook/DocsPage.tsx` infrastructure fixes used by the other layers, so "Show code" resolves
    MUI's `forwardRef` components by their real name here too, and the primary story isn't listed a
    second time under "Stories".
- Extended the `design/atoms/**` / `design/molecules/**` / `design/organisms/**` Storybook
  Controls/"Show code" fix pass to `design/layouts/**`. Highlights:
  - `AuthLayout`, `SimpleLayout` and `DashboardLayout` previously shipped a single, non-`args`
    `Default` story with no `argTypes`/`controls.include` at all, so their autodocs Controls table
    auto-inferred the full unfiltered docgen prop list (`logo`, `language`, `help`, `sx`, …) with
    none of it wired up — every control was dead. Each now exposes only its genuinely
    boolean-controllable slots (`AuthLayout`/`SimpleLayout`: `appearance`, plus `SimpleLayout`'s own
    `compact`; `DashboardLayout`: `appearance`, `arrangement`, `table`, `notifications`,
    `breadcrumbs`, `settings` — every slot typed `true | {...}` that renders safely with just
    `true`/`false`) and is renamed `Playground` per convention; the rest (`logo`, `menu`, `account`,
    `workspaces`, `language`, `search`, `marketing`, `status`) need real data/components, so they
    stay fixed demo props outside Controls rather than becoming invented controls.
  - `SettingsPanel` and `Search` (`SearchToggle`) wire real controllable props too (`SettingsPanel`:
    `appearance`/`arrangement`/`table`, the same section-visibility slots the real component reads;
    `Search`: `tooltip`). Both need a stateful trigger+overlay demo wrapper, so `Playground`'s "Show
    code" would otherwise show that wrapper's own opaque tag; `docs.source.transform` rebuilds the
    real composed usage from the story's live args instead, the same reactive escape hatch used for
    `ConfirmDialog`/`InspectorPanel`/`DashboardGrid`/`FormTable`/`UploadArea` in `design/organisms/**`.
  - `NotificationsPanel`, `DataBreadcrumbs` and `PortalBreadcrumbsOutlet` have no prop that's both
    real and safe to flatten into a Controls widget (nested label objects, `ReactNode`/data-array
    props, or — for `PortalBreadcrumbsOutlet` — no props at all), so they keep an honest, empty
    `controls.include: []` instead of a dead auto-inferred table; their existing click-to-open /
    static-data stories already demonstrate the real interaction. Their `render` functions were all
    written `() => (...)` (no reason to read `args`), which — independently of `controls.include` —
    tripped the same zero-arity `__isArgsStory` bug already fixed for `SidePanel` in
    `design/organisms/**`: Storybook derives that flag from `render.length > 0`, not from whether
    `args` is used, so it silently disabled the Controls filter *and* "Show code"'s dynamic JSX
    serialization at once, falling back to printing the story object's literal source text (e.g.
    `{ render: () => <DataBreadcrumbs items={_twoItems} /> }`) instead of the real, expanded
    `<DataBreadcrumbs items={...}>` a consumer could copy. Every `render` in these three files now
    declares an unused `_args` parameter, which fixes both symptoms together.
  - Every non-primary story across `design/layouts/**` now sets
    `parameters.docs.canvas.sourceState: 'none'`, matching the established convention.
  - Ported two Storybook-wide infrastructure fixes from `design/organisms/**` that directly affect
    "Show code" quality everywhere, `design/layouts/**` included: a `parameters.jsx.displayName`
    resolver in `.storybook/preview.ts` so MUI's `forwardRef` components render as their real name
    (e.g. `IconButton`) instead of `React.ForwardRef`, and a custom `.storybook/DocsPage.tsx`
    (`<Stories includePrimary={false} />`) so the primary story (`Playground`, by convention) isn't
    listed a second time, statically and without Controls, under "Stories".
- Dead Storybook Controls and broken "Show code" across `admin/auth` and `admin/buttons`:
  `ChangePasswordDialog`, `UpdateIdentityDialog` and `AuthPage` only ever showed their local demo
  wrapper's opaque tag in "Show code" — now overridden via `docs.source.code` to show the real
  composed usage. `ActionButton`'s `Surface` / `ShowLabel` / `Loading` / `Confirm` stories and
  `ActionButtonWithChoices`'s `Playground` / `WithConfirm` used a zero-arity `render`, which made
  Storybook skip `controls.include` filtering and fall back to the full, dead auto-inferred
  Controls table — fixed by giving each an unused `_args` parameter. `ActionButtonWithChoices`'s
  `Playground` (it has no Controls at all) is renamed `Default`. `ActionButton`'s `label` control
  is free text with no way to see which strings actually resolve through i18n, so its `argTypes`
  description now lists the common `ra.action.*` keys.
- Dead Storybook Controls and broken "Show code" across `admin/common`, `admin/datagrid` and
  `admin/dialogs`: `AdminDatagrid`'s and `DatagridActions`' non-`Playground` stories, and
  `DraggableImagePanel`'s single story, used a zero-arity `render`, which made Storybook skip
  `controls.include` filtering and fall back to the full, dead auto-inferred Controls table —
  fixed by giving each an unused `_args` parameter (and, for `AdminDatagrid`'s drag-and-drop story,
  moving its `useState` out of `render` into a top-level demo component). `AdminDatagrid`,
  `DatagridActions`, `DraggableImagePanel`, `DraftRestoreDialog` and `UnsavedChangesDialog` all
  render a local demo wrapper, so their one code-bearing story ("Playground"/"Default") showed only
  that wrapper's opaque tag in "Show code" — now overridden via `docs.source.code` (fixed args) or
  `docs.source.transform` (`Playground`, which reads live Controls values) to show the real,
  copy-pasteable composed usage; every other Showcase story instead sets
  `docs.canvas.sourceState: 'none'` to hide "Show code" rather than show a fabricated snippet.
  `DraggableImagePanel`'s single story (no Controls at all) is renamed `Default`, and its snippet
  shows the actual `.map()` composition (it renders one tile per record) instead of a single
  instance next to four rendered tiles. Storybook's default autodocs template also listed the
  primary story a second time, verbatim, under "Stories" — `.storybook/DocsPage.tsx` now overrides
  it with `<Stories includePrimary={false} />`.
- `SubmitButton` ignored a caller-supplied `label`, always overwriting it with `ra.action.submit`
  because the literal was applied after the props spread. `label` is now an overridable default. The
  same "hardcode after spread" bug is fixed in `FilterButton`, `SelectColumnsButton`,
  `SavedQueriesButton` and `FilterDrawerButton`, which all advertised `label` (via `ActionButtonProps`)
  but silently dropped it — their default labels are unchanged.
  (HAB-883)
- `LinkActionTrigger` never called the `onDone` callback it accepts, so `SchemaActionTrigger` was
  never told a link action had finished and kept the trigger mounted. It reports completion now,
  including when the URL was refused.
  (HAB-908)
- `PasswordField` dropped every `slotProps` entry except `input`, so a caller's
  `slotProps.inputLabel.shrink` never reached the label and it rendered on top of the field's value.
  The object is merged now, and the visibility toggle is appended to a caller's own `endAdornment`
  instead of replacing it.
  (HAB-928)
- Extended the `design/atoms/**` Storybook Controls/"Show code" fix pass to `design/molecules/**`:
  every curated story's Controls panel is now genuinely wired to its `render` (or, where the props
  aren't sensibly control-able, declares `controls.include: []`), and every `render` that needs a
  local demo/shell wrapper (`CustomDialog`, `Panel`, `Section`, `PanelHeader`, `TreeSelect`, …)
  overrides `parameters.docs.source.code` with the real composed usage instead of showing the
  wrapper's own tag. `PanelFooter` previously had no `Playground` at all — its Controls table was
  fully dead (inferred from the raw component, never read by either exported story) — it now
  mirrors `SectionFooter`'s `left`/`right` toggle pattern. Every non-`Playground` story sets
  `parameters.docs.canvas.sourceState: 'none'`, matching the `design/atoms/**` convention.
  (HAB-883)
- `ButtonLoader`'s Storybook `Playground` (and the autodocs canvas, which renders the same story)
  defaulted to the `contained` variant rendered directly on the bare canvas. Its color is the
  palette's contrast text (white on most colors), so it was invisible against the light theme's
  near-white background. `Playground` now wraps it in the same color surface `LoadingButton`
  gives it in real usage; `Colors` and `Sizes` were unaffected and keep showing the `outlined`
  spinner directly.
- The `listed` array box (`SchemaChoicesArrayBox`) now renders on the same surface as every other
  box — a `Panel` with its label in the header, or the card-less container when `card: false` —
  instead of a bare heading followed by loose rows, so a checklist no longer reads as page content
  that fell out of its card.
  (HAB-879)
- A checklist row of the `listed` array box no longer offers a delete button. Unticking its
  checkbox is what removes the choice, so the button either duplicated the checkbox (on a ticked
  row) or stood for nothing (on an unticked one). Free rows — the `otherValues` ones, which have no
  checkbox — keep it.
  (HAB-879)
- Inputs in a `FormTable` column with `align: 'center'` (the cells of the `listed` array box) now
  fill their column instead of shrinking to their content width, leaving a short input floating in
  a wide cell. The centered cell was a row flex box, which sizes its children to fit; it is a
  column one now, so children stretch as they do in any other cell.
  (HAB-879)
- Density (compact/standard/comfortable) is now locked to compact on phones again, and the density
  toggle in `SettingsPanel` is hidden there — restoring behaviour introduced in
  HAB-605 and lost when `SettingsDrawer`
  was replaced by `SettingsPanel` during the layout refactor. `useAdminSettings` now exposes a
  `densitySupported` flag (a device/pointer media query, unchanged from the original) that
  `SettingsPanel` uses to hide the toggle and that gates which body class it applies for the
  `RaDatagrid` padding — the stored preference itself is left untouched and simply stops being
  applied until the device supports it again.
  (HAB-720)
- `DraggableImagePanel` (used by `SchemaImages`) could drop an image tile one slot short of the
  tile it was dragged onto — e.g. dragging to the bottom-right corner of the grid could land it in
  the bottom-left slot instead. The drop index was tallied incrementally during the drag and could
  desync from the DOM order the user actually saw whenever the pointer lingered over the final
  target tile for more than one move event; it's now read directly off the DOM at drop time.
  (HAB-882)
- Reordering columns in `SelectColumnsButton`'s panel, reordering rows via `DraggableDatagridRow`
  (`enableDnd`/`onDropRow`) and reordering image tiles via `DraggableImagePanel` (used by
  `SchemaImages`) now work on touch input (real mobile browsers and touch-emulated DevTools), not
  just mouse. All three drove the reorder off the HTML5 Drag and Drop API (`draggable` +
  `dragstart`/`drag`/`dragend`), which the spec never wires up to touch input — dragging was
  completely inert on a phone. They now run on `react-draggable`'s `DraggableCore` (the same
  mouse/touch-unified mechanism `DashboardGrid`'s `react-grid-layout` already used for widget
  dragging), keeping the existing `elementFromPoint`-driven reorder logic and only swapping the
  event source. (HAB-882)
- `PanelHeader` and `SectionHeader` no longer let a taller header action (e.g. a labelled button
  rather than an icon button) overflow the header row. Their actions slot reserved a fixed
  `height: 32px` line box, sized for the icon buttons it was designed around; anything taller —
  such as a box's `medium` toolbar buttons — simply overflowed that fixed box instead of growing
  it. The slot now uses `minHeight` instead, so it still holds a compact icon-only row to 32px but
  grows to fit whatever taller control is actually placed there.
  (HAB-884)
- `CustomDialogTitle`'s `actions` no longer sit flush against the header's own bottom edge when
  taller than the title line (e.g. a button beside a short single-line record title). The theme
  zeroes `DialogTitle`'s own `padding-bottom` and leans on the following `DialogContent`'s
  `padding-top` for the gap below instead — fine for plain title text, but `actions` are
  top-aligned against that same zero, so a taller control had normal breathing room above it and
  none of its own below. The header now adds back a small `padding-bottom` whenever it renders
  `actions` (or a `divider`) — as `&.MuiDialogTitle-root`, matching the (0,2,0) specificity of the
  theme's own `'& .MuiDialogTitle-root'` override (nested inside `MuiDialog`'s `styleOverrides`),
  since a plain `sx` padding here is only ever a single class and so lost that fight outright.
  (HAB-884)
- `RecordRepresentationChip` (the chip a `ReferenceField` / `ReferenceArrayField` renders for a
  linked record) no longer clips flush at its bounding box when the represented text is too long
  to fit. Two compounding issues: it relied solely on its `EllipsisWithTitle` wrapper's
  `overflow: hidden` to cap its width, but that only truncates plain inline text — a `Chip` is a
  flex box, so the wrapper instead hard-clipped it mid-shape, at whatever width it happened to
  overflow to, with no ellipsis and no breathing room; and outside a collection column its cap
  defaulted to a fixed 200px, too generous to actually constrain a value cell narrower than that
  (a stacked property row on a phone). The chip is now also capped directly (so MUI's own
  `.MuiChip-label` truncation takes over and it keeps its rounded shape, padding and icon), and the
  default cap is `100%` of its actual container instead of a fixed number, so it always tracks the
  real available width at any viewport size.
  (HAB-709)
  (HAB-709)
- Fixed dead Controls panels and misleading "Show code" snippets across `design/atoms/**`
  Storybook stories. Setting `component` on a story auto-infers a full argTypes table from that
  component's props even when the story's `render` never reads `args`, so Controls did nothing;
  and a `render` that returns a local demo/shell wrapper made "Show code" print that wrapper's tag
  instead of real usage. `Tabs`/`Backdrop` now have a genuinely args-driven `Playground`; `Table`'s
  unavoidable pagination-state wrapper overrides `parameters.docs.source.code` with the real usage
  snippet instead.
- Fixed Storybook's "Show code" printing `<React.ForwardRef>` for almost every MUI component on any
  story with a custom `render` — `.storybook/preview.ts` now overrides the source serializer's
  display-name resolver (`parameters.jsx.displayName`), which otherwise gives up before checking
  the inner function name a `React.forwardRef` component's compiled source already carries. Also
  fixed several other `design/atoms/**` stories found during this pass: `Autocomplete`'s `multiple`
  control (toggling it after a value was picked crashed the story — an uncontrolled `Autocomplete`
  doesn't expect that shape to change under it), `Radio`'s `defaultChecked` control (looked
  unresponsive — a `default*` prop is read once, on mount), `Button`'s `iconOnly` Playground
  (didn't swap the text label for the icon), `Divider`'s `flexItem`/vertical orientation (missing
  description, and the Playground's container wasn't a flex row so a vertical divider had nothing
  to stretch into), `Scrollbar`'s `fillContent` (demo content already overflowed, so there was
  nothing to visibly fill), and `SocialIcon`'s `color` control (was free text; it's the same fixed
  `SvgIcon` palette as every other control here).
- "Show code" no longer shows on Showcase render-matrices in `design/atoms/**` (`Colors`, `Sizes`,
  `Variants`, …), since it can only ever serialize the helper wiring those stories are built on
  (`VariantGrid`, `Showcase`, …), never real component usage — every such story now sets
  `parameters.docs.canvas.sourceState: 'none'`; `Playground` is unaffected.
- The autodocs page no longer lists `Playground` a second time under "Stories" — a static,
  non-interactive echo of the same story already shown live (with a working Controls panel) at the
  top. `.storybook/DocsPage.tsx` is Storybook's default `DocsPage` template with `<Stories
  includePrimary={false} />` in place of `<Stories />`, wired in via `parameters.docs.page`.

- **A record chip offered the wrong tooltip when it fell back to the edit view** — with `link: true`
  on a resource that has no show view, the chip opened `edit` but read the *requested* `link` for its
  tooltip, so it promised "Show". The tooltip now reads the resolved `viewType` and names the view
  that actually opens. (HAB-843)
- **A dialog opened from a datagrid row triggered row activation** — clicking Confirm (or even
  Cancel) in the confirm dialog of an action rendered as a list column both ran the action and
  navigated away, as if the row itself had been clicked. The dialog's DOM is portaled to
  `document.body`, but React bubbles synthetic events along the JSX tree, so the click reached the
  row's `onClick`. `CustomDialog` now contains click and double-click at the dialog boundary, which
  fixes it for every dialog built on it — the confirm dialog, `ViewDialog` and `useDialog` alike —
  not just for the field action that surfaced it. `mousedown` is deliberately still let through, so
  a row-hint tooltip can still close itself. (HAB-856)

- **A relation field wrote its label onto the DOM.** React Admin's `ReferenceFieldView` spreads
  every prop it does not consume onto its root `<span>`, and `label` is not one it consumes — so a
  reference field rendered inside a box that owns the label (a detail `PropertyItem` row, which
  passes `label={false}`) produced a React warning, and one rendered with a label element wrote
  `label="[object Object]"` into the markup. The wrapper drops the prop before React Admin sees it;
  the enclosing layout still reads it off the element, so no label disappears.
  (HAB-856)

- **Broken-image glyph shown for a dead image URL** in `AvatarField`, `NotificationsPanel`'s
  notification avatar, `WorkspacesPopover`'s workspace logo, `FlagIcon`, `ImagePanel` (and its
  `SchemaImages` gallery/lightbox use), and the admin `ImageField` (thumbnail and lightbox). Each
  now catches the `<img>` load failure and swaps in a fallback icon tile sized to the same
  footprint, matching the pattern already used by `FileImagePreview` and `ObjectHero`. `ImageField`
  no longer delegates its thumbnail to React Admin's own `ImageField` (which has no such fallback)
  — `sx` now sizes the thumbnail directly instead of through an `'& img'` selector.
- **`NotificationItem`'s broken-avatar icon rendering in the same near-invisible color as its
  background** — MUI `Avatar` applies its `colorDefault` styling (a palette-based `color`) whenever
  the image fails to load, not only when no `src` is given at all, silently overriding the icon's
  inherited color. The `Avatar` now sets an explicit `color` alongside its `backgroundColor`.
- **Tabs of the previous view left behind in the URL after a show ↔ edit switch** — the hash is
  carried across that switch on purpose, so the record's open tab survives it, but entries
  addressing a tab box the arrived-at view does not have were carried over too and nothing ever
  removed them: a tab box only ever repairs entries under its own path. They stayed in the address
  bar and piled up with every further switch. Every tab box now claims its path while it is
  mounted (through `useTabBox`), and `TabsLocationProvider` sweeps the unclaimed tabs once, in the
  frame after the view it belongs to was painted — late enough for the initial render to have
  settled, so a box mounted by another box's effect still counts. It is one sweep per view, so a
  tab box unmounting later — an outer tab being switched, say — never takes its tabs with it. A
  hand-built tabbed layout outside a schema view is covered by the same mechanism.
  (HAB-493)

- Resize (`image.resizeWidth`) and crop (`image.cropAspectRatio`) are applied to every uploaded
  image, not only to the ones small enough to be inlined. The modifier used to run inside the
  base64 branch of `uploadFile`, while the base64-vs-chunked decision was made from the **raw**
  `file.size` before it — so a photo past `upload.threshold` was streamed to S3/tus in its original
  resolution and the resize was dropped. It now runs when the file is stored into the field, ahead
  of every decision that depends on the file, and both paths upload the same transformed bytes.
  Affects `UploadInput` and `SchemaUploadImagesButton` alike. Not a regression: the behaviour dates
  back to the original `processFileUpload`. (HAB-754)
- `resizeImage` and `cropImage` reject when the browser cannot decode the image. They only ever
  installed an `onload` handler, so an undecodable file left the promise pending forever and the
  upload sat there with no error. (HAB-754)

- The header's view-action toolbar (`SchemaViewToolbarActions`, portaled into the layout header via
  `HeaderActions`) no longer pushes the whole action row onto its own line below the nav trigger on
  narrow phones (e.g. iPhone SE). The header row wraps as whole flex items, not individual icons, so
  once the nav trigger, the toolbar's one inline button and the enabled top-bar icons (search,
  notifications, account, …) together exceeded the viewport width, the entire actions block dropped
  to a second line instead of the intended trailing breadcrumbs row. Below `sm` the toolbar's
  `maxVisibleButtons` now collapses to `0` (was `1`) and `SchemaButtons` gained a `minVisibleButtons`
  prop (passed as `0`) so `OverflowToolbar`'s default one-button floor doesn't override it — every
  action now collapses into the `⋮` menu on phone-width screens, freeing enough width to keep the nav
  trigger and top-bar icons on one line, with only the breadcrumbs wrapping below it. A lone action
  still renders inline (`useOverflowCount`'s "would save nothing" guard), since hiding it behind an
  icon of the same width buys back no space.
  (HAB-887)
- `SchemaImages` tiles no longer render tiny on narrow viewports with their per-row actions
  clipped. The grid item kept a fixed `size={4}` (3 tiles per row) at every breakpoint and the
  default per-tile `SchemaButtons` had no inline-button cap, so on a phone-width screen a tile with
  two or three actions overflowed past the card edge. The item now sizes `{xs: 6, sm: 4}` (2 tiles
  per row below `sm`) and the default actions cap `maxVisibleButtons` to `{xs: 2, sm: 3}`,
  collapsing the surplus into the `⋮` menu instead of overflowing.
  (HAB-887)
- `useOverflowCount` (and therefore `ButtonsStack`, `OverflowToolbar` and `SchemaButtons`) no
  longer collapses an icon-only row into the `⋮` menu when doing so hides only a single item. On an
  icon-only row every control is the same width as the trigger, so tucking one away behind it buys
  back no space at all — it only cost a click and hid a control. It still collapses as soon as
  hiding two or more items is an actual saving. Labeled toolbars are unaffected, since a hidden
  label can be wider than the trigger it collapses into. Combined with the tighter
  `maxVisibleButtons` above, a normal phone-width tile with 2-3 actions now shows them all inline
  instead of tucking one behind the `⋮` for no reason.
  (HAB-887)
  - **The breadcrumb trail had nowhere to go below `sm`** — the header row had no space left for the
  nav trigger, the trail and the action icons together. `DashboardLayout` now wraps the breadcrumbs
  onto their own full-width row (`order: 9999`, `flexBasis: '100%'`) instead of squeezing all three
  onto one line; `HeaderSection` switched its fixed `height` to `min-height` so the toolbar can grow
  to fit that wrapped row, and floors its centered `centerArea` at the intended header height so
  nothing shifts once the first line no longer determines it. `PortalBreadcrumbsOutlet`'s crumb list
  gained a `min-width: 0` fix, since as a flex item it could not shrink below its own non-wrapping
  content either, and now scrolls horizontally, scrollbar hidden, once the trail
  outgrows the row. `MAX_BREADCRUMB_WIDTH.xs` moved from 100 to 160, since a crumb on its own
  wrapped row typically has more room than it used to sharing the row with the nav trigger and
  action icons.
  (HAB-887)
- `FormArrayInput` (and any other `FormTable` in its default inline layout) no longer squeezes its
  column inputs into unreadably small cells on a narrow screen or a narrow dialog — each `flex: 1`
  column had `minWidth: 0`, so e.g. a checkbox column shrank until it no longer fit its own control
  and sat flush against the next column with no gap. A row now falls back to stacking its cells
  vertically once it can no longer give every column a reasonable minimum width, keeping each
  cell's own label (it is still the same inline cell, just arranged in a column) rather than
  reusing `FormTable`'s explicit `inline={false}` presentation — that one wraps each column in a
  labelled `PropertyItem` instead, for cells (a bare checkbox, say) that carry no label of their
  own, and would otherwise double up with a cell that does. `FormTableColumn.render` gains a third
  `{stacked}` argument so a column can tell which of the two it is in — `true` only for the
  `PropertyItem` case — and both built-in columns (`FormArrayInput`, `SchemaChoicesFormIterator`)
  use it to suppress their own label exactly then.
  (HAB-890)
- `AvatarField` turned into an ellipse in narrow layouts, such as the update-identity dialog on
  mobile. It set an explicit pixel `width` and `height`, so once a flex ancestor shrank the
  available width below the fixed `size`, the box's width shrank with it while the height stayed
  put. `height` is now driven by `aspect-ratio: 1 / 1` off the (possibly shrunk) width, and
  `maxWidth: '100%'` guards non-flex containers too, so the avatar stays circular at any size.
  (HAB-888)
- **A `Tabs` strip (or any other non-wrapping content) inside `Create`/`Edit`/`Show` kept the whole
  view from narrowing below its own content width on small screens**, instead of scrolling itself.
  React Admin wraps view content in `.Ra{View}-main` (a flex row, `min-width: 0`) around
  `.Ra{View}-card` (a plain `Card`, `display: block`); as a flex item the card defaults to
  `min-width: auto`, so it could never shrink below a non-wrapping child's min-content width.
  `raDefaults.ts` now sets `min-width: 0` on `.Ra{View}-card` for `RaCreate`/`RaEdit`/`RaShow`. For
  this to reach a project's own theme, `BaseAdmin`/`SchemaAdmin` now always run `withRaDefaults` —
  `lightTheme`/`darkTheme` previously defaulted to `withRaDefaults(...)` only when the prop was left
  unset, so a project supplying its own theme silently skipped the RA defaults entirely.
  `withRaDefaults` also merges the caller's `components` on top of the defaults now instead of
  underneath, so a project's own `RaShow`/`RaTextInput`/… overrides win again instead of being
  clobbered by these defaults on every render.
  (HAB-888)
  - `RecordRepresentationChip` (the chip a `ReferenceField` / `ReferenceArrayField` renders for a
  linked record) no longer clips flush at its bounding box when the represented text is too long
  to fit. Two compounding issues: it relied solely on its `EllipsisWithTitle` wrapper's
  `overflow: hidden` to cap its width, but that only truncates plain inline text — a `Chip` is a
  flex box, so the wrapper instead hard-clipped it mid-shape, at whatever width it happened to
  overflow to, with no ellipsis and no breathing room; and outside a collection column its cap
  defaulted to a fixed 200px, too generous to actually constrain a value cell narrower than that
  (a stacked property row on a phone). The chip is now also capped directly (so MUI's own
  `.MuiChip-label` truncation takes over and it keeps its rounded shape, padding and icon), and the
  default cap is `100%` of its actual container instead of a fixed number, so it always tracks the
  real available width at any viewport size.
  (HAB-888)
- **`SchemaChoicesArrayBox` saved its own row bookkeeping with the record** — ticking a choice
  appended the rendered row object as the new item, so `id`, `_index`, `_isGenerated`,
  `_isChoiceRow` (and now `_itemId`) travelled into the form value and out again in the payload,
  where the backend saw fields its serializer never declared. The appended item is now built field
  by field from the item schema, carrying only what the schema names.
  (HAB-837)
- **`SchemaChoicesArrayBox`'s row count counted the checklist, not the record** — the box always
  renders a row per enum value, so an empty record still read "5 items". The footer now counts the
  items the record actually holds: ticked choices plus free rows.
  (HAB-837)
- **A delete button that did nothing** on the unticked rows of `SchemaChoicesArrayBox` — every row
  of the checklist offered one, but an unticked choice is a placeholder with no array item behind
  it, so clicking it was a no-op. `FormTable` gained `canRemoveRow`, a per-row predicate: a row it
  rejects keeps the action's track — the button stays rendered, inert and invisible — so the
  columns of a non-removable row still line up with its neighbours'. The choices box withholds the
  action from unticked rows; unticking a choice is what removes it, and free rows are unaffected.
  (HAB-837)
- **A value jumped from a deleted array row onto its neighbour, and was then saved** — removing a
  row from any array input (`FormArrayInput`, and so `SchemaArrayBox` / `SchemaChoicesArrayBox`)
  left the form's *default* values on their pre-removal indexes. Paths inside a field array are
  positional, so `<array>.<i>.<field>` in the defaults kept describing the row that used to sit at
  that index; react-hook-form resolves an unset value as
  `get(values, name, get(defaultValues, name))`, so the first optional field a user had left empty
  was silently back-filled from the deleted row and submitted with the form. Deleting the row above
  a parcel with no note handed it the note of the deleted one. Removal now re-seeds the defaults
  with the same row dropped (`useRemoveArrayItem`), a defaults-only update that leaves the values,
  the dirty state and the errors untouched — the dirty baseline still means "what the record
  carried". The defect predates this package's array inputs: React Admin's own `SimpleFormIterator`
  has it too, since it comes from `useFieldArray.remove` re-indexing everything *except* the
  defaults. `SchemaChoicesFormIterator` additionally keys a row's cells by the array item they are
  bound to, so when a removal swaps which item a fixed choice row renders — one of two rows carrying
  the same choice — the inputs re-read the form instead of showing what they mounted with. The row
  card itself still keys off the choice, so its hover / focus state survives a toggle.
  (HAB-837)
- **`PanelHeader`'s leading icon was smaller with `iconBadge={false}` than with the badge on** —
  the bare-glyph branch rendered the icon at `width={14}` against the badge branch's `width={20}`,
  so toggling `iconBadge` changed the icon's size instead of just its tinted background. Both
  branches now render the icon at the same size.
  (HAB-862)
- **Every field type gave a read-only row a different height** — one detail panel mixed 22px text
  rows, 24px rows and ~26px chip rows, and a relation or enum chip sat at the bottom of its row
  rather than centered against its label, because a chip is inline-level content and therefore
  rides the text baseline of the line box it sits in. `PropertyItem` / `PropertyList` gained a
  `Field` family of `lineHeight` presets to go with the existing `Input` one — `smallField` (28px,
  the tightest height that clears every inline value) and `mediumField` (40px, matching
  `smallInput` so a read panel can line up row-for-row with the form it toggles into). Generated
  show views and `PropertyShowLayout` apply `smallField` by default. It is only a floor: a taller
  value (a textarea, rich text, an image) keeps its own height, and stacked (label-above-value)
  rows are unaffected.
  (HAB-858)
- **Double navigation from a list row to its detail view** — opening a routed (redirect) view could
  push two history entries for a single row click, so "back" had to be pressed twice.
  `SchemaViewActionTrigger`'s open/redirect effect reacted to its own dependencies changing after it
  ran (e.g. the location changing as a result of its own `navigate` call, or React StrictMode's
  dev-only mount/cleanup/mount replay), re-running its `navigate`/`openDialog`/`changeView` decision
  a second time. It now runs exactly once per activation, matching its documented "runs on mount"
  intent. (HAB-866)
- **`ObjectHero`'s avatar showed the browser's broken-image glyph when `image` pointed at a URL
  that failed to load** — the `<img>` had no `onError` handling, so an invalid `image` bypassed the
  `icon` fallback entirely instead of degrading like a missing `image`. The avatar now catches load
  failures and falls back to the `icon` prop, and to a generic broken-image icon when `icon` is
  also absent — matching `FileImagePreview`'s behavior.(HAB-864)
- **A record whose payload carried its own `id` field broke the detail page of a resource keyed by
  something else** — the data provider computed React Admin's `id` from the resource's
  `pkFieldName` but spread the raw record over it, so a payload containing `id` overwrote the
  computed identifier and React Admin rejected the record with "Fetched record's id attribute (2)
  must match the requested 'id' (consumable)". The `pkFieldName` value now wins, falling back to a
  raw `id` only for a partial record that does not carry the primary-key field at all.
  (HAB-772)
- **A read-only value sat at the top of its row instead of beside its label in a form** — a
  `PropertyItem` in a list with `lineHeight` set (every generated edit / create form, where it
  aligns the labels to the input height) reserved that height on the label cell only. A value
  slot shorter than an input — a `readOnly` field rendered among editable ones — therefore stayed
  at the top of the row while its label was centered, about 8px apart. The value cell now reserves
  the same height and centers its content in it. Inputs, and anything else at least as tall as
  `lineHeight`, are unaffected, as are read views (they set no `lineHeight`).
- **Inconsistent icon rendering across the library.** Several components imported an
  `@mui/icons-material` glyph directly instead of going through the design system's `Icon`
  primitive (`AvatarField`, `SearchNotFound`, `FileRowStatus`, `ExpandAllButton`,
  `DatagridRowTooltip`, `FilterButton`, `SavedQueriesButton`, `MfaSelectionStep`, `ErrorPage`,
  `DateRangeInput`, `SchemaUploadImagesButton`, `SchemaMenuButton`, `RecordRepresentationChip`,
  `SchemaReferenceFieldContent`), and the enum/choices icon resolver (`resolveEnumIcon`, used by
  `ChoicesField`/`ChipArrayField`) looked icons up directly from `@mui/icons-material` instead of
  through `Icon`, so a schema-supplied enum icon rendered in a different glyph style (missing the
  `Rounded` variant) than menu and action icons. All of the above now render through
  `<Icon icon={IconType.X} />`; `IconType` gained the glyphs they needed. A new ESLint rule
  (`no-restricted-imports` on `@mui/icons-material/*`, scoped to `src/**`) keeps direct imports
  from being reintroduced outside `MaterialIcon.tsx`.
- **Search highlights covered the whole cell instead of just the matched text** in plain `string`
  and `number`/`integer`/`decimal` datagrid columns — `defaultFieldProvider` rendered them through
  `SchemaTextField`/`SchemaNumberField`, thin schema-layer adapters around the admin `TextField` /
  `NumberField` that mapped `FieldOptions` onto flat props. `SchemaFieldContent` detects a
  self-highlighting field (one that renders its own inline, offset-accurate `<mark>`) by a flag
  stamped on the exact component reference it was given; tagging `TextField`/`NumberField` never
  reached that flag onto the separate `SchemaTextField`/`SchemaNumberField` function objects
  `SchemaFieldContent` actually saw, so it fell back to wrapping the entire rendered value in a
  second, whole-cell highlight on top of theirs. `defaultFieldProvider` now renders `TextField` /
  `NumberField` directly (mapping `FieldOptions` onto their props inline), so `SchemaFieldContent`
  sees the already-tagged component and only the substrings the backend actually matched are
  marked. `SchemaTextField` and `SchemaNumberField` are removed — they were never part of the
  public API.
- **`<a>` nested inside `<a>` in the dashboard marketing footer** — `EluviaLogo` / `HabaricoLogo`
  always rendered as a router link, even with `disableLink`, which only disabled pointer events via
  `sx`. When `MarketingFooter` wrapped such a logo in its own link (`MarketingSlot.logo` combined
  with `MarketingSlot.href`), React logged `validateDOMNesting(...): <a> cannot appear as a
  descendant of <a>`. `disableLink` now renders the logo as a plain `Box` instead of a router link. 
  (HAB-848)
- **`EluviaLogo` / `HabaricoLogo` sizing/centering depending on `disableLink`** — the underlying
  `Box` had no explicit `display`, so it inherited the browser default for whichever element it
  rendered as: `block` for a plain `Box` (`disableLink`), `inline` for the router-link anchor
  (`!disableLink`). An inline anchor ignores `width`/`height` and does not centre via `margin:
  auto`, so `HabaricoLogo`'s `mx: 'auto'` only took visual effect with `disableLink`. Both logos now
  set `display: 'block'` so sizing and centring are consistent regardless of link state. 
  (HAB-848)
- **`EluviaLogo` not self-centering like `HabaricoLogo`** — `HabaricoLogo` has always set `mx:
  'auto'`; `EluviaLogo` never did, despite both documenting the same "sized by its container"
  contract. `EluviaLogo` now also sets `mx: 'auto'`, so both logos centre themselves when their
  container is wider than their own width, independent of the parent layout. 
  (HAB-848)
- **`FormTable`'s (and so `FormArrayInput`'s) inline row delete button off-center against its
  column inputs** — the row centered itself (`alignItems: 'center'`) against each cell's *full*
  rendered height, but a React Admin input reserves an invisible helper/error line beneath itself
  even when empty; centering against that taller cell pushed the delete button visibly below the
  input's own center. `FormTable` now always top-aligns the row, and each row measures the actual
  rendered height of its own controls (any `.MuiInputBase-root`, i.e. virtually every React Admin
  input) so the inline delete button can center against that real height instead — automatically,
  for whatever size the caller's inputs render at, with no configuration needed and no incorrect
  first paint (the row re-measures synchronously before the browser paints, and again via a
  `ResizeObserver` for layout changes a render doesn't cause, e.g. a multiline field growing or an
  error appearing). Cell content the selector doesn't match — fully custom, non-MUI inputs — simply
  falls back to no centering adjustment, i.e. the button top-aligns like the stacked layout already
  does. The stacked (`inline={false}`) layout is itself unchanged — its delete button stays
  top-aligned against the whole row, which is the sensible anchor for a "delete this row" action
  beside several stacked fields.
  (HAB-835)
- **`SchemaChoicesArrayBox` checkboxes not aligned with their row's fields** — its checklist rows
  (enum values, togglable via a checkbox, plus free "other" rows) were hand-built on React Admin's
  raw `SimpleFormIteratorItem`, standing in a hardcoded `Box sx={{width: '38px'}}` for the checkbox
  column on non-choice rows to keep columns lined up — a pixel value that didn't reliably match the
  real checkbox width. `SchemaChoicesFormIterator` now renders through the design `FormTable` (the
  same row-card layout as `FormArrayInput` / `FiltersPicker`), whose checkbox column returns `null`
  on non-choice rows instead — `FormTable` reserves that column's track regardless, so rows stay
  aligned without a pixel guess. Also gains the standard row count / "Add" / "Clear list" footer.
  Every cell in the row (the checkbox, the choice label, and the other field(s)) could still sit
  visibly off the row's real center whenever a sibling field carried `helpText` or a validation
  error — the row top-aligns cells by design (see the `FormTable` entry below), so a compact cell
  next to a taller field just stayed pinned to the top instead of level with it. `FormTableColumn`
  gained an `align: 'center'` option, reusing the same real-control-height measurement the row's own
  delete button already centers against (excluding a taller sibling's invisible/visible helper-text
  reserve, which stays exactly where it was, "pushed" below the shared center line) — every column in
  the row now opts into it. A read-only choice cell (the "Alarm"-style chip) still landed a couple of
  px off that shared center even with `align: 'center'` applied, because `SchemaReadonlyInputContent`'s
  `FieldRoot` — the shared read-only rendering wrapper for every field in the app, not just this box —
  laid its content out via plain text-baseline rules instead of true centering; `FieldRoot` now
  flex-centers its content, which also straightens out this same baseline skew for any other read-only
  field display. Separately, a checked choice row's `id` used to switch between a synthetic placeholder
  and the underlying field's real id on every check/uncheck; since `FormTable` keys rows by `id`, this
  made React remount the row's DOM node on every toggle, dropping its hover/focus highlight for a frame
  (a visible flash) — `id` is now stable per enum choice regardless of checked state. Chasing the
  centering down to sub-pixel level also surfaced a genuine, unrelated one: the app's themed
  `MuiCheckbox` unchecked icon (`design/theme/core/components/Checkbox.tsx`) was never actually
  centered in its own viewBox — its path sits ~0.9/0.32 units right/down of true center, unlike the
  checked icon's path — visible as every checkbox in the app being ~0.75px right / 0.26px down when
  unchecked vs. checked. Nudged back with a `transform` on the path (left the original artwork itself
  untouched) rather than only in this one box, since it's a themed default affecting every `Checkbox`
  in the app.
  (HAB-837)
- **`SchemaRecordLink`/`RecordRepresentationChip` with `linkMode="sidepanel"` never actually docked
  into the side panel** — it silently fell back to a plain redirect, unlike
  `SchemaViewActionTrigger`, which already docks correctly. `useSchemaRecordLink` now docks via the same
  `useSidePanelController`, falling back to the dialog only when no panel controller is mounted.
  (HAB-788)
- Relation fields with `targetSource` (showing a field of the referenced record) rendered a
  duplicate label in Show views outside a datagrid — once from the surrounding `PropertyItem`,
  once from the reference field's own internal `Labeled` wrap, which didn't know a label was
  already shown. `SchemaField` now forwards `showLabel={false}` down as `label={false}`, and
  `SchemaResourceReferenceField` skips its own `Labeled` wrap when the label is explicitly `false`.
  (HAB-833)
- **`SchemaTabBox` snapping back to the first tab right after switching** — most noticeable on tabs
  whose content fetches data on mount (e.g. a `SchemaListBox` tab such as "Prices" or "History"),
  which triggers an extra render shortly after the switch. The active tab used to be derived from
  `useLocation().hash`, which can lag a render behind the real hash; if that extra render landed
  inside the lag window, the tab-reset effect saw no active tab and immediately reset to the first
  one, discarding the tab that had just been selected. `useTabsLocation` now reads a plain
  synchronous store (see `TabsLocationProvider` / `LocalTabsLocationProvider` above) instead of the
  router's location, so there is no lag window left for the effect to race against.
- **A dialog or side panel's tab box could collide with a tab box on the page behind it** — both
  used to share the page's `window.location.hash`, keyed only by box name with no namespacing per
  presentation context, so a dialog whose tab box happened to share a name with the page's (or, in
  practice, *any* dialog with a tab box, since `useTabsLocation`'s internal dedup read the real
  browser hash rather than the router's own state) could silently overwrite which tab was active on
  the page once closed. Fixed by the same store change: `ViewDialog` / `ViewSidePanel` now get an
  isolated `LocalTabsLocationProvider` instead of sharing the page's URL-backed one.
- **A view opened from a row action nested inside a box inherited that box's `parentBoxName`** — e.g.
  a list box's own "edit" row action, so every `getBoxName()` call the opened view made (form group
  names, tab keys, ...) was prefixed with a path belonging to a completely unrelated resource tree.
  `ResetBoxProvider` (already responsible for resetting every other box-layout context at a
  dialog/side-panel/page boundary) now also resets `ParentBoxContext`.
- **`ChoicesArrayInput` fieldset border broken with no `label`** — react-admin's `SelectArrayInput`
  always hands MUI's outlined input a `<FieldTitle>` element as its `label`, even when the label
  renders to nothing. The notched outline still gives that (empty) label's `<span>` 5px of
  horizontal padding on each side, and once the select has a value the outline "notches" open to
  that width, leaving a gap in the top border with nothing visible in it. That padding is now
  zeroed via `sx` whenever no `label` is passed. (HAB-838)
- **`PhoneNumberInput` fieldset border broken with `label=""`** — the guard added to skip
  `FieldTitle` in bare mode (`FormArrayInput`'s stacked layout) only checked `label === false`, not
  `label === ''`; passing an empty string still built a truthy `<FieldTitle>` element and reproduced
  the same notched-outline legend gap as `ChoicesArrayInput` above. Now guards both. (HAB-838)
- **`DateRangeInput` fieldset border broken in bare mode** — passed `label` straight through to MUI's
  `TextField` with no guard at all; `FormArrayInput`'s stacked layout sets `label={false}` on every
  child, and MUI's notched outline treats `false`/`''` as a real (empty) label just like `null`/a
  rendered-empty element. The field is also always `readOnly` with a non-empty formatted value, so
  it is permanently in the "notched" state — the gap was not intermittent. `label` is now coerced to
  `undefined` for `false`/`''` before reaching the `TextField`. (HAB-838)
- **Account settings name change not reflected until page reload** — updating the first or last
  name via the account settings dialog in the header updated the auth provider's own store, but
  never refetched react-admin's `useGetIdentity()` cache that the header reads from, so the
  displayed name stayed stale until a full page refresh. `UpdateIdentityForm` now refetches the
  identity after a successful update, the same pattern already used on impersonation login. (HAB-815)
- **`FileImagePreview` showing raw, overflowing alt text for a broken upload thumbnail** — when a
  preview `src` failed to load (expired/broken URL), the bare `<img>` fell back to the browser's
  default alt-text rendering inside the 40×48 file-row box, which cut the text off and left it
  vertically unaligned. It now catches the `onError` event and swaps to a centered `BrokenImage`
  icon tile, matching the muted look of its `FileTypePreview` sibling.
- **`SidePanel` scrollbar flickering in Firefox while the pointer sits over it, even with no actual
  overflow** — SimpleBar decides whether its scroll box has a definite height via a float/percentage
  probe element rather than reading the resolved flex layout directly, and the panel's `Scrollbar`
  was sized purely by `flexGrow` several flex levels removed from any ancestor with an explicit
  `height`. That probe flip-flopped between "definite" and "auto" from one layout pass to the next
  in Firefox (stable in Chromium), toggling SimpleBar's content wrapper between `height: auto`
  (collapsed to content) and `height: 100%` (filled). Because SimpleBar's `recalculate()` reads the
  content's `scrollHeight` *before* writing that style, a flip compared a stale `scrollHeight`
  against the new wrapper height, spuriously flagging overflow for one pass and flashing the
  scrollbar. `SidePanel`'s `Scrollbar` now also sets an explicit `height: '100%'`, giving the probe
  an unambiguous definite basis so it never flips. (HAB-832)
- **Action buttons falling back to a generic icon instead of their own** — a regression introduced
  in `6.8.0-beta.1` (HAB-685), so no stable release is affected. `SchemaButton` gained a
  `?? <Icon icon={IconType.Task} />` fallback for actions the backend sends without an `icon`. The
  lookup in front of it (`DEFAULT_ICONS[schema.type]`, a map keyed by *view* type — `edit`, `show`,
  `create`, `list`, `action` — indexed by *action* type — `view`, `link`, `resource`, …) never
  matches, and until then that miss was exactly right: `icon` stayed `undefined` and each concrete
  button applied its own default. The fallback turned it into a concrete element that overrode all
  of them — the edit/show/create icons of `SchemaViewButton`, the link icon of `LinkButton`, the
  check icon of `SaveButton`. `SchemaButton` now forwards only the icon the schema declares, and
  the dead lookup is gone rather than left as a silent no-op. `ResourceButton` gained the generic
  icon as its own default, keeping the glyph HAB-685 gave custom resource actions, and
  `ExportButton` no longer discards an icon coming from the schema. (HAB-825)
- **`CzechIdCardNumberInput` rejecting valid ID card numbers** — the input masked typing down to
  eight digits `0`–`8`, so none of the real Czech ID document formats could be entered in full, and
  it applied no validation at all. It now accepts up to ten alphanumeric characters and validates
  the value against the official formats (nine digits with a non-zero first digit, six digits, or
  six digits with a two-letter series optionally followed by two digits, prepended or appended),
  mirroring `CzechIdCardNumberValidator` on the backend. Any `validate` passed to the input is
  preserved and runs first.
  (HAB-551)
- **Record-scoped menu items losing their highlight** — a menu item bound to a `show` view of a
  fixed record stayed unhighlighted on the other views of the same record. React Admin puts the edit
  view at the record base path `/{resource}/{id}`, one level *above* the show view, so
  prefix-matching the link target never matched it. Such items are now matched against the record
  base path and stay active on the record's show, edit and action views alike. Adds the optional
  `LayoutMenuItem.activePath` field, which `useSchemaMenu` fills in and `useActiveExpanded` matches
  on (falling back to `href`); parent groups now also honour a child's `activePath` when deciding
  whether to expand. (HAB-792)
- **Data outside the main views staying in the previous language** — the locale-aware refetch
  shipped in 6.7.0 only covered the list / show / edit / create / action controllers, so list and
  gallery boxes, the table widget, reference fields and inputs, record representations, the delete
  button, service search, aggregates and imperative `callAction` calls kept serving per-record
  `meta` (`repr`, `tags`, row action labels) in the language they were first fetched in. They now
  thread the active locale through their query keys and request meta as well.
  (HAB-792,
  HAB-782)
- **`PanelGrid` items stretching to fill an uneven last row** — a lone item wrapping onto its own
  row (e.g. 3 cells at `md=6`, 2 fit per row) stretched to fill the entire row width instead of
  keeping the same width as its siblings above. This broke column alignment in `SchemaGridBox` /
  `SchemaBoxChildren` layouts: a field group's label/value gap widened whenever it ended up alone
  on its row, since `PropertyItem`'s label column is a percentage of its own (now wider) container.
  `PanelGridItem` no longer forces `flex-grow: 1` horizontally, so every item keeps its
  `size`-computed width regardless of how many siblings share its row.
  (HAB-805)
- **`SchemaGridBox` label/value columns misaligned across differently-sized cells** — a grid
  mixing explicit `gridItem` spans (e.g. two half-width cells beside one full-width cell) fell out
  of alignment even with the fix above: `PropertyItem`'s label width is a percentage of its own
  cell, so a wider cell's label grew proportionally wider too, shifting its value column out of
  line with its narrower siblings. `SchemaGridBox` now computes each cell's actual rendered width —
  span, its own card padding, and the grid's column gap — against the row's narrowest cell and
  scales every other cell's `labelWidth` to match, so values line up regardless of how the row's
  spans are mixed. (HAB-805)
- **`SchemaGridBox` ignoring `schema.card` / `schema.label`** — unlike every other box type, the
  grid box's card decision only checked `collapsible` and toolbar actions, so setting `card: true`
  (or providing a `label` with no `collapsible`/toolbar actions) had no effect and silently
  rendered without card chrome (and, for the label-only case, without the label at all). Now
  folds in `schema.label` and `schema.card`, matching `SchemaSimpleBox` / `SchemaObjectBox` / etc. (HAB-803)
- **`SavedQueriesButton` layout shift** — the button was unmounted entirely when there were no
  active filters and no saved queries, shifting the surrounding toolbar as filters were added and
  removed. It now stays mounted and is disabled instead, so its width is always reserved. (HAB-804)
- **`NumberInput` invalid input leaking `"NaN"`** — typing a non-numeric value into a number input
  (including number filters) parsed to the literal string `"NaN"` instead of clearing the field,
  which then landed in the filter/URL as `"NaN"`. `parse` now returns `null` when the input isn't a
  valid number, matching how `format` already treats it. (HAB-801)
- **`Scrollbar` shipping unstyled** — the component relied on `simplebar-react`'s CSS being pulled
  in through `global.css`, which is only imported by Storybook and was never part of the published
  package, so a consuming project got a scrollbar with no track/thumb styling unless it happened to
  import the CSS itself. `Scrollbar.tsx` now imports `simplebar-react/dist/simplebar.min.css`
  directly, the same pattern `DashboardGrid` already uses for `react-grid-layout`'s stylesheet.
  (HAB-853)
- **Row action dialogs leaking interactions into the underlying datagrid row** — a dialog opened from
  a row action (edit/show/delete) is a React descendant of the row's actions cell, but MUI mounts it
  on `document.body`. React bubbles synthetic events along the JSX tree rather than the DOM tree, so
  the dialog's events kept reaching the row underneath it — two symptoms, one cause. *Clicks* inside
  the dialog re-triggered row activation via the row's `onClick` / the table's `onDoubleClick`;
  `AdminDatagrid` now stops `click`/`doubleclick` propagation at the row-actions cell boundary, scoped
  to the datagrid, so the button and dialog components stay context-agnostic. *Hovering a panel inside
  the open dialog* raised the row's own "click / double-click here" hint `Tooltip` on top of it (the
  tooltip layer sits above the modal one): `useDatagridRowTooltip` decided whether to open from the
  shape of the event target (`button` / `a` / `[role=button]`), and a dialog panel is a plain `div`, so
  it read as row content. It now asks the DOM tree instead — the hint opens only when the target really
  sits inside the row (`currentTarget.contains`, which a portaled dialog fails by construction) and
  outside the actions cell (matched structurally via `ACTIONS_COLUMN_CLASS`, which also covers the gaps
  between buttons, the `span` wrappers around disabled ones and the overflow menu). The hint
  additionally closes on `mousedown`, because a click moves no pointer and no further `mouseover`
  arrives to re-evaluate the target. The superseded `INTERACTIVE_SELECTORS` constant is removed.
  (HAB-839)

### Security

- Record ids and record-schema query params are now percent-encoded before being placed in a
  request URL. `getOne`, `update`, `delete` and `callAction` interpolated the record id straight
  into the path, and `getRecordSchema` joined its `params` into a query string by hand, so a value
  containing `/`, `&`, `#` or similar could change the request's route or inject extra query
  params. `getRecordSchema` now builds its query string with `query-string`, already used
  elsewhere in this package.
  (HAB-919)
- A link is opened only when its URL is `http:`, `https:` or relative, and always with
  `noopener,noreferrer`. A link action templates record values into its URL (`%{data.website}`),
  so a `javascript:` URL saved by anyone with write access to that field used to run in the
  admin's session — through `LinkButton` on click, and through `LinkActionTrigger` with no click
  at all, since it fires from an effect. The same check now guards `openByMode` (ctrl/shift-click
  navigation) and the `url` field, which renders an unsafe value as plain text instead of a link.
  Validation goes through the platform URL parser rather than a pattern match, so the
  `javascript:` variants that hide an embedded tab or newline inside the scheme are caught too.
  **Potentially breaking:** a schema shipping a `mailto:` or `tel:` link action stops opening it —
  use a `string` field with format `email` or `phone` for a contact instead.
  (HAB-908)
- **BREAKING:** `createConditionFunction` (which evaluates the schema's `showQuery` /
  `requiredQuery` conditions) no longer compiles the expression with `new Function` — the previous
  character-class guard could be bypassed to run arbitrary JavaScript in the admin's session (e.g.
  `a == Function("…")()`), finding 5 of the
  HAB-894 security audit. Expressions
  are now parsed with `jsep` (new dependency) and interpreted over the AST, so no schema text is
  ever executed and `unsafe-eval` is no longer needed in the CSP. The supported grammar is
  identifiers with dot paths, string / number / boolean / `null` / `undefined` literals,
  `==` `!=` `===` `!==` `<` `<=` `>` `>=` comparisons, `&&` / `||` / `!` and parentheses; string
  literals are no longer restricted to ASCII, and relational operators (previously rejected by the
  guard) now work. Anything outside the grammar — function calls, arithmetic, indexing,
  `__proto__` / `constructor` / `prototype` path segments — throws `Invalid expression.` at
  creation, where such expressions previously either ran as JavaScript or silently evaluated to
  `false`. The returned function now always returns a `boolean`.
  (HAB-901)
- A schema `regex` validation rule is no longer matched against values longer than 1000 characters;
  those are left to the backend, which enforces the rule anyway. Regex matching backtracks
  super-linearly on a long input for patterns as ordinary as `^a*a*$` (38 ms at 8 000 characters,
  0.6 s at 32 000), and validation re-runs on every keystroke. An ambiguous pattern can still
  occupy the tab on a short value — refusing such patterns was measured against three checkers and
  dropped, because every one of them also refused ordinary patterns like `^\d+(\.\d+)?$` or
  `^\w+( \w+)*$`, which would have silently disabled their client-side check. The documentation
  now states what makes a pattern ambiguous. Found in the
  HAB-894 security audit.
  (HAB-920)
- Fixed the `js-yaml`, `svgo`, `colord` and `decode-uri-component` transitive vulnerabilities
  found in the HAB-894 security
  audit (`npm audit fix` plus `overrides` for `decode-uri-component` ≥0.5.0, which was not
  reachable through `audit fix` alone). Also corrected the `lodash` dependency, which was pinned
  to the non-existent `^4.18.1` on npm; it now resolves to `^4.17.21`.
  (HAB-896)
- `'sms'` is now a recognized `MfaMethod` alongside `'email'`, so a backend can offer SMS as a
  second-factor verification method and `AuthPage` renders it on the method-selection step.
  (HAB-883)
- `snakeCaseToCamelCase` no longer lets an API response replace the prototype of the object it
  builds. A key that camel-cased to `__proto__` was stored with a plain assignment, which hits the
  `Object.prototype.__proto__` accessor: instead of adding a key it swapped the result's prototype
  for a server-supplied value, so the converted schema or record silently read back properties it
  did not own — and `_.merge`, which copies inherited keys, turned them into real ones. The key is
  now dropped (`____proto____` was one that reached it), and the conversion reads only the input's
  own properties.
  (HAB-921)

## [6.7.0] — 2026-08-03

This release re-architects the library into a **four-layer design system** and ships a **full
visual redesign**. `src/` is now split into `foundation → design → admin → schema`, with
dependencies flowing strictly downward and enforced in CI by an import-boundary lint rule
(HAB-668, HAB-685, HAB-758, HAB-759, HAB-687, HAB-690). The whole UI was redesigned on a new MUI
theme and a Storybook-documented design system (HAB-663, HAB-674, HAB-676, HAB-678, HAB-681). Many
public exports were renamed, relocated or removed — see the **BREAKING** entries and **Removed**
below. Public import paths are preserved except where explicitly marked BREAKING.

### Added

- **`SchemaAdmin` `arrangement` slot** — expose the page-arrangement slot (page-width `full` /
  `centered`) as an app-config option, alongside `marketing` / `status`. Pass `{header: true}` to also
  surface the toggle in the app header (in addition to the settings panel), a `tooltip`, or label
  overrides; the layout still supplies the translated labels. Flows through `AdminConfig` →
  `AdminDashboardLayout` → the design layout's `arrangement`. Enabled in the schema-layer story shell.
  (HAB-782)
- **DatagridActions `⋮` more menu** — the datagrid-config toolbar now keeps only the primary actions
  inline (reset column widths, filter drawer / filter button, saved queries) and collapses the
  secondary config actions (column selector, reset sort, reset configuration) into a content-driven
  `⋮` icon-button menu, shown whenever more than one of them is present. New `ra.action.more_actions`
  message key (localized in all locales). (HAB-782)

- **Design system layer (`@design`)** — a new schema-agnostic, presentational layer organised by
  atomic design (`atoms` / `molecules` / `organisms` + `theme` / `hooks` / `contexts` / `layouts`),
  fully documented in Storybook. New components: `Panel` (+ `PanelHeader` / `PanelContent` /
  `PanelFooter`), `Section` (+ header / content / footer), `PanelGrid`, `GhostPanel`,
  `DashboardGrid`, `DataGrid`, `DataTable`, `FormTable`, `PropertyList` / `PropertyItem`, `Gallery`,
  `ObjectHero`, `InspectorPanel`, `SettingsPanel`, `CustomDialog` / `CustomDialogTitle`,
  `ButtonsStack`, `InputLayout`, `TreeSelect`, `UploadArea`, `RichText`, `ImagePanel`,
  `ConfirmDialog` + `useConfirm`, `DragHandle`, `SearchField`, `CloseButton`, `PageWidthToggle`,
  `EllipsisWithTitle`. Panels/tables gained `fullHeight`, `flush` / `paddingSize`, `stripedRows` and
  `density` props. (HAB-663, HAB-674, HAB-675, HAB-676, HAB-678, HAB-680, HAB-681, HAB-685, HAB-687)
- **Admin layer (`@admin`)** — React Admin restyled into the design system (resource-aware but
  schema-agnostic), with its own schema-free entry point and a live Storybook harness. New entry
  points / shells: `BaseAdmin`, `AdminDashboardLayout`, `AdminAuthLayout`; view shells `ListShell`,
  `ShowShell`, `EditShell`, `CreateShell`, `ViewDialog`, `ViewSidePanel`, `ViewContent` /
  `ViewTitle` / `ViewActions` / `ViewToolbar`, `ListSurface`, `PropertyShowLayout` /
  `PropertyFormLayout`. New building blocks: `ActionButton` (+ `ActionButtonWithChoices`),
  `AdminDatagrid`, `FormArrayInput`, `SearchInput`, `DatagridActions`, `SidePanel`. (HAB-668,
  HAB-685, HAB-758, HAB-759)
- **Schema layer barrels wired** — the `@foundation` / `@design` / `@admin` / `@schema` barrels are
  now complete and spread from the package root, giving the public API a single source of truth
  (~200 exports surfaced, none removed). (HAB-687)
- **Box actions** — `bottomActions` and header `toolbarActions` are now supported on every box type;
  list / images boxes gained `list.toolbarActions` and `list.listActions` slots. (HAB-700)
- **Form drafts & navigation guard** — edit / create forms can autosave drafts to localStorage and
  offer to restore them (`draftEnabled`), and can guard navigation away from a dirty form
  (`navigationGuard`); both opt-in on `SchemaAdmin`. (HAB-643, HAB-647)
- **Tab / wizard step status** — step labels colour to show unsaved (warning) / invalid (error)
  state, with an explanatory tooltip. (HAB-646)
- **Datagrid row tooltips** — rows show a hover tooltip describing the click action(s); `Datagrid`
  accepts a `rowTooltip` override. (HAB-649, HAB-651)
- **List actions** — the `list_actions` schema slot renders next to the filter bar, including a new
  `export` action. (HAB-530)
- `dialogWidth` for record-reference modals; long modal titles now wrap. (VD-2726)
- Table widgets gained `showRowActions` and `minW` / `minH` resize bounds. (VD-2736)
- **Overflow toolbar primitive** — a new design-layer `OverflowToolbar` collapses a row of
  *directly rendered* button controls into a `⋮` menu (the counterpart to `ButtonsStack`, which is
  driven by a button-object array). It never inspects the children: the new `useOverflowCount` hook
  resolves how many stay inline (breakpoint-ladder based) and the new `ToolbarSlotContext` tells each
  slot, via context, whether it sits in the menu (→ render as a `menuItem`) and whether inline controls
  go icon-only. The admin `ActionButton` reads that context, so every schema button participates and the
  collapse is reusable beyond `SchemaButtons` — e.g. for page and box header toolbars. `ButtonsStack`
  now shares `useOverflowCount`, so its `maxVisible` also accepts a per-breakpoint map and its `iconOnly`
  a breakpoint. `maxVisible` / `minVisible` count **real buttons only** — the `⋮` trigger is always
  extra, consistently across `OverflowToolbar` and `ButtonsStack` (`maxVisible: 0` collapses every
  button into the menu). The trigger's own presentation (surface / size / label) is grouped under the
  `OverflowToolbar` `more` prop, since it never styled the children. Fully width-aware (container, not
  viewport) responsiveness is tracked in
  HAB-786. (HAB-784)

### Changed

- **Side-panel toolbar actions are compact** — a record's toolbar actions rendered in the docked
  side panel (`presentation === 'panel'`) now render as small icon buttons (`surface="iconButton"`,
  `size="small"`) — including the `⋮` overflow trigger — instead of full medium buttons, to fit the
  narrow panel header. (HAB-782)
- **Density setting now drives more surfaces** — the app-level density setting (compact / standard /
  comfortable) is propagated from the settings store to `SimpleBox` / `PropertyList` and
  `FormArrayInput` / `FormTable`, so schema field groups and editable array boxes track density the
  same way the datagrid already does. (HAB-785)
- **Architecture** — the old top-level per-concern folders (`components/`, `hooks/`, `contexts/`,
  `providers/`, `utils/`, `theme/`, `layouts/`, `overrides/`) and their path aliases were dissolved
  into the four layers; code imports from the single per-layer alias (`@foundation` / `@design` /
  `@admin` / `@schema`). Importing "up" a layer now fails `npm run lint` (the `boundaries` rule).
  (HAB-668, HAB-685, HAB-758, HAB-759, HAB-687, HAB-690)
- **Visual redesign** — refreshed light/dark MUI theme (elevated dark surfaces, softer dividers, a
  `radius` scale, page-background gradients, frosted app bar, rounded surfaces, restyled menus /
  popovers / dialogs); redesigned dashboard navigation (animated active menu, brand-gradient
  sidebar, marketing + status footers), redesigned header (reworked breadcrumbs, `⌘/Ctrl+K` search,
  `InspectorPanel`-based notifications, global view actions moved into the header). Schema boxes,
  dashboard, datagrid, side panel and dialogs now render through the design-layer primitives.
  (HAB-663, HAB-674, HAB-676, HAB-678, HAB-681, HAB-687, HAB-711, HAB-714)
- **BREAKING — renamed public exports:**
  - `useAdminContext` → `useSchemaRootContext` (and `AdminContext` → `SchemaRootContext`). (HAB-668)
  - `useGetServiceResources` → `useGetServiceSchemas`. (HAB-668)
  - `GridBox` / `GridBoxItem` → `PanelGrid` / `PanelGridItem`. (HAB-668)
  - `ArrayField` → `ChipArrayField`; `ArrayInput` → `FormArrayInput`; `Datagrid` → `AdminDatagrid`
    (deprecated alias kept). (HAB-685)
  - `ImageCard` → `ImagePanel`. (HAB-680)
  - `useTabs` → `useTabsLocation`; `useFileUploadQueue` → `useUploadQueue` (deprecated alias kept).
    (HAB-668, HAB-685)
  - `BaseActionButton` (and the whole `Base*` button family) → `ActionButton`. (HAB-685)
  - `ButtonsStack` (renamed from `ActionsStack` — the design layer no longer uses "action"
    terminology): `component` → `surface`, `variant="icon"` → an orthogonal `iconOnly` prop,
    `ActionsStackComponent` → `ButtonsStackSurface`; the theme-level `variant="icon"` button variant
    was removed in favour of the `iconOnly` prop. Its props / item types were renamed alongside:
    the `actions` prop → `buttons`, `moreActionsLabel` → `moreLabel` (default `'More actions'` →
    `'More'`), `ActionDefinition` → `ButtonDefinition`, `ActionColor` → `ButtonColor`,
    `ActionsStackProps` → `ButtonsStackProps`, `ActionsStackVariant` → `ButtonsStackVariant`.
    `FormTable`'s `moreActionsLabel` prop was likewise renamed to `moreLabel`. (HAB-758, HAB-784)
  - `useDialog` `closeBoxSx` → `closeButtonSx`. (HAB-678)
- **BREAKING — schema / wire changes:**
  - `ViewMode` value `"modal"` → `"dialog"` (component props, schema fields and the OpenAPI enum).
    (HAB-700, HAB-701)
  - `BaseViewSchema` presentation param `view_mode` → `mode`. (HAB-595)
  - `BoxSchema.toolbarActions` now renders in the box header; its old bottom-of-box behaviour moved
    to the new `BoxSchema.bottomActions`. `ListBox` no longer reads `toolbarActions` — use the new
    `listActions` slot. (HAB-700)
- **Other behaviour** — `SaveButton` is disabled when the form is clean (HAB-644);
  `TriStateBooleanInput` shows "–" for its unset state (HAB-661); RA inputs no longer reserve an
  empty helper-text row (dynamic height, HAB-685); views route on the view `type` instead of
  `action_name` (HAB-598).
- **Datagrid action buttons** — datagrid row actions now render on the `iconButton` surface at
  `size="small"` (instead of the `button` surface with an icon-only toggle); `SchemaButton` /
  `SchemaMenuButton` gained an optional `surface` override and `SchemaButtons` an `iconOnly` prop to
  support this. The datagrid config buttons (`SelectColumnsButton`, `ResetColumnsWidthDatagridButton`,
  `ResetSortDatagridButton`, `ResetConfigurableDatagridButton`, `FilterButton`, `FilterDrawerButton`,
  `SavedQueriesButton`) now default to `size="medium"` (was `small`), and `DatagridActions` takes a
  `size` prop. The schema list-box toolbar (`SchemaListBoxActions`) now reuses `DatagridActions`
  (compact `size="small"`) and renders its record actions as `outlined` icon-only buttons. The list
  and list-box action toolbars also got balanced vertical padding (were bottom-heavy) and more left
  padding between the filters and the actions. (HAB-784)
- **Read-only action views** — a routed `action` view whose detail box is read-only (`isReadonly`)
  now renders as a read-only page (through `ShowShell`, with its view `label` as the title) instead
  of an empty form, so a custom action route can present a read-only list / detail subpage. (HAB-784)
- **Global view actions** — the view-toolbar actions (`SchemaViewToolbarActions`, e.g. a detail
  page's global actions) now render as `contained` `size="medium"` buttons. (HAB-784)
- **Responsive toolbar overflow** — page (`SchemaViewToolbarActions`), datagrid-row
  (`SchemaDatagridRowActions`) and box-header (simple / tab / list boxes) toolbars now collapse into the
  `⋮` menu based on the viewport and drop their labels below `sm`.
  The per-toolbar `useMediaQuery` ladders were replaced by declarative `maxVisibleButtons` maps resolved
  centrally by `useOverflowCount`; `SchemaButtons.maxVisibleButtons` now accepts a per-breakpoint map and
  its `iconOnly` a breakpoint. Bottom / footer actions keep the plain `SchemaButtons` so a primary button
  (e.g. Save) is never hidden behind the menu. Non-toolbar `SchemaButtons` call sites are unchanged
  (default budget of 6, no forced icon-only). (HAB-784)
- **Edit-page header actions** — a page (non-dialog) edit view that defines no toolbar actions now
  shows a default `contained` **Save** plus an `outlined` **Cancel** (returns to the detail without
  saving) in the app-bar header (`EditToolbarActions`, rendered inside the form so the Save actually
  submits it); the pair drops to icon-only on narrow widths (never collapses into a menu). `SaveButton`
  now defaults to a `Check` icon. (HAB-784)

### Removed

- **BREAKING** — dead / superseded public exports removed: `EmptyList`, `SchemaRecordTitle`,
  `SkeletonList` (`SkeletonListProps`), `LoadingAlert`, `DetailSchemaViewTitle`, `AdminPageContent`
  (`AdminPageContentProps`) (HAB-668); `SchemaLayout` (`SchemaLayoutProps`), `useSchemaMenu`,
  `SchemaSearch`, `useHasGlobalSearch`, `SimpleBox`, `SimpleListBox`, `WidgetCard` (`WidgetCardProps`)
  (HAB-687); `ListView`, `BaseLayout` (HAB-759); `createTreesFromRecords` / `TreeRecord` (HAB-685);
  `ImageCard` (HAB-680); `useScrollToTop` (HAB-668); the `Base*` button family and the React Admin
  `Button` override (HAB-685).
- **BREAKING** — the Solar icon set was removed; `material` is now the only set (the pluggable
  mechanism is kept for future sets). (HAB-676)
- **BREAKING** — layout shells reworked to a feature-slot API and made react-admin-free: the old flat
  layout props and `FooterComponent` are gone (new `LayoutMarketingFooter` / `LayoutStatusFooter` /
  `LayoutEnvironment` types). (HAB-663, HAB-674)
- **BREAKING** — `UploadArea` / `UploadInput` dropped the `multiple` prop (now derived from
  `maxFiles`) and renamed several `UploadAreaLabels` keys. (HAB-685)
- The in-content `h5` view title (the breadcrumbs cover it). (HAB-674)

### Fixed

- **Inspector panel subtitles** — the settings panel subtitle is now localized (it was hard-stuck on
  the English default) and the filter panel gained the missing subtitle. New `ra.settings.subtitle` and
  `ra.filter.subtitle` message keys back both; the filter panel title now reads "Advanced filters" /
  "Pokročilé filtry". (HAB-782)
- **Missing locale translations** — filled the translation gaps across all non-English/Czech locales
  (de, es, fr, it, ja, nl, pl, pt, ro, sk, uk): the widget-definition chart/aggregate keys
  (`ra.widget.definition.*`), the `ra.widget.aggregate.no_data` / `unsupported_resource` messages, the
  `ra.draft.*` block (ja, pl, pt), `ra.widget.dashboard.unknown_type` (es, ro) and
  `ra.widget.definition.no_types` / `row_actions` (nl, pl, uk) — which previously fell back to the raw
  key / English default at runtime. (HAB-782)
- **Menu item height** — menu items no longer jump to MUI's 48px mobile touch-target height below `sm`;
  the design theme pins `MuiMenuItem` `minHeight` to `auto`, so a `Menu` keeps its compact, content-driven
  height at every width (most visible in an `OverflowToolbar`'s `⋮` menu, which opens exactly at that
  breakpoint). (HAB-784)
- **Overflow toolbar menu** — an open `OverflowToolbar` `⋮` menu now closes when a widening viewport
  removes the overflow, instead of surviving with a detached anchor and re-opening in the top-left corner
  when the viewport narrows again. (HAB-784)
- **Dashboard** — widgets could not be dragged / resized in a dev server (`process is not defined`
  from `react-draggable`); the build now neutralizes it. Table widgets scroll inside their card with
  a sticky header, the dashboard respects the centered page-width preference, and edit mode keeps
  grow-room below the last widget. (VD-2736)
- **Design-layer polish** — input frame / focus / label alignment (`InputLayout`, `PropertyItem`),
  dark-mode backdrop separation, `DataGrid` header height / density and actions-column width /
  pinning, chip and menu-item styling, Czech localflavor inputs, and date / time input `disabled` /
  `readOnly` handling. (HAB-663, HAB-676, HAB-680, HAB-681, HAB-685, HAB-710, HAB-711)
- **Type-declaration build** — memory / time roughly halved (~32 s → ~10 s, ~2.3 GB → ~1.3 GB) by
  fixing two theme typing hot spots (a `createTheme` two-arg footgun and the DataGrid `sx` union
  types). Type-only — no runtime change.
- **Locale** — an invalid stored locale now resets to the first available language; added missing
  filter / settings translations across all locales. (HAB-661, HAB-698, HAB-663)
- `ChangePasswordForm` no longer crashes on a password mismatch. (HAB-668)
- `SchemaListBox` / `SchemaImagesBox` again fall back to the referenced resource's default list
  actions. (HAB-700)
- **`PanelHeader`** — a bare (un-badged) leading icon now keeps the wider `16px` left gutter (same
  as a label-only header) so the small glyph has room to breathe; only a badged icon or drag handle
  still tightens it to `8px`. (HAB-784)
- **Locale change now refetches data endpoints** — the row-action and detail-toolbar labels
  (`Detail` / `Upravit` / `Smazat` / …, incl. the delete confirm dialog) come from the per-record
  `meta.schema.actions` returned by the *data* endpoints, not the schema, so they did not switch
  language. The list / show / edit / create views now thread the active locale into their RA
  controllers via `queryOptions`/`mutationOptions` `meta.locale`; this puts the locale in the query
  key (so a language switch refetches the data) and forwards it to `dataProvider.getList`/`getOne`,
  letting the backend localize each record's `meta`. **Data-contract change:** every data request now
  carries `meta.locale`, and backends are expected to localize per-record `meta` accordingly.
  (HAB-782)

## [6.6.0] — 2026-07-10

### Added

- Search-term highlighting in field values and global search — matching substrings are
  highlighted in `TextField`, `NumberField`, `EmailField`, `PhoneNumberField`, `UrlField`,
  rich-text output, and the dashboard searchbar results. Adds the `useFieldHighlight` hook
  and `utils/highlight.ts` / `utils/richText.ts` helpers. (HAB-453)

### Changed

- **BREAKING:** `FieldOptions` restructured into nested option groups. Flat keys moved:

  | Before | After |
  |---|---|
  | `iconsKey` | `choices.iconsKey` (`ChoicesOptions`) |
  | `resizeWidth`, `cropAspectRatio` | `image.resizeWidth`, `image.cropAspectRatio` (`ImageOptions`) |
  | `aiSourceFields` | `ai.sourceFields` (`AiOptions`) |
  | `parent` | `RelationOptions.parent` |

  Update any code that reads these options directly; the default schema-driven flow is
  unaffected. (HAB-570)
- Box / card titles are now centered (`CardHeader`). (VD-2723)

## [6.5.0] — 2026-07-09

### Added

- Responsive scrollbar for list views — new `ResponsiveScrollbar` component (under
  `components/common/Scrollbar`) improves horizontal scrolling of datagrids and lists on
  smaller screens, plus mobile-device view enhancements to breadcrumbs and list content. (HAB-573)

### Fixed

- Scrollbar behaviour in datagrids and the shared `Scrollbar` component. (HAB-587)

## [6.4.2] — 2026-07-06

### Fixed

- Image upload via `UploadImagesButton` now uses multipart upload. (HAB-441)

## [6.4.1] — 2026-07-06

### Added

- Default upload options for `UploadImagesButton` (`SchemaUploadImagesButton`). (HAB-441)

## [6.4.0] — 2026-07-06

### Added

- Chunked upload support via [Uppy](https://uppy.io/) — `UploadInput` automatically uploads
  files at/above the configured threshold through a chunked provider (`s3-multipart` presigned
  PUT/multipart via `@uppy/aws-s3`, or resumable `tus` via `@uppy/tus`); smaller files continue
  to use base64 encoding. The completed field value is `{upload_key}`.
- `UploadInput` component — unified file/image upload input replacing `UrlFileInput` and
  `UrlImageInput`. Supports single and multi-file upload (`options.maxFiles > 1`).
  Pass `showImagePreview` for image fields.
- `UploadArea` component — drag-and-drop drop zone with per-file progress bars, retry, and
  remove controls. Exported from the main entry point.
- `useFileUploadQueue` hook — manages a queue of upload entries (chunked or base64), progress
  tracking, retry, and cleanup on unmount. Exported from the main entry point.
- `uploadFileChunked` / `processFileUpload` utilities in `utils`, plus `deriveS3Url` and
  `deriveTusUploadKey` helpers in `utils/uploadUrls`.
- `FieldOptions` extended with `upload` (`UploadOptions`: `provider`, `threshold`, `chunkSize`,
  `minChunkSize`, `initiateUrl`, `endpoint`), `maxSize`, `maxFiles`, and `accept` (`string[]`) —
  all auto-injected from the backend schema when a chunked provider is configured in `habarico-python`.
- `UploadImagesActionParameters` extended with `maxFiles` and `upload` (`UploadOptions`).

### Changed

- **BREAKING:** `UploadImagesActionDescriptor` (and `UploadImagesActionParameters`) — `accept`
  parameter type changed from `string` to `string[]`.

  Migration:
  ```typescript
  // Before
  UploadImagesActionDescriptor({accept: '.png,.jpg'})

  // After
  UploadImagesActionDescriptor({accept: ['.png', '.jpg']})
  ```

- **BREAKING:** `UrlImageInput` and `UrlFileInput` replaced by `UploadInput`. The old names are no longer
  exported. Update imports if you reference these components directly (the default
  schema-driven flow via `defaultInputProvider` updates automatically).

  Migration:
  ```typescript
  // Before
  import {UrlImageInput, UrlFileInput} from '@eluvia/habarico';
  <UrlImageInput source="avatar" />
  <UrlFileInput source="attachment" />
  
  // After
  import {UploadInput} from '@eluvia/habarico';
  <UploadInput source="avatar" showImagePreview />
  <UploadInput source="attachment" />
  ```
