# Changelog

Tracks changes shared across all packages: OpenAPI schema (`contract/openapi.yaml`) and project-level documentation.

For package-specific changes see:
- [node/CHANGELOG.md](node/CHANGELOG.md) — `@eluvia/habarico` (JS)
- [python/CHANGELOG.md](python/CHANGELOG.md) — `habarico` (Python)
- [ruby/CHANGELOG.md](ruby/CHANGELOG.md) — `habarico` (Ruby)

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `examples/eshop/` — a runnable admin on the e-shop domain the documentation uses, built on the
  three libraries as they are in this tree: a Django backend, a Rails backend and one React
  frontend that works against either. `docker compose --profile python|ruby up -d` brings the
  chosen stack up seeded and ready; the same pieces run natively for reading and editing. It
  installs from public registries alone, with no token and
  no private registry, which is what it is for: it demonstrates that Habarico depends on no
  authentication library, each backend writing its own on stock framework pieces (Django sessions,
  Rails `has_secure_password`) behind one shared contract. The `examples.yml` workflow runs both
  backends' tests on every pull request, so a library change that breaks the example fails in the
  pull request that made it. `examples/` is not a versioned unit and nothing publishes it.
  The documentation now takes its authentication examples from there instead of from a private
  Eluvia auth library a reader cannot install. (HAB-829)

### Changed

- The `filter` query parameter is written down, on the list endpoint that has always taken it and
  on the new export endpoint: the `field=<JSON value>` terms it carries as one percent-encoded
  value, that `field` is a filter the resource schema advertises (lookup suffix included), that an
  unknown field and a malformed term are both refused with `422`, and that a `search=` term is the
  fulltext query rather than a field filter. The export endpoint takes `order_by` as well, so an
  export matches the list it was started from; both parameters were served by the backends and
  sent by the frontend without the contract naming them. `info.version` 3.2.4 -> 3.3.0, shared
  with the export endpoint entry below; documentation only, no wire change.
  (HAB-532)

- The `order_by` query parameter of a list endpoint is described: its notation, what a client may
  put in `field` (a `sort_by` the resource schema advertises, which is not always the field's own
  name), and that a resource forcing its ordering ignores the parameter rather than refusing it.
  The `422` examples now match what the backends answer — `Unknown field name.` carries no field
  value — and `ValidationErrorResponse` says outright that `status` and `source` are the contract
  while `message` is human text that differs between the two backends. `info.version` 3.2.3 →
  3.2.4; both backends implement it. (HAB-915)

- The documentation pages moved next to the code they document: `docs/node/`, `docs/python/` and
  `docs/ruby/` are now `node/docs/`, `python/docs/`, `ruby/docs/`, the paid pages moved to
  `habarico-enterprise` and the site itself - the Docusaurus project that was in `docs/` - is its
  own repository, `eluvia/habarico/hab-docs`, which clones the pages from both monorepos and
  publishes one site out of them. A page is therefore part of its package: it is released with it,
  read out of its release tag, and a change to a page alone bumps that package. Two root CI jobs
  connect the repositories - `trigger-docs` publishes after a stable tag, `docs-check` builds the
  whole site on a merge request that touches `*/docs/**`. `contract/schema.svg` is committed beside
  its `.drawio` source with the script that exports it, and `docs/CHANGELOG.md` is gone: a page is
  described by the entry of the change it documents.
  (HAB-873)
- The `target` query parameter of the chunked-upload endpoints (`uploads/initiate` / `complete` /
  `abort`) no longer lists a `STORAGES` alias among its plaintext values: an alias is accepted only
  inside a signed token, and a plaintext one now answers `404`. The values that remain are a signed
  token and the name of a target registered through `register_upload_target`. `info.version` 3.2.1 →
  3.2.2; the paid implementation ships in `habarico-enterprise`.
  (HAB-910)
- `LinkActionParameters.url` documents which URLs a client honours: only `http:`, `https:` and
  relative ones, always opened with `noopener,noreferrer`. The field is templated with record
  values, so any other scheme — `javascript:`, `data:`, `blob:`, and by exhaustion `mailto:` and
  `tel:` — is refused rather than opened. `info.version` 3.2.1 → 3.2.2; documentation only, no
  wire change. (HAB-908)
- `GlobalResourceSchema`: `aggregate_enabled`, `dashboard_enabled` and
  `global_fulltext_search_enabled` are marked **Premium**. All three are contributed by the paid
  `habarico-enterprise` package — neither free backend emits any of them — but the contract
  described them as ordinary resource-schema keys, which is what led the JavaScript library to
  declare the first two on its free resource types. `info.version` 3.2.0 → 3.2.1; documentation
  only, no wire change. (HAB-857)
- `BoxSchema.card` is `nullable` and carries three states instead of two: `true` always renders the
  box as a card, `false` never does - not even for a box with a label or toolbar actions, whose
  label then becomes a plain section heading - and `null` (or an absent key) leaves the decision to
  the frontend, which also gives a view's first box a card on a page surface. `info.version` bumped
  to `3.2.0`. (HAB-827)
- YouTrack and GitLab URLs are gone from this repository's changelogs and READMEs: an issue is
  referenced by its key alone (`(HAB-123)`), the way code comments already do it, and another
  repository is named rather than linked. These files are published — the packages are MIT and the
  repository is mirrored to GitHub — so an internal URL in them is a link no outside reader can
  follow. The `CLAUDE.md` files keep theirs: they are internal developer documentation, kept off
  the site. (HAB-923)

### Added

- The aggregate endpoint describes `min` / `max` over a date. `AggregateFieldSchema` gains an
  optional `format` (`FieldFormatType`) derived from the model column - `date`, `date-time`,
  `time`, `text` or `uuid`, absent when the column type has none - so a client can tell a date
  from a text field that is `type: string` too. `AggregateBucket.value` is a
  number or a string: `min` / `max` over a `date` / `date-time` field returns an ISO 8601 value
  (`"2026-01-01"`, `"2026-01-01T00:00:00Z"`), whose fraction digits and offset notation differ
  between the backends. `AggregateFunctionType` and `WidgetType` say which fields the widgets
  offer `min` / `max` for - numbers and dates in `aggregate` / `simple-aggregate`, numbers only in
  the charts - and that the backend keeps accepting any whitelisted field, other types being an
  unsupported target. `info.version` 3.3.4 -> 3.4.0; additive, the paid implementation ships in
  `habarico-enterprise`.
  (HAB-1012)
- Resource export endpoint `GET /{api_prefix}/{service_name}/admin/{resource_name}/export`
  returning the resource rows in a downloadable file (CSV/XLSX), signalled to the frontend through
  the `export` action in the list view `list_actions` slot. The endpoint is free but off by
  default — the backend switches it on per resource — and it serves the synchronous export
  only: exports above a fixed row limit are refused with HTTP 422, and
  answering them in the background is a `habarico-enterprise` feature.
  `info.version` 3.2.4 -> 3.3.0.
  (HAB-532)
- `max_size` and `accept` on `FieldOptions` - the file size and file types the frontend checks a
  picked file against before an upload starts, so a file the backend would refuse anyway never
  leaves the browser. Both are optional and additive: the frontend already read them
  (`FieldOptions.maxSize` / `.accept` in `@eluvia/habarico`, consumed by `UploadInput`), the spec
  had never described them, and `habarico-enterprise` now fills them from a field's own declared
  upload validations. Neither replaces backend validation, and an absent `accept` does not mean
  the server accepts everything - a restriction that cannot be expressed as an allowlist entry is
  omitted rather than approximated. `info.version` 3.3.0 -> 3.3.1.
  (HAB-942)
- Clarified that `max_size` / `accept` are no longer an `habarico-enterprise`-only fill: the Python
  package now derives both itself (`MaxFileSizeValidator`, `FileExtensionValidator` /
  `validate_image_file_extension`) for `AdminFileSerializer` / `AdminImageFileSerializer`, with
  `habarico-enterprise` additionally folding the project-wide upload size ceiling into `max_size`
  for a field a chunked-upload provider serves. No wire change. `info.version` 3.3.3 -> 3.3.4.
  ([HAB-966](https://sparktech.myjetbrains.com/youtrack/issue/HAB-966))
- `x-habarico-tier: enterprise` on every part of the contract that the paid `habarico-enterprise`
  package provides: the six endpoints (`uploads/initiate` / `complete` / `abort`, `search`,
  `{resource_name}/aggregate` and its `/schema`), the `search` query parameter, and the 25
  `Aggregate*` / `Search*` / `Upload*` schemas together with their responses and request bodies.
  `DashboardPreference`, `WidgetConfig`, `WidgetLayout` and `ChartOptions` are marked too: the
  dashboard is a paid feature, and their note records that a free-only install still stores the
  payload under `preferences.dashboard` but has no widgets to render it. The rest of the
  preferences store stays free and unmarked.
  Each also opens its description with a **Premium** line, because
  `docusaurus-plugin-openapi-docs` ignores vendor extensions it does not know. The theme renders
  operation and response descriptions, so the note is what a reader of the six endpoint pages sees;
  it does not surface schema, request-body or parameter descriptions, and there the marking travels
  in the downloadable `openapi.yaml` and the diagram rather than on the page.
  `contract/schema.drawio` marks the same split: the `search`,
  `uploads` and `aggregations & dashboard` groups are labelled `(premium)`, and so are the two paid
  classes that sit inside otherwise free groups — `UploadFieldOptions` in `core` and
  `DashboardPreference` in `preferences` — so all 25 paid schemas are covered rather than only the
  ones a paid group happens to enclose. A legend explains the suffix and points at
  `x-habarico-tier`. The base64 `upload-images` action
  (`UploadImagesActionParameters`) stays free and is not marked. `info.version` 3.0.0 -> 3.1.0.
  (HAB-846)
- Root README documents the licence boundary of the monorepo: `node/`, `python/` and `ruby/` are
  MIT, the paid `habarico-enterprise` packages are commercial and proprietary, and the repository as
  a whole carries no single licence. The package table gained a licence column.
  (HAB-811)
- `docs/AI.md` — the procedure for opening the documentation website to AI tools: publishing an
  `llms.txt` index over the Markdown mirror the site already generates, the candidates for a search
  assistant (the local index plus an Ask AI widget, Algolia DocSearch, Orama, kapa.ai, Inkeep,
  Typesense, Meilisearch) with the criteria to pick between them, and the options for MCP indexing
  of a public site whose source repository is private. Described, not implemented — the acceptance
  criterion of HAB-727 asks for the procedure.
  (HAB-765)
- Documentation website scaffold in `docs/` — Docusaurus 3 (classic preset, TypeScript, v4 future
  flags), Habarico brand theming modelled on the reactnative.dev documentation site, three docs
  instances (`python` / `ruby` / `node`) plus shared concept pages, the `premium: true` front matter
  convention for labelling paid sections, and a build/deploy pipeline to `docs.habarico.com`
  (static nginx in DOKS). The website is a versioned unit of the monorepo like the packages
  (released as `docs@X.Y.Z`), so its own changes are recorded in
  [docs/CHANGELOG.md](https://gitlab.eluvia.dev/eluvia/habarico/hab-docs/-/blob/master/CHANGELOG.md)
  from now on (the site moved to the `hab-docs` repository in HAB-870, and the changelog with it).
  Content migration from the library READMEs follows separately.
  (HAB-761)
- `ViewModeType` component schema (`redirect` / `dialog` / `sidepanel`), replacing the enum that was
  inlined at three places (`ActionDescriptorMenuViewParameters.mode`, `ActionViewParameters.mode`,
  `GlobalViewSchema.mode`). Matches the `ViewModeType` already defined in the Python implementation
  and `ViewMode` in the JS one. (HAB-705)
- `FieldFormatType` gained `decimal` and `tree-relation`, and `ActionType` gained `ai-assistant`.
  All three are implemented in Python and/or JS but were absent from the contract, so a generated
  client could not express them. `tree-relation` was in fact already referenced by the spec, in the
  description of `RelationFieldOptions.parent`.
  (HAB-708)
- `DynamicRenderOptions`, `SortableParameters` and `ConfirmDialogProperties` component schemas,
  replacing structurally identical objects that were inlined twice each (`FieldOptions.dynamic_render`
  / `BoxOptions.dynamic_render`, `ListBoxParameters.sortable` / `ListViewParameters.sortable`,
  `ActionSchema.confirm_dialog` / `ResourceActionSchema.confirm_dialog`). Names follow the existing
  implementations. No change to the wire format.
  (HAB-705)
- `ChoicesOptions`, `ImageOptions`, `AiOptions`, `RelationOptions`, `PhoneOptions`, `UploadOptions`,
  `ListedOptions`, `ActionViewChoice`, `SearchResultObject`, `SavedQueryValue`, `TruncBucket`,
  `WidthBucket` and `ResourceObjectList` component schemas, extracted from objects that were defined
  inline inside `FieldOptions`, `ArrayBoxParameters`, `ActionViewParameters`,
  `ActionDescriptorMenuViewParameters`, `SearchResourceObjects`, `SavedQueryPreference`,
  `GroupByBucket` and the `ResourceObjectListResponse` response. Names follow the existing
  implementations where one already had a name. No change to the wire format.
  (HAB-705)
- `discriminator` on `GroupByBucket`, selecting `TruncBucket` / `WidthBucket` by the `type` property.
  The union was already discriminated in practice and in the Python implementation, but the spec did
  not declare it. (HAB-705)
- `ValidatorRule` component schema (and the matching box in `doc/schema.drawio`) plus the
  `FieldOptions.validators` array that references it —
  the frontend validation rules enforced before submit (`{type, value, message}`, `type` one of
  `max_length` / `min_length` / `max_value` / `min_value` / `regex`). Backend validation is
  always performed regardless; at most one rule per `type` is expected. Implemented in Python and
  consumed by the JS client. (HAB-445)

### Fixed

- The `target` query parameter of the chunked-upload endpoints was described as never sending
  internal model/field identifiers in plaintext. It is signed, not encrypted: the payload is
  base64-encoded JSON that anyone holding the URL can decode, so whatever it names is readable -
  only unalterable. The description now says so, and a token no longer names a model field at all:
  a storage is identified by its `STORAGES` alias or a registered target name, both of which the
  project chose itself. Previously a field's token carried `app_label.model.field`, which revealed
  more than the schema does - a serializer `source=` makes the schema's field name and the model's
  differ. No wire change; `info.version` 3.3.1 -> 3.3.3.
  (HAB-942)
- `AppDensityPreference` lists `standard`, not `normal`, as the middle UI density - the value the
  frontend has sent since `node@6.7.0`, where it was renamed so a settings density can be passed
  straight to `DataTable` / MUI `DataGrid` without translation. Both backends rejected it, so
  `PUT /user-preferences/preferences.layout.app.density/` answered `422` for the only value the
  frontend produces. A backend on this version rejects `normal` in turn: a value an older frontend
  stored fails validation on the next read, is deleted, and the registered default takes its place.
  The endpoint description no longer promises a `migrate` callback either - no implementation has
  one, and both delete the offending record instead. `info.version` 3.2.2 -> 3.2.3; the enum is
  renamed in `contract/schema.drawio` and `contract/schema.svg` as well.
  (HAB-939)

### Added

- Properties the implementations already send but the spec never described, found by diffing the
  generated schemas against this file. All are additive - the wire format does not change, the spec
  catches up with it. Added to `doc/schema.drawio` as well.
  (HAB-732)

  | property | type | sent by |
  |---|---|---|
  | `BoxSchema.collapsible` | `open` / `closed`, nullable | Ruby, Python; rendered by the JS client |
  | `ArrayBoxParameters.inline` | boolean | Ruby, Python, JS |
  | `FieldSchema.short_label` | string | Ruby, Python, JS — the spec had it on `FieldDescriptor` only |
  | `MenuGroupSchema.color` | `ColorType` | Python, JS |
  | `MenuSchema.color` | `ColorType` | Python, JS |
  | `ResourceActionSchema.label` | string | Ruby, Python; the spec had it on `ActionSchema` only |
  | `RelationFieldOptions.dialog_width` | `DialogWidthType` | Ruby, JS |

### Changed

- 2026-08-25 — the three library READMEs were reduced to a quick start — what the library is,
  installation, one minimal working example and a map of the documentation website — after their
  content was migrated to [docs.habarico.com](https://docs.habarico.com). Together they went from
  roughly 7 990 lines to 256. **The website is the source of truth for user-facing documentation
  from now on; there is no sync back into the READMEs.** The root README points at the site instead
  of the library READMEs, and every `CLAUDE.md` (plus a new `docs/CLAUDE.md`) states where
  documentation belongs, which templates it follows and what is generated and must not be edited by
  hand. Internal developer documentation — the four `node/src/*/README.md` layer references and
  `python/src/habarico/contrib/uploads/README.md` — stays in the repository.
  (HAB-764)
- The OpenAPI contract directory `doc/` renamed to `contract/` (`contract/openapi.yaml`,
  `contract/schema.drawio`). The old name collided with the new `docs/` documentation website and
  did not say what the directory holds — the file is the contract between backend and frontend, not
  documentation. No change to the contract content itself.
- 2026-08-21 — `node/README.md` brought in line with the schema names the contract and the JS client
  now use: `useGetResourceSchema` → `useGetLocalResourceSchema`, `BaseResourceSchema` /
  `BaseViewSchema` → `Global*`, `ResourceSchema` → `LocalResourceSchema` (`pkName` → `pkFieldName`,
  `endpoint` → `endpoints`), `HttpMethod` → `RequestMethodType`, `SortPayload` → `SortDescriptor`,
  `FieldFormat` → `FieldFormatType`, the `FieldOptions` slots → `*FieldOptions` (with
  `numberFormat` → `number` and `target` → `LinkTarget`), `BoxSchema.isReadonly` → `readOnly`, and
  `SchemaWidget*` → `Widget*`. The `ViewSchema` / `BoxSchema` / `ActionSchema` listings in § 13.3
  were regenerated from `src/schema/types.ts` — they had drifted beyond the renames (`list.fields`
  is `list.boxes`, `detail.formActions` is `detail.bottomActions`, `BoxSchema.fields` is folded into
  `boxes`). (HAB-731)
- 2026-08-21 — two further `node/README.md` corrections found alongside the rename: § 11.3
  documented a `useCallAction` prop that does not exist (`onPostTrigger`; the hook calls `onDone`,
  and only when the response carries no `meta.triggerAction`), and §§ 8.2 / 8.3 / 8.10 / 9.2 / 9.3
  passed a schema `options` object to `TextInput`, `NumberInput`, `PhoneNumberInput`, `TextField`
  and `NumberField`, which take explicit props (`prefix` / `postfix`, `numberFormat`,
  `defaultRegion` / `allowedRegions`) — the `FieldOptions` slot is mapped onto them by the schema
  layer, not passed through. (HAB-731)
- **BREAKING:** `BoxSchema.is_readonly` renamed to `read_only`, so the same flag is spelled the same
  way everywhere in the spec. It was the odd one out: `FieldSchema` and `FieldDescriptor` both call
  it `read_only`, and Ruby already sent `read_only` on the box too. Renamed in `doc/schema.drawio` as
  well. Python and the JS client both used `is_readonly` / `isReadonly` and are aligned in the same
  batch. (HAB-732,
  HAB-708)
- **BREAKING:** `AggregateFunction` renamed to `AggregateFunctionType`. It was the last enum outside
  the preference values (`LocalePreference`, `ThemePreference`, …, which are named after the
  preference they store) without the `*Type` suffix that the other 20 enums and scalar schemas all
  carry; the Python implementation already called it `AggregateFunctionType`. The property that
  references it (`WidgetConfig.aggregateFunction`) is unchanged. Renamed in `doc/schema.drawio` as
  well. (HAB-730)
- **BREAKING:** `FieldOptions.number_format` renamed to `number` and its schema `NumberFormatType` to
  `NumberFieldOptions`. It was the only `FieldOptions` slot not following the `<slot>FieldOptions`
  pattern of its six siblings, and the only object schema carrying the `*Type` suffix, which
  everywhere else in this spec marks a scalar or enum (19 of the 21 `*Type` schemas). The slot is
  also now named after what it applies to (`number`), like `image`, `phone` and `choices`, rather
  than after what it contains. (HAB-708)
- **BREAKING:** `KeyValueType` renamed to `KeyValue`. It was the last object schema carrying the
  `*Type` suffix, which everywhere else in this spec marks a scalar or enum.
  (HAB-708)
- `FieldOptions.text_align` and the duplicated `dialog_width` (defined twice, identically, in
  `ViewActionParameters` and `ViewActionDescriptorParameters`) were extracted into `TextAlignType`
  and `DialogWidthType`. `TextAlignType` matches the name the Python implementation already uses.
  (HAB-708)
- **BREAKING:** `FieldOptions.target` changed its values from `_blank` / `_self` / `_parent` / `_top`
  to `self` / `blank`, and both it and `LinkActionParameters.target` now reference the new
  `LinkTargetType`. The two properties described the same thing — where a link opens — in two
  incompatible spellings: one stored the bare value and had the underscore prepended at render time
  (`LinkButton`), the other stored the full HTML value and passed it straight to the anchor. The
  dropped `_parent` and `_top` differ from `_self` only inside an iframe, and the frontend never
  renders in one. `TargetType` is unrelated (it names the field a nested list is filtered by) and
  keeps its meaning; its description now says so.
  (HAB-708)
- **BREAKING:** `ResourceSchema` renamed to `LocalResourceSchema`. It is returned only by the
  per-resource schema routes (`/admin/{resource_name}/**/schema`) and is the counterpart of
  `GlobalResourceSchema`, which `/admin/schema` returns; the spec previously named one half of the
  pair and left the other unmarked. The Ruby implementation already uses `LocalResourceSchema`, so
  this aligns the spec with the code. Renamed in `doc/schema.drawio` as well.
  (HAB-708)
- **BREAKING:** The `FieldOptions` slot schemas gained the owner in their name, matching the
  `<slot><Owner>` pattern used by the parameter schemas: `ChoicesOptions` → `ChoicesFieldOptions`,
  `ImageOptions` → `ImageFieldOptions`, `AiOptions` → `AiFieldOptions`, `RelationOptions` →
  `RelationFieldOptions`, `PhoneOptions` → `PhoneFieldOptions`, `UploadOptions` →
  `UploadFieldOptions`. The container schemas (`FieldOptions`, `BoxOptions`,
  `FilterDescriptorOptions`) and the slots shared by two owners (`DynamicRenderOptions`,
  `ConfirmDialogProperties`) keep their names.
  (HAB-708)
- **BREAKING:** The two action parameter schemas that did not follow the discriminator-first naming
  pattern were renamed: `ActionViewParameters` → `ViewActionParameters`, `ActionLinkParameters` →
  `LinkActionParameters`, and consequently `ActionViewEndpointParameters` →
  `ViewActionEndpointParameters`. `ActionSchema` has six structurally identical slots, one per
  `ActionType`; four of them (`ResourceActionParameters`, `SaveActionParameters`,
  `UploadImagesActionParameters`, `ExportActionParameters`) already named the discriminator value
  first, as do all seven box slots and both view slots. Renamed in `doc/schema.drawio` as well.
  (HAB-708)
- **BREAKING:** `ActionDescriptorMenuViewParameters` renamed to `ViewActionDescriptorParameters`, in
  two steps: HAB-705 renamed the `Menu*` parameter schemas to `Action*` but left `Menu` inside this
  one name, and the result still put the owner first. Renamed in `doc/schema.drawio` as well. The
  genuine menu entities (`MenuSchema`, `MenuGroupSchema`, `MenuType`) keep their names — they
  describe the navigation menu, not an action.
  (HAB-708)
- `FieldOptions.relation.link_mode` now references `ViewModeType` and therefore accepts `sidepanel`
  in addition to `redirect` and `dialog`, and is now nullable (`ViewModeType` carries
  `nullable: true`). Python and JS already typed it this way; the spec was the outlier.
  (HAB-705)
- `WidgetConfig.color` now references `ColorType` instead of repeating its seven values inline. Same
  values, but the field is now nullable (`ColorType` carries `nullable: true`).
  (HAB-705)

### Removed

- `node-enterprise/`, `python-enterprise/` and `ruby-enterprise/` — the three paid packages are
  developed and released from a repository of their own (`habarico-enterprise`), so their code,
  changelogs and `.pydev` configs left this monorepo. Nothing here built or published them — they
  never had a child `.gitlab-ci.yml` or a trigger in the root one — so the release jobs are
  unchanged and still cover `node/`, `python/`, `ruby/` and `docs/`. The root README and the
  changelog list above no longer link into the removed directories. `contract/openapi.yaml` stays
  here and keeps describing the paid endpoints (`/search`, `/{resource}/aggregate`, the upload
  endpoints): the contract is shared between the free and the paid halves.
  (HAB-846)

### Fixed

- The spec did not validate as OpenAPI 3.0.3. `ObjectResourceSchema` and `LocalResourceSchema`
  required a property named `pk_name`, but the property they define — and the one both backends emit
  and the frontend reads — is `pk_field_name`. Fixed in both schemas.
  (HAB-708)
- `ObjectResourceSchema` required `views`, which it does not define and which no implementation
  sends: the schema is also used stand-alone as `ResourceObjectMeta.schema`, where a per-record
  schema has no views. Removed from `required`.
  (HAB-708)
- `ResourceActionParameters` required `method`, which it does not define — `method` belongs to
  `ResourceActionEndpointParameters`, where it is already required. Removed from `required`.
  (HAB-708)
- Twelve operations documented only their success response. They now declare the error responses
  they can actually return, following the conventions the other operations already use: `404` for
  the schema and global endpoints (unknown service, resource, record or action) and for the
  `user-preferences` group, which clients may find missing entirely; `400` + `422` for the three
  upload endpoints and `422` for the search endpoint (request body / query validation); and
  `400` + `405` + `422` for `GET /{resource_name}/{action_name}`, matching its POST/PUT/PATCH
  siblings. (HAB-708)
- `extra_filters` (on `ListBoxParameters`, `ListViewParameters`, `GalleryBoxParameters`) and
  `SortableParameters.sort_for_filters` were typed as a single `{key, value}` pair, so the contract
  allowed exactly one filter with a string value. Both backends send a map keyed by field name whose
  values may also be integers or booleans (Python `dict[str, str | int | bool | None]`, Ruby
  `any_attr`). All four now reference the new `FilterValues` schema, an object with
  `additionalProperties` — the field name is the key, so there is no `key`/`value` pair to describe.
  `RelationFieldOptions.filters` is unaffected — there the code really does send a list of `KeyValue`
  pairs. (HAB-708)
- `ActionResult` had its `additionalProperties` nested one level too deep, inside `properties`. The
  spec therefore declared a payload key literally named `additionalProperties` — which nothing sends
  — while forbidding the arbitrary keys an action result actually consists of. Its sibling
  `ResourceObject` already had it right.
  (HAB-708)
- `EndpointsSchema` described itself as "Methods schema … describing methods that resource supports",
  so the spec used two words for one thing. The description now matches the name and says what an
  absent method means. (HAB-708)
- `OffsetPaginationMeta.cursor` declared three mutually inconsistent things: `type: string` with
  `format: int64` (an integer format) and an integer `example`. It is now `oneOf` integer / string,
  documented as an opaque token to be passed back verbatim.
  (HAB-708)
- Removed every `nullable: true` that had no effect. In OpenAPI 3.0 `nullable` only applies when
  `type` is present in the same schema object, so a `nullable` sitting next to a `$ref`/`oneOf`/
  `allOf` — or on an untyped schema, which already permits null — did nothing. All of the affected
  properties describe schema output, which both backends serialize with nulls stripped (Python
  `remove_empty`, Ruby `deep_compact`), so optionality is expressed by `required` alone.
  `UserPreferenceValue` is the one genuine nullable: preference values are returned by a DRF
  serializer, bypassing that stripping, and can be stored as `null`. Its `anyOf` had no branch that
  accepts `null`, so the object branch is now `nullable: true` — valid, because it has a `type`.
  (HAB-708)
- `ActionDescriptor.view` was a bare `$ref` with sibling keys, so its `description` was being dropped;
  it is now wrapped in `oneOf` and the description applies.
  (HAB-708)
- `FieldFormatType` contradicted itself: its description documented `phone`, `czech-bank-account`,
  `czech-ico`, `czech-dic`, `czech-birth-number` and `czech-id-card-number`, but the enum did not
  allow them, so a spec-conformant client had to reject formats the spec itself described. The six
  values were added to the enum. In the other direction, `time` was allowed but undocumented and now
  has a description entry. The enum is also reordered to match the description, so the two can be
  compared at a glance. (HAB-708)
- The choice objects of `ActionDescriptorMenuViewParameters.choices` carried their view parameters
  under a key named `properties`, while `ActionViewParameters.choices` used `parameters`. Both now
  use `parameters`, which is what all three implementations actually emit — the spec was simply
  wrong. (HAB-705)
- `ViewActionDescriptorParameters` carried the view parameters under a key named `properties`, while
  the schema it overrides (`ViewActionParameters`) used `parameters`. Both now use `parameters`. The
  frontend deep-merges the descriptor's `view` onto the action's `view`
  (`generateActionSchema`), so mismatched keys would have made the override silently do nothing; all
  three implementations emit `parameters`.
  (HAB-708)
- The list response schema (`ResourceObjectListResponse`) declared `properties` without `type:
  object`; the extracted `ResourceObjectList` now declares it.
  (HAB-705)

