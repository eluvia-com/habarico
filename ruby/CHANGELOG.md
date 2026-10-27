# Changelog

All notable changes to the Habarico Ruby gem are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases are cut through the CI `next` flow: merges to `next` publish beta
pre-releases, and the `## [0.56.0] — 2026-08-03` section below is stamped with the
version and date when a release is finalized.

## [Unreleased]

### Added

- `endpoint_record_pk` on `Habarico::Action` and `Habarico::Controller#build_action_schema(action, record:, record_pk:, reference:)` - a trigger action can now open a view of, or call an endpoint on, another resource and another record, in both channels (the `meta.trigger_action` of a serialized record and the response of a custom action). `build_action_schema` takes a declared action's name or an action object and returns the complete `ActionSchema`, built by the new `trigger_action_schema_generator`, which replaces the `ResourceService` plus generator boilerplate a `get_trigger_action_schema` override used to need; the manual way keeps working (HAB-955).
- `Habarico::Response#data` - data rendered next to `meta` in the action result, as the contract's `ActionResult` allows (HAB-955).
- `after_save` on `Habarico::SaveAction`, `upload_images_data` on `Habarico::UploadImagesAction` and `view_choices` on `Habarico::ViewAction`, with `Types::AFTER_SAVE_TYPE` - schema attributes the contract and the Python library already had (HAB-955).
- `Habarico::FilterParamsResolver` and `Habarico::RecordsQuery` - the validated filter params and the record scopes of a resource (`filtered`, `list`, `find`), for an extension that selects records the way `index` does; `Habarico::RecordParamsResolver` - the writable params of a create or update and the 422 for a record that failed validation (HAB-1062).
- `fields_serializer` on the resource definition - the class reading the field values of a record, `Habarico::Serializers::FieldsSerializer` by default; a subclass adding a computed field opts it in through `serializable?` (HAB-1062).

### Changed

- **BREAKING:** A custom action's response now follows the contract's `ActionResult`: `message`, `state` and `trigger_action` are nested under `meta` instead of sitting at the top level, and `Habarico::Response#data` is merged beside it. `meta` is the only place the frontend has ever read them from, so none of the three used to reach the UI - including `state: running` for a background action, which left `Habarico::Response#action` dead code. A client reading the old top-level keys must switch to `meta` (HAB-955).
- `Habarico::Response#action` takes a `Habarico::Action` built on the spot, or a complete `Habarico::ActionSchema`, besides the name of an action declared in `actions`. A name that is not declared now raises an error listing the declared ones instead of silently sending no trigger action (HAB-955).
- **BREAKING:** `Habarico::Serializers::Serializer` is renamed to `Habarico::Serializers::FieldsSerializer` (HAB-1062).
- **BREAKING:** `Habarico::Search::FieldResolver` and `Habarico::Search::LeafField` are renamed to `Habarico::FieldPathResolver` and `Habarico::LeafField`; the resolver walks any relation path, and the `sort_by` of an `association__column` field is resolved by it too (HAB-1062).

### Removed

- **BREAKING:** The protected controller methods `sanitize_filter_params`, `apply_filtering`, `apply_search_scope`, `extract_search!`, `raise_filter_errors` and `filter_param_to_sym`; use `Habarico::FilterParamsResolver` and `Habarico::RecordsQuery`. Likewise `serialize_record`, `finalize_meta` and `list_search_highlights`, now part of `Habarico::Serializers::RecordSerializer`, and `sanitize_record_params`, `record_param_permit_spec` and `throw_validation_error`, now `Habarico::RecordParamsResolver`; an override of `render_list` takes the search query as its argument. `habarico-enterprise` up to 7.2 calls `sanitize_filter_params` in its `aggregate` action and needs the release that switches to them (HAB-1062).
- **BREAKING:** The controller class methods `serializer`, `meta_serializer` and `record_serializer`. A controller replacing the field serializer declares `fields_serializer MyFieldsSerializer` instead; one overriding `record_serializer` to let a computed field through overrides `FieldsSerializer#serializable?`. `Habarico::Serializers::RecordSerializer` is built per request by the instance method `record_serializer`, takes the definition and the request instead of a ready `meta`, builds `meta` itself and owns its `MetaSerializer` (HAB-1062).
- **BREAKING:** `Habarico::FilterParamsHelper`; `Habarico::FilterParamsResolver` separates the search from the filter params itself (HAB-1062).

### Fixed

- `save` action parameters are generated from `after_save` alone, not only when `data` is set; the parameters used to be dropped whenever `data` was empty (HAB-955).
- A `view` or `resource` action whose name is a standard one (`show`, `create`, `update`, `delete`) but which names its own target through `endpoint_reference` / `endpoint_record_pk` now keeps its endpoint - and, for a resource action, its path - in the generated schema. The target used to be dropped, leaving the frontend on the resource and record the action ran on (HAB-955).
- The `preferences.dashboard` widget layout validates the optional `stackedH`, `minW` and `minH`
  as integers of at least 1, matching the `WidgetLayout` contract schema (HAB-1007).
- `default_filter` receives `current_user` on the detail endpoints (`show`, `update`, `destroy` and custom detail actions) as it does on the list, so a filter depending on the user no longer lets a record the list hides be reached by its ID (HAB-1062).

## [7.2.0] — 2026-10-19

### Changed

- The gem is published to rubygems.org, betas as pre-release versions, and no longer to
  geminabox.eluvia.dev; `eluvia-base` is resolved from rubygems.org too. Drop the geminabox
  `source` block for `habarico` from your `Gemfile`.

### Fixed

- `meta.schema` of a record (list, detail, create and update responses) is emitted in snake_case
  like the rest of the response and the schema endpoints, instead of camelCase. The keys inside it
  that the host declares itself, such as an action's `view_parameters`, now reach the client
  exactly as declared (`object_id`, not `objectId`). `@eluvia/habarico` reads both forms.
  (HAB-1022)

## [1.0.0] — 2026-10-10

### Added

- `Habarico::FileValidations` - derives the `max_size` / `accept` field-schema options for any
  `file_attr` from the `content_type:` / `size:` validations a host declares on its underlying
  attachment with the optional `active_storage_validations` gem (not a dependency of this gem - a
  host that does not use it simply declares none, and both options stay unset). Not
  upload-specific: chunked uploads live entirely in `habarico_enterprise/uploads`, but every
  `file_attr` now gets `max_size` / `accept` in its schema, with or without that gem installed.
  `habarico_enterprise.uploads`, when installed, additionally folds its project-wide upload size
  ceiling into `max_size` for a field a chunked-upload provider serves.
  (HAB-966)
- `Habarico::FieldReference#max_size` / `#accept` - overrides a `file_attr`'s derived upload
  limits by hand, the same way `resize_width` / `icons_key` already do for their own options. A
  bare symbol field declaration has no such override; only a `FieldReference` does.
  (HAB-966)

- `default_page_limit` and `max_page_limit` in the resource DSL - the page size of a list endpoint
  and the largest one a request may ask for, per resource. The same two knobs configure every
  resource at once as `Habarico::Config.default_page_limit` / `.max_page_limit`; unset, both defer
  to `eluvia-base` (its `set_pagination` default of 20 and `Eluvia::Base::Config.max_page_limit`,
  which is also where the ceiling can be removed with `nil`). New page:
  [Pagination](https://docs.habarico.com/ruby/basic-usage/pagination). (HAB-946)

- Extension points that let the paid gem register itself without this gem referencing it
  (HAB-812):
  - `Config.search_highlighter_class` — class building `meta.highlights`, `nil` by default;
  - `Types.register(list_name, *values)` with `Types::EXTENSIBLE` — adds values to `FIELD_TYPE`,
    `FIELD_FORMAT_TYPE`, `BOX_TYPE` and `ACTION_TYPE` and re-declares the enum on every schema
    class built from them. The other lists stay frozen: they mirror a closed contract enum;
  - `Habarico::ExtensibleEnum` — the `extensible_enum_attr` declaration that records a schema class
    as a consumer of such a list.
  - `RoutingService.register_resource_route_block` — route blocks drawn inside each resource's own
    route block, which is what the aggregate endpoint needs (the existing
    `register_route_block` only reaches the admin-site root).
  The preferences registry already existed and is unchanged.

- `color` on menu items and menu groups (`MenuSchema`, `MenuGroupSchema`), settable from the DSL via `Habarico::MenuItem#color` and validated against `Types::COLOR_TYPE`. Python and the JS client already had it (HAB-732).
- `Habarico::Types` module holding the shared enum value lists (`COLOR_TYPE`, `VIEW_MODE_TYPE`, `FIELD_FORMAT_TYPE`, …), each named after its contract enum. Schema classes reference these instead of repeating the values inline, which is what used to let the same enum drift apart between classes (HAB-732).

### Changed

- The default save action (`SaveAction`, emitted as the `bottom_actions` of create, edit and
  action views) now defaults to the `primary` colour with the `Check` icon instead of `success`
  with `Save`, matching the frontend library's own default form-action button
  (HAB-956).

- **BREAKING:** The `limit` query parameter of a list endpoint is now bounded and validated, with
  the `eluvia-base >= 3.39.0` requirement this brings in (HAB-946). A `limit` above the maximum
  (1000 unless configured), a non-numeric one and a negative one are rejected with
  `422 Unprocessable Entity`, the error attached to the `limit` field - until now `?limit=99999999`
  reached Kaminari unchecked. `?limit=0` no longer raises `ZeroDivisionError`: it is a deliberate
  meta-only request, answering with the `meta` block and no records, as it already does in the
  Python library. A missing or blank `limit` still falls back to the default page size. (HAB-946)
- `index` resolves its pagination in `set_list_pagination` instead of an inline `before_action`
  lambda, so the callback reads like the others and the resolved limits can be overridden by a
  host controller. (HAB-946)

- **BREAKING:** The `order_by` query parameter of a list endpoint is now strictly validated, by the
  same `eluvia-base >= 3.39.0` (HAB-915). An entry has to be exactly `field:direction`: a third
  segment is no longer dropped silently (`name:asc:desc`), and a direction is case-sensitive, so
  `name:ASC` is refused instead of read as ascending - the Python backend has always refused both.
  The wording and the keys of those two errors come from `eluvia-base` now, a malformed entry on
  `order_by` and a bad direction on `order_by__<field>`, which is why
  `habarico.errors.order_by.invalid_value` and `.unknown_direction` are gone from the locale files
  along with the checks that used them. An integration sending anything but
  `field:asc` / `field:desc` needs correcting; the frontend only ever sends that form. (HAB-915)
- **BREAKING:** `default_sorting` is no longer `'created_at:asc'` by default - a resource that
  declares none is ordered by the primary key alone. No column is assumed to exist on the model:
  the old default made a model without `created_at` answer `422` on every list request, and made
  every other resource carry a sort key it had never asked for. A resource that wants the old
  ordering declares `default_sorting 'created_at:asc'`. A list view with nothing to sort by
  publishes no `default_sorting` in its schema now, rather than a descriptor with no field name.
  (HAB-915)
- **BREAKING:** The ordering of a list is broken on the primary key rather than on `created_at`.
  Records that tie on the column being sorted by therefore come back in a different order than
  before - and in a stable one, since the primary key is unique where a timestamp is not, so a page
  no longer repeats one record and skips another. A resource that wants `created_at` in the
  ordering names it in `default_sorting`; `list_order_by_tiebreaker` is the controller hook behind
  the choice. (HAB-915)
- A resource declaring `force_sorting true` no longer refuses an `order_by` it is about to ignore:
  the parameter is not read at all there, so a request carrying one is served with the forced
  ordering instead of answering `422`. (HAB-915)
- The box schema generator emits an unset `card` as `nil` instead of coercing it to `false`. `card`
  is three-state in the contract now, where `false` means "never a card" - keeping the coercion
  would have stripped the card off every labelled box. Set `card: false` explicitly to render a box
  card-less with its label as a plain section heading. (HAB-827)
- `Search::SearchMatcher::COMBINING_MARK` moved from `SearchHighlighter` into the free matcher that
  needs it, so no free code reaches into the paid layer.
  (HAB-812)
- The gemspec no longer sets `allowed_push_host`, so the MIT gem can be published to rubygems.org,
  and its `source_code_uri` / `changelog_uri` point at the public repository.
  (HAB-812)

- **BREAKING:** Moved `Habarico::Serializer`, `Habarico::MetaSerializer`, and `Habarico::RecordSerializer` into `lib/habarico/serializers/` and renamed them to `Habarico::Serializers::Serializer`, `Habarico::Serializers::MetaSerializer`, and `Habarico::Serializers::RecordSerializer` (HAB-614).
- **BREAKING:** Habarico no longer depends on `eluvia-auth`. `Habarico::Controller` and `Habarico::ApplicationController` now call an `authenticate_request` hook (`Habarico::Authenticatable`) instead of hardcoding `Eluvia::Auth::AuthHandler#authenticate`. Host apps must implement `authenticate_request` (and `current_user`) in their own `ApplicationController` — e.g. `def authenticate_request; authenticate(['public']); end` to keep using `eluvia-auth` — or point the new `config.authenticate_method` setting at an existing no-argument auth method (e.g. `config.authenticate_method = :authenticate_user!`) to skip the wrapper entirely. Habarico's own schema/search endpoints can inherit a host app's authentication automatically via the new `config.base_controller_class` setting (HAB-830).
- **BREAKING:** `Habarico::ReflectionHelper` reflection methods no longer carry a vendor name and are named after the base module they test, matching their `is_active_model_*` / `is_active_record_*` siblings: `is_eluvia_model_class?` → `is_attributes_model_class?`, `is_eluvia_model_instance?` → `is_attributes_model_instance?`. Host apps calling either method must rename the call; behaviour is unchanged (HAB-806).
- **BREAKING:** Parameter schemas now use discriminator-first word order to match the contract, together with their `*Generator` classes and DSL generator attributes: `ViewListParameters` → `ListViewParameters`, `ViewDetailParameters` → `DetailViewParameters`, `ActionResourceParameters` → `ResourceActionParameters`, `ActionSaveParameters` → `SaveActionParameters`, `ActionResourceEndpointParameters` → `ResourceActionEndpointParameters`, `ActionViewParameters` → `ViewActionParameters`, `ActionLinkParameters` → `LinkActionParameters`, `ActionViewEndpointParameters` → `ViewActionEndpointParameters` (HAB-732, HAB-708).
- **BREAKING:** Renamed the remaining schema classes to their contract counterparts: `EndpointMethodSchema` → `MethodSchema`, `EndpointSchema` → `EndpointsSchema`, `EnumItemSchema` → `EnumType`, `ConfirmDialogSchema` → `ConfirmDialogProperties`, `ListBoxSortableParameters` → `SortableParameters`, `KeyValueType` → `KeyValue`, `MenuViewChoice` → `ActionViewChoice`, `ActionDescriptorMenuViewParameters` → `ViewActionDescriptorParameters`, and `ChoicesOptions` / `ImageOptions` / `AiOptions` / `RelationOptions` / `PhoneOptions` / `NumberFormatOptions` → `ChoicesFieldOptions` / `ImageFieldOptions` / `AiFieldOptions` / `RelationFieldOptions` / `PhoneFieldOptions` / `NumberFieldOptions` (HAB-732).
- **BREAKING:** `LocalResourceSchema` now emits its endpoint map under the `endpoints` key instead of `endpoint`, as the contract has always described; the Python library switches in 6.0.0 under HAB-730 (HAB-732).
- **BREAKING:** `FieldOptions` now emits the number formatting options under the `number` key instead of `number_format`, matching the contract (HAB-732).
- **BREAKING:** `ViewEndpointParameters` now matches the contract: it carries `path` and no longer carries `record_pk`. `path` is set only for action views — standard views are served from the standard resource path, which the frontend derives on its own. `record_pk` belongs to the action and menu endpoint parameters, which target a record from elsewhere; on a view endpoint it was never read by any client. The path itself was already implemented in `ViewEndpointParametersGenerator#generate_path`, it was simply never wired into the generated model (HAB-732).
- **BREAKING:** `FieldOptions.target` is now an enum over `LinkTargetType` (`self` / `blank`) instead of an untyped string, matching `LinkActionParameters.target` and the contract. The value is stored without the leading underscore — pass `blank`, not `_blank`; the frontend prepends it when rendering (HAB-732).
- `MenuSchema.view` / `.link` now reference the shared `ViewActionParameters` / `LinkActionParameters`; the contract has a single schema serving both menu items and actions (HAB-732).

### Removed

- **BREAKING:** The paid features moved out of this gem into `habarico-enterprise`
  (HAB-812):
  - change history — `habarico/contrib/paper_trail` no longer exists; install the paid gem and
    `require "habarico_enterprise/paper_trail"` instead (the `Habarico::Contrib::PaperTrail::*`
    constants are now `HabaricoEnterprise::PaperTrail::*`; translation keys keep their names);
  - the cross-resource spotlight search — `GET /search`, `SearchService`, `SearchHighlighter`,
    `SearchResourceSchema` and its generator, and the `global_fulltext_search_enabled` DSL option
    and schema key. Per-resource search (`search_fields`) stays free and unchanged; a list response
    simply carries no `meta.highlights` without the paid gem;
  - aggregations and the dashboard — the `/{resource}/aggregate` endpoint and its schema route,
    `AggregateService`, `AggregateSchema`/`AggregateFieldSchema` and their generator,
    `AggregateFieldDefinition`, the `aggregate_enabled` / `aggregate_max_buckets` /
    `aggregate_fields` / `aggregate_schema_generator` / `dashboard_enabled` DSL options,
    `validate_aggregate_fields!` and the two schema keys. This matches the Python split, where
    aggregations and the dashboard are paid;
  - chunked/direct uploads — `habarico/contrib/uploads` no longer exists (it only ever shipped in
    the 0.57.0 betas). Install the paid gem and `require "habarico_enterprise/uploads"` instead;
    the `Habarico::Contrib::Uploads::*` constants are now `HabaricoEnterprise::Uploads::*`,
    `Habarico::UploadOptions` is `HabaricoEnterprise::UploadOptions`, the S3 endpoints are drawn
    by the routing service instead of being mounted by hand (drop the `post "uploads/…"` lines
    from `config/routes.rb`), and the tusd helper scripts move to `scripts/` in the
    `habarico-enterprise` repository. Base64 file/image uploads stay free and unchanged,
    as does the `{filename:, content:, upload_key:}` permit spec on file fields — a free-only
    install simply emits no `options.upload` block. This matches the Python split, where chunked
    uploads are paid.

  User preferences stay free in full, including the `preferences.dashboard` key and the
  `*.savedQueries` pattern — same as Python, where both live in the free `contrib.preferences`.

- **BREAKING:** Duplicate `MenuViewParameters`, `MenuLinkParameters` and `MenuViewEndpointParameters` schema classes - use the shared `ViewActionParameters`, `LinkActionParameters` and `ViewActionEndpointParameters` instead (HAB-732).
- **BREAKING:** `ActionResourceSchema` - the action schema routes now return a `LocalResourceSchema`, which is what the contract describes for them (HAB-732).

### Fixed

- A list accepts the ordering its own schema asks the frontend for. The list view schema publishes
  `default_sorting` - the resource's or the view's - and the frontend puts exactly that, or the
  primary key for a list with no sorting of its own, into `order_by` on the first request; the
  whitelist refused all three unless the field happened to be declared in `fields` too. A resource
  not listing `created_at` among its fields therefore answered `422`
  (`order_by__created_at` - "Unknown field name.") on the very first load of its list, since
  `created_at:asc` is the default `default_sorting`. `sorting_fields` still bounds what a client
  may choose, but no longer refuses what the backend orders by regardless. (HAB-915)
- A list endpoint of a model without a `created_at` column can be listed at all. `created_at:asc`
  was appended to the ordering of every list request, hardcoded and not configurable, so such a
  resource answered `422` (`order_by__created_at` - "Does not exist.") on every `GET` - or a
  database error, on a model whose relation has no `order_2`. Ties are now broken on the primary
  key instead, which is unique and which every model has. (HAB-915)
- A request sorting by the column the ordering falls back to kept the fallback's direction, not its
  own: the fallback was concatenated onto the ordering before it was parsed into a hash keyed by
  field name, so `?order_by=created_at:desc` answered *ascending*. The tiebreaker is appended after
  the ordering is resolved now and leaves a field it already names alone. (HAB-915)

- A list can be sorted by everything its schema advertises as `sort_by`, not only by a declared
  field that is also a column of the model: the lower bound of a range field, a column reached over
  an association declared in a list view (`author__name`), a `sort_by` written on a
  `FieldReference` by hand, and a virtual column registered with `order_attr`. The frontend sorts
  by exactly the `sort_by` it is given, so those columns answered `422` on their own sort link.
  (HAB-915)
- Every unknown field name in one `order_by` is reported in a single `422`, the way the Python
  backend answers, instead of only the first one. (HAB-915)
- `?order_by=` (empty) answered `500`. It is read as "not supplied" now and falls back to
  `default_sorting`. Note the difference from the Python backend, where an empty `order_by` means
  "do not sort at all": a Kaminari scope always needs an ordering. (HAB-915)
- A `default_sorting` with a stray third segment (`placed_at:asc:desc`) described itself to the
  frontend with the direction of the *last* segment while the backend ordered by the second one.
  Both read the second one now. (HAB-915)

- `Schemas::APP_DENSITY` accepts `standard` instead of `normal` as the middle UI density, matching
  the value the frontend has sent since `node@6.7.0`. `PUT` on
  `preferences.layout.app.density` answered `422` for the only value the frontend produces; a
  `normal` stored by an older frontend now fails validation on the next read, is deleted, and the
  registered default takes its place. (HAB-939)

- The built-in `:search` toolbar filter now generates its schema with `format: 'search'` instead of `nil`, so the frontend renders it with the dedicated `SearchField`/`SearchInput` component instead of falling back to the generic text input. (HAB-814)
- README documented `link_target: '_blank'` for `LinkAction` and `LinkMenuItem`, contradicting the `self` / `blank` enum on `LinkActionParameters.target`. The frontend prepends the underscore itself (`window.open(url, "_" + target)`), so the documented value produced a `__blank` window name; the examples now use `blank` (HAB-732).
- README described the field-level `target` as a "target resource name for nested/related fields", conflating it with a box's `target`. It is the link target of a clickable field, matching `FieldOptions.target` in the contract (HAB-732).
- `GlobalResourceSchema` referenced the non-existent `Habarico::BaseResourceActionSchema` and `Habarico::BaseViewSchema`, and `MenuViewParameters` referenced a non-existent `Habarico::MenuEndpointParameters`; all three now resolve (HAB-732).
- Bumped minimum `eluvia-base` gemspec dependency from `>= 3.34.0` to `>= 3.37.0`; earlier versions lack `Eluvia::Serializers::FieldsetSerializer`, which Habarico requires, causing host apps to fail to boot (HAB-892).

### Security

- **BREAKING:** Denying `can_read` now really denies read, matching the Python backend: `show`
  requires `can_read` (previously fetching by ID bypassed it entirely), and `index` without
  `can_read` is forbidden outright instead of silently degrading into an `id__in`-only mode. The
  implicit `id__in` fallback becomes an explicit opt-in - the new `allow_read_by_id` DSL option
  (default `false`) re-opens ID-based reads for a resource without read permission: `show` by ID
  and the `id__in`-only `index` mode. **Migration:** a resource that other services resolve
  references against without list access (`ReferenceField` label resolution via `id__in`) must now
  set `allow_read_by_id true`, otherwise those lookups return 403. Additionally, `set_record`
  (backing `show`/`update`/`destroy`) now applies `policy_scope`, like `index` already did, instead
  of only `default_filter` - a record outside the Pundit scope (a different tenant, a soft-deleted
  row, ...) can no longer be read or mutated by guessing its ID, regardless of `allow_read_by_id`.
  (HAB-899)
  (HAB-899)
- User preferences are now size-limited. A single preference value is capped by
  `Habarico::Contrib::Preferences.max_value_bytes` — a hash resolved by the key, or pattern, a
  preference was registered under, falling back to its `"default"` entry (16 KB by default, 32 KB
  for `preferences.dashboard` and `*.savedQueries`) — and the number of preferences one user may
  hold by `max_keys_per_user` (2000). Previously neither was bounded: the registered JSON Schemas
  carry no `maxLength`/`maxItems`, a saved query's `filter` is a free-form object, and the pattern
  keys match an unbounded set of names, so any authenticated user could fill the
  `habarico_user_preferences` table with arbitrarily large rows, in arbitrary numbers. Both
  refusals are `422`. The count is checked only when a *new* key is created, so a user already
  past the limit can still overwrite or shrink what they stored, and stored values are never
  re-checked on read. A key registered by the host app takes the `"default"` entry unless it
  passes its own `max_bytes:`; a `nil` entry in the hash, or a `nil` `max_keys_per_user`, turns
  that limit off. `max_value_bytes` is read when a preference is registered, like `defaults` —
  set it before `require "habarico/contrib/preferences"`. The defaults sit an
  order of magnitude above what the frontend writes, but an app that stores unusually large
  preferences should raise them. Found in the
  HAB-894 security audit.
  (HAB-916)

## [0.56.0] — 2026-08-03

### Added
- Query param `fields` for selecting which top-level fields (and `meta`/`meta.schema`: repr/schema/tags/trigger_action, name/label/pk_field_name/actions) are returned in serialized responses, with `__all__`/`__default__` wildcards, matching the Python implementation (HAB-614).
- Nested `fields` grammar (`relation(subfield,...)`) now parses for relation fields too, laying the groundwork for future nested relation serialization; covered by parity tests against the Python behavior (HAB-621).
- Box-level `toolbar_actions` on any box (`BoxSchema`), rendered in the box's local toolbar (box header / card header area); on a tab/wizard container they appear on the last step (HAB-622).
- `bottom_actions` on any box (`BoxSchema`), rendering action buttons below the box fields - similar to form submit buttons at the view level (HAB-700).
- `list_actions` slot on list box and list view (`ListBoxParameters`, `ViewListParameters` / `ListViewSchemaParameters`) for utility actions (export, print, …) rendered next to the filter bar, separate from row and toolbar actions (HAB-700).
- `list_toolbar_actions` on `ListBox`, emitted as `toolbar_actions` inside the `list` params - the resource list's own table toolbar (e.g. create), separate from the box-level `toolbar_actions` which belongs to the box root (HAB-700).
- `collapsible` flag on boxes (`open`/`closed`) making any box collapsible with a default expanded/collapsed state (HAB-622).
- `TabBoxParameters` (`show_toolbar_navigation`) and `WizardBoxParameters` (`show_toolbar_navigation`, `validate_steps`) for tab and wizard boxes, plus a new `WizardBox` box type (HAB-622).
- Configurable `inline` on array box (`ArrayBoxParameters`), defaulting to inline unless the box contains nested boxes (HAB-622).
- `single_click_action` and `double_click_action` on list box and list view (`ListBoxParameters`, `ViewListParameters`), each an `ActionDescriptor`; a plain action name is normalized into a descriptor (HAB-613).
- `keep_linked_parent` on action view parameters (`ActionDescriptor.view` and `ActionSchema.view`), settable from the DSL via `view_keep_linked_parent` (HAB-613).
- `sidepanel` presentation mode for action/menu views (`mode` enum) (HAB-613).
- `mode` on the view schema (`GlobalViewSchema` / openapi `BaseViewSchema`) advertising a view's default presentation mode (`redirect`/`dialog`/`sidepanel`) for triggers that open it without their own mode; set from the DSL via `view_mode` (HAB-613).
- Typed fulltext search: `search_fields` DSL and `FieldResolver` (HAB-600), result highlighting via `SearchHighlighter` (HAB-601), and a Habarico-owned `SearchMatcher` replacing the eluvia-base filter (HAB-602).
- Optional PaperTrail change-history contrib module (HAB-498).
- Optional user-preferences contrib module (`habarico/contrib/preferences`): per-user, JSON-Schema-validated key/value store with `user-preferences` REST endpoints, a preference registry (exact + pattern keys), built-in base preferences, and an install generator - parity with the Python `habarico.contrib.preferences` app (HAB-706).

### Changed
- Renamed detail view `form_actions` to `bottom_actions` (`DetailViewSchemaParameters`) (HAB-622).
- `ListBox`: the box-level `toolbar_actions` now targets the box root (box / card header), consistent with all other box types; the table's own toolbar is set via the new `list_toolbar_actions` input, which is emitted as `toolbar_actions` inside the `list` params (HAB-700).

### Fixed
- Custom (non-standard) `can` permission callables are now invoked with a consistent `(permission, context)` argument order in the list/global schema, matching the documented API and the per-record check; previously the two were swapped without a record, hiding custom-permission actions from the list/global schema (HAB-603).
- Object-level action meta (`ObjectResourceSchema#actions`) no longer differs depending on whether it was returned by the list or the detail/update endpoint; record-bound actions like `delete` are now always included regardless of `show_in_detail`, fixing row actions disappearing after an edit-modal save.

### Removed
- `show_save_button` / `show_next_button` on tab item box (and `TabItemBoxParameters`); tab and wizard navigation is now controlled by the container's `show_toolbar_navigation` / `validate_steps` (HAB-622).
- Filter `is_in_toolbar` flag; filters now expose only `is_always_on` (always visible) (HAB-613).
- `keep_linked_parent` from `ListBoxParameters`; it now lives on the action view parameters instead (HAB-613).

## [0.52.0] - 2026-07-09

### Added
- Support for nested field options in `fieldOptions` (HAB-571).

## [0.51.0] - 2026-06-26

### Added
- Type metadata for `any_attr` (HAB-564).
- `icon` on `EnumItemSchema`, plus `time` and `czech-id-card-number` field types (HAB-478).

### Fixed
- Default filter no longer overridden by request filters (VD-2651).
- Per-record permission handling (VD-2625).

### Changed
- Removed the built-in Czech ID card format (HAB-478).
- Updated documentation (HAB-483).

## [0.50.1] - 2026-06-18

### Changed
- Use the latest `v1` of ci-toolbox.

## [0.50.0] - 2026-06-10

### Added
- Polymorphic field/box support (HAB-519).
- Gallery box (HAB-481).
- Object box type (HAB-480).
- Save action type (HAB-479).
- Trigger action and search endpoint (HAB-482).
- Extended `FieldOptions`/`BoxOptions`, `ListBoxParameters`, `ActionDescriptor` and `FieldDescriptor` (HAB-475, HAB-477).
- `Gemfile.lock` and a pinned Ruby version.

### Fixed
- Search moved to a dedicated service (HAB-482).
- Type fixes for field descriptors (HAB-475).

## [0.49.4] - 2026-05-29

### Fixed
- `NoMethodError` by replacing `view.fields` with `view.boxes` (VD-2615).

## [0.49.3] - 2026-05-22

### Fixed
- Validation fix (VD-2587).

## [0.49.2] - 2026-05-22

### Fixed
- Validation fix (VD-2587).

## [0.49.1] - 2026-05-22

### Fixed
- Filter controller fix (VD-2587).

## [0.49.0] - 2026-05-14

### Added
- Validation of the `order by` parameter (HAB-486).
- Error raised for missing filters (HAB-486).
- Unified boxes and fields into a single polymorphic `boxes` collection (HAB-255).
- Documented rich text syntax in the README (HAB-495).

## [0.48.0] - 2026-04-20

Baseline for this changelog; see Git history for earlier releases.
