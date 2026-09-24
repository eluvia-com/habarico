# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `WidgetLayout` accepts the optional `stackedH`, `minW` and `minH` (integers of at least 1), so
  `preferences.dashboard` validates them as `contract/openapi.yaml` 3.4.0 describes them: `stackedH`
  is the widget's height on a narrow, stacked dashboard, `minW` / `minH` its resize lower bounds.
  A `DashboardPreference` instance given as a default now dumps the three keys as `null` when unset.
  (HAB-1006)

- `grid_item` - the placement of a box inside its parent `GridBox` - is accepted by every box class:
  `ListBox(label="Documents", grid_item={"md": 9}, reference="document")` is a grid cell and a list
  box at once. It takes a `GridItem` descriptor or a plain dict of breakpoint spans, and the new
  `GridItem` is exported from `habarico.schema`. A box that sets no span emits no `grid_item` key at
  all, so a grid whose cells carry none still computes their widths itself. Overriding
  `_get_grid_item()` makes the placement context-dependent. (HAB-963)

### Changed

- **BREAKING:** The `upload-images` action is renamed to `upload-files`: it bulk-uploads documents
  (PDF, DOCX, XLSX, ZIP, …) as much as images, and the name said otherwise. No alias keeps the old
  names, so rename:
  - `UploadImagesActionDescriptor` → `UploadFilesActionDescriptor` (`habarico.schema` and
    `habarico.schema.actions`), and its `image_field` argument → `file_field`
  - `UploadImagesActionParameters` → `UploadFilesActionParameters`, and its `image_field` → `file_field`
  - `ActionType.UPLOAD_IMAGES` → `ActionType.UPLOAD_FILES`
  - the `ActionSchema` argument `upload_image_field` → `upload_file_field`

  The generated schema changes with it: the action type is `upload-files`, its parameters sit under
  `upload_files` and the field is `file_field`. The descriptor's defaults are now the name
  `upload-files`, the label "Upload files" (translated in every bundled locale) and the icon
  `UploadFile`; an admin relying on the default name `upload-images` must update whatever refers to
  it. `GalleryBox`'s `image_field` keeps its name - a gallery does show images. The action works
  only with a frontend that contains HAB-993: one that knows only `upload-images` renders no button
  and reports no error, so upgrade the backend and the frontend together.
  (HAB-999)

- `GridFieldsBox` forwards `xs`/`sm`/`md`/`lg`/`xl` to the boxes it generates, one `grid_item` each.
  It accepted them and silently ignored them before, so `GridFieldsBox("price", "vat_rate", md=4)`
  now lays the fields out as it always read like it would. (HAB-963)

### Removed

- **BREAKING:** `GridItemBox`, the `BoxType.GRID_ITEM` value and the `GridItemBoxParameters` alias of
  `GridItem`. A grid cell is now the box that draws it, carrying `grid_item` - which is also what
  makes its card stretch to the height of its row, where a wrapper left the card at the height of
  its content. Replace `GridItemBox(md=9, boxes=[X])` with `X` carrying `grid_item={"md": 9}`, or
  with `Box(grid_item={"md": 9}, boxes=[...])` where the cell really does group several boxes. An
  override of `_get_grid_item_kwargs()` becomes an override of `_get_grid_item()` returning a
  `GridItem`. (HAB-963)

## [7.2.0] — 2026-10-19

### Changed

- The package is published to PyPI, betas as pre-release versions, and no longer to the GitLab
  PyPI registry; `eluvia-base` and `eluvia-base-django` are resolved from PyPI too. Drop the
  GitLab index for `habarico` from your `Pipfile`.

## [6.0.0] — 2026-10-10

### Added

- `ModelAdmin.default_sorting` and its `get_default_sorting(request)` hook - the order a list
  endpoint answers a request that sends no `order_by` in. Django-style (`"placed_at"` ascending,
  `"-placed_at"` descending) or a `Sorting` descriptor. Until
  now `default_sorting` was a per-view schema value only: the frontend read it and sent it back as
  `order_by`, so a client that sent none - a script, another service - was answered in whatever
  order the model's `Meta.ordering` or the database gave. A `ListViewSchemaGenerator` without a
  `default_sorting` of its own now publishes the resource's, so the frontend and the endpoint agree
  on one default. This is what the Ruby gem already did.
  (HAB-915)

- `ModelAdmin.default_page_limit` and `ModelAdmin.max_page_limit` - the page size of a resource's
  list endpoint and the largest one a request may ask for, per resource. The same two knobs
  configure every resource at once as `DEFAULT_PAGE_LIMIT` / `MAX_PAGE_LIMIT` in the
  `ADMIN_REST_FRAMEWORK` block, so the admin API is paginated independently of the rest of the
  API; unset, both defer to the Django settings of the same names that `eluvia-base-django`
  applies project wide. `"MAX_PAGE_LIMIT": None` removes the cap. Both admin attributes are
  checked when the admin is registered. New page:
  [Pagination](https://docs.habarico.com/python/basic-usage/pagination).
  (HAB-946)

- `can_read` / `can_create` / `can_update` / `can_delete` accept a **method taking the request**
  beside the bool, for per-user rules without a DRF permission class of your own.
  `has_read_permission(request)` and its `has_create_` / `has_update_` / `has_delete_`
  counterparts are their always-callable form - named after Django's own admin permission methods
  - and are what the permission class asks. Where there is no request yet (registration-time
  checks, the schema generators) a method counts as "may be allowed", so the action stays declared
  and is settled per request; a literal `False` is knowable there and drops it outright. Bools
  behave exactly as before.
  (HAB-948)

- `habarico.validators.MaxFileSizeValidator` - a declarative per-field upload size limit (Django
  and DRF ship none), attached to a file/image serializer field like any other validator:
  `AdminFileSerializer(validators=[MaxFileSizeValidator(5 * 1024 * 1024)])`. Not upload-specific -
  chunked uploads live entirely in `habarico_enterprise.uploads` (HAB-845) - so it works the same
  on a plain base64 field or a chunked one. `max_size_for_serializer_field()` is the reader other
  code derives a field's declared ceiling from.
  (HAB-965)
- `AdminFileSerializer` / `AdminImageFileSerializer` now derive `options.max_size` /
  `options.accept` from a field's own validators and expose them to the frontend automatically -
  `max_size` from `MaxFileSizeValidator`; `accept` from `FileExtensionValidator` (concrete types
  guessed from its allowed extensions), checked first, or Django's `validate_image_file_extension`
  (`image/*`) otherwise - so an `AdminImageFileSerializer` further narrowed with
  `FileExtensionValidator(allowed_extensions=["png", "jpg"])` advertises those two types, not a
  blanket `image/*` silently widened back out from the field simply being an image field. Neither
  key is emitted when it cannot be derived, and an explicit `options={"max_size": ...}` always wins
  over the derived one. `habarico.validators.content_types_for_serializer_field()` is the `accept`
  counterpart of `max_size_for_serializer_field()`.
  (HAB-966)

- Data export of the list views, in the new `habarico.export` module. It is off by default and a
  resource opts in with `ModelAdmin.export_enabled`; there is no installation-wide switch. The
  synchronous export is part of the free library; the asynchronous one for bigger exports belongs
  to `habarico-enterprise`.
  (HAB-405)
- `habarico.export` renderers: built-in `CsvRenderer` and `XlsxRenderer` behind the new optional
  `export-xlsx` extra (`openpyxl`), both streaming into a file object and escaping spreadsheet
  formulas. `ADMIN_REST_FRAMEWORK["EXPORT_RENDERER_CLASSES"]` is the registry of offered formats —
  CSV alone out of the box, and adding `XlsxRenderer` to it is what offers XLSX.
  (HAB-533)
- `habarico.export` endpoint: `ExportAdminModelViewSet` serving `GET <resource>/export/` with the
  same queryset, filters and ordering as the list view, configurable through `ModelAdmin`'s
  `export_fields` and `export_formats`. Exports above `habarico.export.views.EXPORT_ROW_LIMIT` rows are
  refused — the limit is a constant of the free library, since the answer to a bigger export is
  the asynchronous one of `habarico-enterprise`, not a higher ceiling on the request cycle.
  (HAB-532)
- `habarico.export` schema generator: `ExportActionDescriptorGenerator` derives the export action
  rendered in the `list_actions` slot of the list views from the admin's export configuration,
  and the new `habarico.export.config` accessors resolve the configuration for both the endpoint
  and the generator. New `schema.actions.get_action_name` helper reads the name of an
  actions-slot entry (a plain name or a descriptor).
  (HAB-534)
- `ModelAdmin` wires both ends of the export in, through the helpers of the new
  `habarico.export.wiring` module: `get_base_viewset()` mixes `ExportAdminModelViewSet` into the
  base viewset the admin already uses (a resource that does not export gets no endpoint at all),
  and `get_view_schemas()` appends the export action to the `list_actions` slot of the list
  views — declared generators keep their class and configuration, and an export action declared by
  hand wins. `ModelAdmin.can_export(request)` restricts the export per user: a refused request gets
  no export action in the schema and HTTP 404 from the endpoint, and `AdminPermission` maps the
  export action to `can_read`, so a resource the user may not read is not exported either. Both the
  viewset and the action generator are resolved through the `EXPORT_VIEWSET_CLASS` /
  `EXPORT_ACTION_SCHEMA_GENERATOR_CLASS` settings, which is how `habarico-enterprise` replaces them
  with the asynchronous export. `AdminConfigurationValidator` checks `export_fields` and
  `export_formats` at registration, like the other field lists. `habarico.export` has no
  package-level re-exports - a name is imported from the submodule it lives in - so importing
  `habarico` does not pull the export viewset and the renderers into the import graph of a project
  that does not export.
  (HAB-535)
- `SchemaGenerator.get_admin()` and `SchemaGenerator.get_request()` read what `bind()` put on a
  generator; `get_admin()` raises `ValueError` on an unbound generator instead of failing later
  with an `AttributeError`.
  (HAB-535)
- Extension discovery: when `habarico_enterprise.extensions` is importable, the classes it lists
  in `CONTRIBUTIONS` fill in the `DEFAULT_*_CLASS` settings, so `pip install habarico-enterprise`
  needs no `ADMIN_REST_FRAMEWORK` block at all. Contributions rank between core's defaults and the
  project's own settings, so an explicit key still wins, and
  `EXTENSION_DISCOVERY_ENABLED = False` ignores them entirely. Only the module name is known to
  core — no class of the extension is imported here — and an `ImportError` raised inside an
  installed extension propagates instead of silently disabling it.
  (HAB-811)
- `AdminAPISettings.get_instance()` — returns the shared instance of a `DEFAULT_*_CLASS` setting,
  built on first use and dropped when the settings reload. `get_field_type()` /
  `get_field_format()` / `get_filter_type()` / `get_filter_format()` now resolve through it
  (`get_field_type_resolver()`) instead of instantiating
  `DEFAULT_FIELD_TYPE_RESOLVER_CLASS` per call: one `/admin/<resource>/schema/` request went from
  88 instantiations to 1. A resolver subclass that does real work in `__init__` no longer pays for
  it on every field of every schema — but it must now be safe to share across requests.
  (HAB-811)
- `AdminSchemaGenerator.schema_class` and `AdminSchemaGenerator.get_resource_schema_kwargs()`, and
  `AdminModelViewSet.get_extra_meta()` — the extension points a pro/enterprise package uses to add
  optional keys to the resource schema and to a serialized object's `meta` block. Core contributes
  none of them.
  (HAB-811)
- Extension points that let a pro/enterprise package extend admin behavior used by every resource
  without editing core: `DEFAULT_MODEL_ADMIN_CLASS`, `DEFAULT_VIEWSET_CLASS`,
  `DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS`, `DEFAULT_ADMIN_SITE_CLASS` and
  `DEFAULT_FIELD_TYPE_RESOLVER_CLASS` settings (resolved via `ADMIN_REST_FRAMEWORK`, same
  `import_string` pattern as `DEFAULT_PERMISSION_CLASSES`), plus a
  `DEFAULT_FILE_FIELD_MIXIN_CLASS` setting replacing the hardcoded `ChunkedUploadFieldMixin`
  import in `serializers/fields.py` and `serializers/__init__.py` (a contributed mixin answers
  `is_pending_upload(value)` for its own placeholder type). Each defaults to today's core
  implementation, so behavior is unchanged unless a project overrides one of these settings.
  (HAB-811)

- `NumberFieldOptions`, `PhoneFieldOptions` and `UploadFieldOptions`, and the matching `number` /
  `phone` / `upload` slots on `FieldOptions`. All three were already emitted, but only as raw dicts
  written straight into `options` by the serializer fields and the uploads contrib, so a hand-written
  `FieldOptions` could not express them.
  (HAB-732)
- `FilterSchema.help_text`, populated from the filter, matching `FieldSchema.help_text`.
  (HAB-732)
- `dialog_width` on `ViewActionDescriptorParameters`, settable through `ActionDescriptor(view_dialog_width=...)`.
  `ViewActionParameters` already had it. (HAB-732)
- `FieldSchema.short_label`, so a serializer field can carry the shorter label the contract defines
  there. It was previously reachable only through a `FieldDescriptor`, whose dict is merged into the
  field schema. (HAB-732)
- `RelationFieldOptions.dialog_width`, sizing the dialog a relation field opens when `link_mode` is
  `dialog`. Ruby and the JS client already had it.
  (HAB-732)
- Frontend validation rules — `FieldOptions.validators`, an array of `ValidatorRule` objects
  (`{type, value, message}`, `type` one of `max_length` / `min_length` / `max_value` /
  `min_value` / `regex`). Rules are auto-extracted from the serializer field constraints
  (`max_length`, `min_length`, `max_value`, `min_value`, and the first `RegexValidator` in
  `field.validators`; `URLValidator` is skipped as its pattern is not JavaScript-compatible) and
  can be overridden per rule type via `options={"validators": [...]}` on the serializer field or
  the `Field(validators=[...])` descriptor; precedence is auto-extracted < explicit serializer
  options < descriptor. Validators are declared as a list of typed `ValidatorRule` objects —
  `MaxLengthValidatorRule`, `MinLengthValidatorRule`, `MaxValueValidatorRule`,
  `MinValueValidatorRule`, `RegexValidatorRule` — each taking `(value, message=None)`; subclass
  `ValidatorRule` (or pass `type=`) to add a custom validator. Auto-extracted rules carry no
  `message` (the frontend renders its own localized default; backend DRF messages are not baked
  into the schema) — a custom message must be set explicitly via the descriptor validators.
  Backend validation is unaffected and still always enforced.
  (HAB-445)
- Fail-fast validation of an admin declaration, run once per admin class when it is registered
  (at app startup) via `Admin.validate_configuration()`. It covers field-name lists,
  box/field/filter/sorting descriptors, class-type attributes, numeric constraints, and built-in
  CRUD action names vs. `can_*` flags, so a typo or a removed model field raises
  `ImproperlyConfigured` — naming the attribute, the value and a "did you mean" suggestion —
  instead of surfacing as an opaque traceback on the first request. The checks live in
  `habarico.validation.AdminConfigurationValidator`; point `ModelAdmin.configuration_validator_class`
  at a subclass to add or relax them, or set it to `None` to opt out.
  (HAB-553)

### Changed

- **BREAKING:** A list endpoint orders by the primary key behind whatever else it orders by - the
  client's `order_by`, the new `default_sorting`, or the model's `Meta.ordering` - with the
  `eluvia-base-django>=2.3.2` requirement this brings in. Two records tying on the sorted column
  were free to swap places between two requests, which is how a paged list repeats one record and
  skips another; they now keep a stable position. A resource that relied on the order ties happened
  to come back in will see it change - that order was never defined. `ordering_tiebreaker = False`
  on the viewset turns it off.
  (HAB-915)

- The default save action (`SaveActionDescriptor`, emitted as the `bottom_actions` of create,
  edit and action views) now renders in the `primary` colour with the `Check` icon instead of
  `success` with `Save`, matching the frontend library's own default form-action button.
  (HAB-956)
- The default label of the show action was renamed from `Preview` to `Detail` (and its
  translations updated in all twelve catalogs), so it matches the Ruby gem's `Detail` label.
  (HAB-956)

- `ADMIN_REST_FRAMEWORK["DEFAULT_PAGINATION_CLASS"]` now defaults to
  `habarico.pagination.AdminModelPagination`, a `ModelPagination` subclass resolving the page-size
  limits per admin. The response shape is unchanged. A project that points the setting at a
  paginator of its own keeps that paginator and simply does not get the per-resource limits.
  (HAB-946)

- Declared license changed from `Proprietary` to `MIT`, matching the Ruby gem and the
  MIT-licensed `react-admin` dependency used by the frontend; a `LICENSE` file was added.
  (HAB-842)
- `ModelAdmin.viewset` is built lazily (on first access) instead of in `__init__`, and
  configuration validation now runs from `validate_configuration()` — once per admin class at
  registration time — rather than on every instantiation. `AdminSite.get_admin()` / `get_schema()`
  build a fresh admin instance per request, so both used to be paid on every request. Reading
  `admin.viewset` is unchanged. (HAB-553)
- **BREAKING:** The Django URL namespace produced by `AdminSite.urls` changed from `eluvia-admin`
  to `habarico`. Any `reverse("eluvia-admin:…")` call, `{% url %}` tag or hard-coded namespace in a
  consuming app must be updated to `reverse("habarico:…")`.
  (HAB-806)

- **BREAKING:** Schema class names are aligned with the names used by `doc/openapi.yaml` (3.0.0), so
  the same entity is called the same thing in the contract, the diagram and the Python code
  (HAB-730,
  HAB-708):

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
  | `MenuViewChoice` | `ActionViewChoice` |
  | `ActionDescriptorMenuViewParameters` | `ViewActionDescriptorParameters` |
  | `GridItemParameters` | `GridItemBoxParameters` |
  | `SortingDescriptor` | `SortDescriptor` |
  | `KeyValueType` | `KeyValue` |
  | `ChoicesOptions` | `ChoicesFieldOptions` |
  | `ImageOptions` | `ImageFieldOptions` |
  | `AiOptions` | `AiFieldOptions` |
  | `RelationOptions` | `RelationFieldOptions` |
  | `Color` | `ColorType` |
  | `FieldFormat` | `FieldFormatType` |

  `Base*` becomes `Global*` because global/local is a domain concept (`/admin/schema` vs
  `/admin/{resource_name}/schema`), not an inheritance marker — `Base` stays reserved for the real
  ancestors `BaseSchema` and `BaseBox`, which keep their names. The parameter schemas of a slot
  selected by a `type` discriminator now all put the discriminator first
  (`ViewActionParameters`, like the already-conforming `SaveActionParameters`, `ListBoxParameters`,
  `ListViewParameters`). The genuine menu entities (`MenuSchema`, `MenuGroupSchema`, `MenuType`)
  keep their names — `ViewActionParameters` / `LinkActionParameters` / `ActionViewChoice` are shared
  by the menu and by actions, and stay importable from `habarico.schema`.
- **BREAKING:** The schema generators follow the schemas they build: `ResourceSchemaGenerator` →
  `LocalResourceSchemaGenerator`, `EndpointSchemaGenerator` → `EndpointsSchemaGenerator`, and the
  `ResourceSchemaGenerator.endpoint_schema_generator_class` extension point →
  `LocalResourceSchemaGenerator.endpoints_schema_generator_class`.
  (HAB-730)
- **BREAKING:** The per-resource schema response (`/admin/{resource_name}/**/schema`) emits the
  supported methods under `endpoints`, not `endpoint`, which is what the contract has always
  documented. Requires the matching frontend change; Ruby sends the old key until it is aligned too.
  (HAB-730)
- `FieldOptions.target` is now typed as `LinkTargetType` (`self` / `blank`) instead of a bare `str`.
  The value is stored without the leading underscore — `blank`, not `_blank` — and the client
  prepends it when rendering, matching `LinkActionParameters.target`.
  (HAB-708)
- **BREAKING:** The box read-only flag is called `read_only` everywhere instead of `is_readonly` —
  the `BaseBox` keyword argument, the `get_read_only()` getter, the `SchemaContext` property and the
  emitted schema key. The contract was renamed to `read_only` in the same batch so that the flag is
  spelled the same way as `FieldSchema.read_only` and `FieldDescriptor.read_only`. Host apps
  declaring boxes with `is_readonly=True` must switch to `read_only=True`. Requires the matching
  frontend change. (HAB-732,
  HAB-708)
- **BREAKING:** `FieldOptions` emits the number formatting options under the `number` key instead of
  `number_format`, completing the rename the contract made in HAB-705. The key is written straight
  into the untyped `options` dict by `AdminDecimalField`, `AdminIntegerField`, `AdminFloatField` and
  the aggregate field generator, so it was missed when the schema classes were aligned. Requires the
  matching frontend change. (HAB-732,
  HAB-708)

### Removed

- The stale `Enter an ID card in the format XXXXXXXXX.` catalog entry — no code raises it; the CZ
  ID card validator's only message is `Enter a valid ID card number.`
  (HAB-907)

- The 49 catalog entries that belong to `habarico-enterprise` (`Search with AI`, `AI Assistant`,
  the aggregation, upload, change-history and CZ localflavor messages). They were left here by the
  monorepo split: the paid package was not a Django app, so it had nowhere to keep a catalog and
  its strings were translated in this free package instead. It ships its own `locale/` from
  HAB-907 onwards, and a project that upgrades this package must upgrade it too — and add
  `habarico_enterprise` to `INSTALLED_APPS` — or those strings fall back to English. Wording this
  package uses itself (`Yes`, `No`) is untouched.
  (HAB-907)

- **BREAKING:** `DEFAULT_UPLOAD_FIELD_MIXIN_CLASSES` is renamed to `DEFAULT_FILE_FIELD_MIXIN_CLASS`
  and takes one class (or `None`) instead of a list. The mixin is spliced into
  `AdminFileSerializer` / `AdminImageFileSerializer`, so it is named after what it attaches to
  rather than after the feature that uses it — core has no notion of uploads. An extension that
  needs several mixins composes them into one class first, exactly as it already does for
  `ModelAdmin`.
  (HAB-811)
- **BREAKING:** The `DEFAULT_UPLOAD_REFERENCE_CLASSES` setting is gone. Core no longer compares a
  validated value against a configured placeholder type - it asks the field instead, through
  `is_pending_upload(value)` on the mixin contributed via `DEFAULT_UPLOAD_FIELD_MIXIN_CLASSES`.
  The mixin owns its placeholder class, so the second setting only restated what the first one
  already implied. A project that set it can simply delete the key.
  (HAB-811)
- **BREAKING:** The free library no longer emits the pro/enterprise resource-schema keys
  `global_fulltext_search_enabled`, `aggregate_enabled` and `dashboard_enabled`. They were written
  on every resource as `false` even without the features installed; all three are optional in
  `contract/openapi.yaml`, so a free-only install now omits them. `GlobalResourceSchema` no longer
  accepts them — `habarico_enterprise` declares them on its own subclass. Frontends must treat
  them as optional (`@eluvia/habarico` already does).
  (HAB-811)
- **BREAKING:** Match highlighting is gone from core: `ModelAdmin.search_highlighter_class` /
  `get_search_highlighter()` and `AdminModelViewSet.get_meta_highlights()` no longer exist, and the
  list endpoint's optional `meta.highlights` key is contributed by `habarico_enterprise` through
  `AdminModelViewSet.get_extra_meta()`. Per-resource search (`search_fields` / `SearchFilter`) is
  unaffected.
  (HAB-811)
- `validate_constraints()` no longer checks `aggregate_max_buckets`, and
  `validate_configuration()` no longer probes for a `validate_aggregate_fields()` hook. Both checks
  moved to `habarico_enterprise.validation.AdminConfigurationValidator`, which owns the attributes
  they validate; `validate_constraints()` stays as the extension point a validator subclass
  overrides.
  (HAB-811)
- **BREAKING:** CZ localflavor moved out of the free library into `habarico_enterprise` per the
  open-core boundary decided in HAB-798. `habarico.models.localflavor.cz` and
  `habarico.validators.localflavor.cz` (`CzechIcoField`, `CzechDicField`, `CzechBirthNumberField`,
  `CzechBankAccountNumber`, `CzechIdCardNumberField` and their validators) no longer exist in the
  free package — import them from `habarico_enterprise.models.localflavor.cz` /
  `habarico_enterprise.validators.localflavor.cz` instead.
  (HAB-845)
- **BREAKING:** AI integration (`contrib/ai`) moved out of the free library into
  `habarico_enterprise` per the open-core boundary decided in HAB-798. `habarico.contrib.ai` no
  longer exists — import `AIModelAdmin`, `PredictiveCharField`/`PredictiveTextField`,
  `AIAdminModelSerializer`, `AIAdminModelViewSet`, `AIAdminFilterSet` and the AI client from
  `habarico_enterprise.ai` instead. The `ai` extra (`openai`, `pyparsing`) is removed from
  `pyproject.toml` — the free install no longer pulls in either.
  (HAB-845)
- **BREAKING:** Change history (`contrib/reversion`) moved out of the free library into
  `habarico_enterprise` per the open-core boundary decided in HAB-798. `habarico.contrib.reversion`
  no longer exists — import `VersionAdmin`, `RevisionAdmin`, `VersionListBox`, `VersionSerializer`
  and `VersionFilterSet` from `habarico_enterprise.reversion` instead. The `reversion` extra
  (`django-reversion`, `dmp`) is removed from `pyproject.toml` — the free install no longer pulls
  in either. `history_fields` on `ModelAdmin` was already a plain duck-typed attribute (no core
  declaration) and is unaffected — it only has meaning once `habarico_enterprise.reversion` reads it.
  (HAB-845)
- **BREAKING:** Chunked/S3/tus uploads (`contrib/uploads`) moved out of the free library into
  `habarico_enterprise` per the open-core boundary decided in HAB-798. `habarico.contrib.uploads`
  no longer exists — install `habarico-enterprise` and point `DEFAULT_ADMIN_SITE_CLASS` /
  `DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS` / `DEFAULT_UPLOAD_FIELD_MIXIN_CLASSES` /
  `DEFAULT_UPLOAD_REFERENCE_CLASSES` at `habarico_enterprise.site.AdminSite` /
  `habarico_enterprise.schema.FieldSchemaGenerator` / `habarico_enterprise.uploads.fields` (see
  `docs/python/chunked-uploads/installation.md`). The `uploads-s3`/`uploads-tus` extras (`boto3`,
  `django-storages`) are removed from `pyproject.toml` — the free install no longer pulls in
  either, and base64 file/image uploads (`AdminFileSerializer`/`AdminImageFileSerializer`) are
  unaffected since they stay in the free library.
  (HAB-845)
- **BREAKING:** The `/aggregate` endpoint and the dashboard opt-in moved out of the free library
  into `habarico_enterprise` per the open-core boundary decided in HAB-798. `FieldAggregation` is
  no longer exported from `habarico` — import it from `habarico_enterprise` instead, and
  `AggregateFunctionType`/`GroupByType` from `habarico_enterprise.aggregations.schema` (previously
  `habarico.schema.aggregations`, which no longer exists). `ModelAdmin.aggregate_enabled` /
  `aggregate_fields` / `aggregate_max_buckets` and `dashboard_enabled` are no longer core attributes
  — they're contributed by `habarico_enterprise.admin.ModelAdmin` (`AggregateAdminMixin`) via
  `DEFAULT_MODEL_ADMIN_CLASS`, and the `/aggregate` endpoint by
  `habarico_enterprise.views.AdminModelViewSet` (`AggregateViewSetMixin`) via
  `DEFAULT_VIEWSET_CLASS`. `GlobalResourceSchema.aggregate_enabled`/`dashboard_enabled` stay in the
  free schema vocabulary — a free-only resource simply always reports both as `false`.
  (HAB-845)
- **BREAKING:** The cross-resource global search endpoint and match highlighting moved out of the
  free library into `habarico_enterprise` per the open-core boundary decided in HAB-798.
  `habarico.search` (`SearchHighlighter`) no longer exists — it lives at
  `habarico_enterprise.search.highlighter.SearchHighlighter`. `AdminSite.get_search_result()` /
  `get_search_view()` and the `/admin/search/` route (`AdminSearchView`) are no longer in core —
  they're contributed by `habarico_enterprise.site.AdminSite` (`SearchAdminSiteMixin`) via
  `DEFAULT_ADMIN_SITE_CLASS`. `ModelAdmin.global_fulltext_search_enabled`,
  `get_search_result()`/`get_search_object_data()`/`get_search_title()`/`get_search_description()`
  and `search_schema_generator_class` are no longer core attributes/methods — they're contributed
  by `habarico_enterprise.admin.ModelAdmin` (`SearchAdminMixin`) via `DEFAULT_MODEL_ADMIN_CLASS`.
  Per-resource list search (`search_fields`, `?search=…`) is unaffected and stays free — only the
  `meta.highlights` sidecar on both the list endpoint and the (now enterprise-only) global search
  endpoint requires `habarico-enterprise`: `ModelAdmin.search_highlighter_class` defaults to `None`
  in core, so `AdminModelViewSet.get_meta_highlights()` returns `None` without it.
  `GlobalResourceSchema.global_fulltext_search_enabled` stays in the free schema vocabulary — a
  free-only resource simply always reports it as `false`.
  (HAB-845)

- **BREAKING:** `ResourceActionParameters.reference`. It was set from the same variable as the
  nested `ResourceActionEndpointParameters.reference`, so the resource action carried the identical
  value twice. Only the nested one is described by the contract and read by the frontend
  (`schema.resource?.endpoint?.reference`); the outer copy was not in the JS type at all.
  (HAB-732)

### Fixed

- `default_sorting` is no longer refused at registration when it names an annotation rather than a
  model field. Where an annotation comes from is not knowable then - it may sit on the viewset's
  queryset, be added in a custom `get_queryset()`, or be attached by the ordering filter itself
  (`OrderingFilter` annotates `<field>__choice_label` inside `_order_queryset`, and any lookup
  class may do the same from `update_queryset`) - so the check refused configurations that work.
  It is gone, for the resource-level `default_sorting` and for a view generator's alike; a typo
  surfaces on the first list request as a Django `FieldError` naming the keyword. `ordering_fields`
  is still checked, now against the *lookup* of a `(key, lookup, label)` triple rather than the
  client-facing key, and tolerating annotations declared on the viewset's queryset and anything in
  its `extra_ordering_fields`.
  (HAB-915)

- A list accepts the ordering its own schema asks the frontend for: the `default_sorting` a list
  view publishes, and the primary key, which is what `serializeOrderBy` sends for a list with no
  sorting of its own. An admin narrowing `ordering_fields` refused both with
  `422 Unknown field name.` - on the first load of the list, before the user had touched anything.
  `ordering_fields` still bounds what a client may choose.
  (HAB-915)

- An unconfigured project no longer needs the `DEFAULT_PAGE_LIMIT` Django setting. Its first
  admin list request used to fail with `AttributeError`; the page size now falls back to 20 - the
  same default the Ruby gem paginates by - through `eluvia-base-django` 2.3.1.
  (HAB-946)

- `AppDensityPreference` accepts `standard` instead of `normal` as the middle UI density, matching
  the value the frontend has sent since `node@6.7.0`. `PUT` on
  `preferences.layout.app.density` answered `422` for the only value the frontend produces; a
  `normal` stored by an older frontend now fails validation on the next read, is deleted, and the
  registered default takes its place. (HAB-939)
- The `Export` action label was the one translatable string in this package with no catalog entry
  at all, so the button read `Export` in every language. Translated in all twelve, in the verb
  form each catalog already uses for an action label.
  (HAB-907)

- Admin configuration validation no longer rejects a named `FieldWrapper`: the wrapper's `name` is
  presentational and never backs a model/serializer field, so only its sub-fields are resolved
  against the model. Previously a valid named wrapper raised `ImproperlyConfigured` at
  registration, and a typo in a sub-field was masked by the wrapper-name error.

- The field schema exported `"sortable": []` instead of `false` whenever a view had no sortable
  fields. `FieldSchemaGenerator` built the flag with `self._sortable_fields and …`, so an empty
  list short-circuited to that list rather than to `False`, and only `None`/`empty` are stripped
  from the serialized schema. Because `_get_view_sortable_fields()` returns `[]` for a detail
  object, for any non-GET method and for a view without an ordering backend, practically every
  non-list endpoint was affected — and the frontend evaluates the flag as `!!sortable`, where
  `!![]` is `true`, so columns stayed sortable even when the backend could not sort by them.
  The flag is now always a boolean, and it is also emitted (as `false`) when no sortable fields
  are passed at all, as `contract/openapi.yaml` marks `sortable` required on `FieldSchema`.
  (HAB-773)
- `docs/python/aggregations/extending-aggregate-functions.md` advised subclassing
  `AggregateFunctionType`/`GroupByType`, which Python does not allow for an `Enum` with existing
  members (`TypeError: ... cannot be extended`). The page now states plainly that this isn't
  currently supported instead of giving broken advice.
  (HAB-811)
- `habarico.ModelAdmin` and `habarico.site` were resolved eagerly, as module-level assignments
  evaluated the moment Django imports the `habarico` package while iterating `INSTALLED_APPS`
  (during `AppConfig.create()`, before `apps.apps_ready` is set). With `habarico-enterprise`
  installed, `DEFAULT_MODEL_ADMIN_CLASS` resolving to `habarico_enterprise.admin.ModelAdmin`
  pulled in DRF's schema machinery at that point and crashed every management command / server
  start with `AppRegistryNotReady`. `ModelAdmin` is now resolved lazily, on first attribute
  access; `site` now defers building its `DEFAULT_ADMIN_SITE_CLASS` singleton the same way
  (wrapped in `django.utils.functional.SimpleLazyObject`, so it still behaves as one shared
  instance once built). No public API change.
  (HAB-852)

- The default `edit` and `show` actions carried no `icon`, so their buttons rendered without the
  icon the Ruby library sends for the same actions (`Edit` / `Visibility`) — `create` and `delete`
  already had theirs. Both generators now set it, and all four default actions are covered by a
  test. (HAB-825)
- `ActionSchema(type=ActionType.RESOURCE, ...)` raised `TypeError: ResourceActionParameters.__init__()
  got an unexpected keyword argument 'path'`. The branch still passed `path`, `method` and `record_pk`
  flat, from before those moved into `ResourceActionEndpointParameters`, and never passed an
  `endpoint` at all — so a resource action built through `ActionDescriptor(action=ActionSchema(...))`
  could not be constructed. The sibling branch in `ResourceActionSchema` was already correct; the two
  now match and the case is covered by a test.
  (HAB-732)
- README documented the `AdminFileSerializer` `target` option with the old HTML anchor values
  (`_blank`, `_self`, `_parent`, `_top`), contradicting the `LinkTargetType` typing on
  `FieldOptions.target`; the examples now use `blank` / `self`.
  (HAB-732)
- Replaced the unmaintained `dmp` dependency in `habarico.contrib.reversion` with the maintained
  `diff-match-patch` package to remove a `SyntaxWarning: invalid escape sequence` on import.
  (HAB-893)

### Security

- **BREAKING:** The `limit` query parameter of the list endpoints is now validated instead of
  being silently corrected: one above the maximum, a non-numeric one and a negative one are
  rejected with `422 Unprocessable Entity`, with the error attached to the `limit` field. Until
  now an oversized `limit` was truncated to `1000` and an unreadable one replaced by the default,
  so a client asking for `?limit=5000` was quietly served a page of 1000. A missing or empty
  `limit` still falls back to the default page size, and `limit=0` remains a deliberate meta-only
  request. Comes with the `eluvia-base-django>=2.3.1` requirement.
  (HAB-946)

- A `can_read` / `can_create` / `can_update` / `can_delete` declared as a **method** was silently
  ignored. `AdminPermission` read the declaration as a plain truthy value, and a bound method is
  always truthy, so an admin writing `def can_read(self, request): return request.user.is_staff`
  in the belief it was introducing a per-user rule got `list` and `retrieve` open to everyone -
  the method was never called. Declarations are now resolved through the admin, so a method is
  evaluated for the request being served. Projects already declaring a method this way will find
  it enforced from now on, which may close access that was silently open.
  (HAB-948)

- **BREAKING:** `DEFAULT_PERMISSION_CLASSES` of the admin API now defaults to
  `rest_framework.permissions.IsAuthenticated` instead of `AllowAny` — an unconfigured project no
  longer exposes anonymous CRUD over every registered model. A project that relied on the open
  default must set `ADMIN_REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"]` explicitly.
  (HAB-900)
- Added the `habarico.W001` system check, warning on `manage.py check` and server start when the
  effective `DEFAULT_PERMISSION_CLASSES` of the admin API contains `AllowAny` or is empty;
  intentional anonymous access is silenced with `SILENCED_SYSTEM_CHECKS = ["habarico.W001"]`.
  (HAB-900)
- The `_reverse_field` and `_reverse_filter` filters now permission-check the view they clone.
  Both take the target path from the client and handed it to `clone_view()`, which builds a view
  without running `dispatch()` - so no permission ever ran on it. Probing paths and ids turned the
  filters into a membership oracle over resources the caller cannot read. Three things changed:
  only URLs inside the habarico namespace resolve at all, only actions whose permission
  `AdminPermission` actually evaluates may be cloned (the generated `schema` routes are not among
  them, and cloning one passed the check without anything having been checked), and every
  rejection now comes back as the same validation error, so a missing record cannot be told apart
  from a forbidden one. Found in the
  HAB-894 security audit.
  (HAB-905)
- **BREAKING:** A lazy `f` template (`habarico.utils.f` / `LazyFString`) is no longer evaluated as a
  Python f-string. `eval` gave every template the full language *and* the builtins, so a template
  built from anything editable — a translation, a CMS label, a value from the database — was remote
  code execution. Templates now render through `str.format_map`, and each one is checked when it is
  constructed: a placeholder may be a name with `.attribute` / `[key]` hops, a conversion and a
  format spec, and no segment may start with an underscore (which is what closes
  `{obj.__class__.__init__.__globals__[...]}`). Expressions, conditionals and method calls stop
  working and raise `ValueError` at import time — compute such a value in a `get_<attr>()` schema
  getter instead. Found in the HAB-894
  security audit.
  (HAB-906)
- Updated `django` to `==5.2.17` and `djangorestframework` to `==3.17.2`, addressing the CVEs
  found in the HAB-894 security audit
  (`django`: CVE-2026-15830 and 11 further CVEs; `djangorestframework`: CVE-2026-73228,
  CVE-2026-73229).
  (HAB-896)
  (HAB-896)
- User preferences are now size-limited, mirroring the Ruby backend. A single preference value is
  capped by `HABARICO_PREFERENCES["MAX_VALUE_BYTES"]` — a dict resolved by the key, or pattern, a
  preference was registered under, falling back to its `"default"` entry (16 KB by default, 32 KB
  for `preferences.dashboard` and `*.savedQueries`) — and the number of preferences one user may
  hold by `MAX_KEYS_PER_USER` (2000). Previously neither was bounded: the pydantic models carry no
  length constraints, `SavedQueryValue.filter` is a free-form object, and the pattern keys match an
  unbounded set of names, so any authenticated user could fill the preference table with
  arbitrarily large rows, in arbitrary numbers. Both refusals are `422`. The count is checked only
  when a *new* key is created, so a user already past the limit can still overwrite or shrink what
  they stored, and stored values are never re-checked on read. A key registered by the host app
  takes the `"default"` entry unless it passes its own `max_bytes`; a `None` entry in the dict, or
  a `None` `MAX_KEYS_PER_USER`, turns that limit off. `MAX_VALUE_BYTES` is read when a preference
  is registered, like `DEFAULTS`. The defaults sit an order of magnitude above
  what the frontend writes, but
  a project that stores unusually large preferences should raise them. Found in the
  HAB-894 security audit.
  (HAB-916)

## [5.10.0] — 2026-08-03

### Fixed
- `CzechIdCardNumberValidator` now accepts the actual Czech ID document formats (9 digits, 6 digits, or 6 digits with a 2-letter series optionally followed by 2 digits, prepended or appended) instead of only 9 digits (HAB-551).

### Added
- Fulltext search highlights in list results (HAB-453).
- Sidepanel view mode and single-click row preview in list views (HAB-594).
- `export` action type with `ExportActionParameters`/`ExportActionDescriptor` and the `list_actions` slot for table utility actions in the list view schema (HAB-529).
- `bottom_actions` on all box types — renders action buttons below the box fields, replacing the previous behaviour where `toolbar_actions` was used for bottom-of-box buttons.
- `list_actions` slot on `ListBox` for utility actions (export, print, …) rendered next to the filter bar.
- `list_toolbar_actions` slot on `ListBox`, emitted as `toolbar_actions` inside the `list` params — the resource list's own table toolbar (e.g. create), separate from the box-level `toolbar_actions` which belongs to the box root (HAB-700).

### Changed
- Generalized schema getter dispatch and made box params lazily built from context (HAB-598).
- Unified terminology: `ViewModeType.MODAL` renamed to `ViewModeType.DIALOG` and the wire value changed from `"modal"` to `"dialog"`; all related docstrings, OpenAPI spec, README, and tests updated (HAB-701).
- `ListBox`: the box-level `toolbar_actions` now targets the box root (box/card header), consistent with all other box types; the table's own toolbar is set via the new `list_toolbar_actions` input, which is emitted as `toolbar_actions` inside the `list` params.

## [5.9.0] — 2026-07-09

### Added
- Nested `FieldOptions` support, with the related API update (HAB-569).

## [5.8.2] — 2026-07-06

### Fixed
- Corrected the `accept` configuration on the upload descriptor (HAB-586).

## [5.8.1] — 2026-07-06

### Added
- New parameters on the upload descriptor (HAB-586).

## [5.8.0] — 2026-07-06

### Added
- Chunked upload contrib app with S3 and tus providers (HAB-582).

### Changed
- Reworked tab/wizard box navigation parameters (HAB-586).

## [5.7.0] — 2026-06-26

Baseline for this changelog; see Git history for earlier releases.
