# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Habarico** is an MIT-licensed Ruby gem (Rails engine) that generates schema-driven admin interfaces for Rails applications. It exposes a DSL for defining resources in controllers and produces JSON schemas consumed by a frontend. Version is managed in the plain-text `VERSION` file (via pydev, file type `text`).

The paid features — change history, the cross-resource spotlight search with match highlighting, aggregations and the dashboard, and chunked tus/S3 uploads — live in the separate `habarico-enterprise` gem (a repository of its own, commercial licence). This gem never references it: the paid gem registers itself through the extension points (`Config.search_highlighter_class`, `Types.register`, `RoutingService.register_route_block`, `register_resource_route_block`, `Eluvia::Uploads.finalizer` plus `prepend` onto `FieldOptionsGenerator` / `GlobalResourceSchemaGenerator`). See HAB-812.

- **Gem host**: rubygems.org for this gem; the paid gem is published privately (channel still open, HAB-812)
- **Rails**: 7.0+
- **Key dependencies**: `pundit` (authorization), `kaminari` (pagination), `eluvia-base`. Authentication is not bundled — host apps implement `authenticate_request` in their `ApplicationController` (or point `config.authenticate_method` at an existing method), see `lib/habarico/authenticatable.rb`.

## Changelog

Keep `CHANGELOG.md` up to date. Whenever you make a user-facing change (feature,
fix, or behavior/API change), add an entry under the `## [Unreleased]` section in
the appropriate `### Added` / `### Changed` / `### Fixed` / `### Removed` group.
Write a one-line, English entry and reference the YouTrack issue in parentheses
(e.g. `- Support for nested field options (HAB-571).`). Do NOT add a version header
or date under `[Unreleased]` — the CI `next` release flow stamps `## [Unreleased]`
with the version and date when a release is finalized. Skip changelog entries only
for internal-only changes (tests, refactors, CI, tooling) that don't affect gem users.
A page in `docs/` is described by the entry of the change it documents, in the same merge request;
a documentation-only fix gets no entry of its own.

## Commands

```bash
bundle install                # Install dependencies
bundle exec rake build        # Build the gem (.gem file in pkg/)
bundle exec rake install      # Build and install gem locally
bundle exec rake test         # Run all tests
bundle exec rake statistics   # Code statistics
bundle exec rake release      # Release to rubygems.org
```

## Testing

Minitest via `rake test`. `test/unit/**` runs against duck-typed stubs, `test/integration/**` boots a
real ActiveRecord stack on in-memory SQLite (`test/integration/integration_helper.rb` registers a
Ruby `unaccent` shim, since that function is a PostgreSQL extension), and `test/contrib/**` covers
the opt-in modules.

**Test data is English** — labels, titles, record names, fixture values. The full rule, its
exceptions (a test asserting a locale catalog keeps its Czech string) and the diacritics/locale traps
are in the repository-root `CLAUDE.md` ("Tests").

## Code Quality

RuboCop is configured in `.rubocop.yml`. Run with `--no-parallel` to avoid memory issues in constrained environments.

```bash
bundle exec rubocop --no-parallel               # Check all files
bundle exec rubocop --no-parallel -a            # Safe autocorrect (formatting, style)
bundle exec rubocop --no-parallel -A            # Unsafe autocorrect (logic transforms — review diff afterwards)
bundle exec rubocop --no-parallel path/to/file  # Check a single file
```

Key decisions baked into `.rubocop.yml`:
- **Metrics cops** (method/class length, complexity) are relaxed — generator dispatch methods are intentionally long and handle exhaustive type variants in one place. All metrics cops are disabled entirely for `test/**/*`.
- **Formatting alignment cops** (`Layout/ArgumentAlignment`, `Layout/HashAlignment`, etc.) are disabled — no formatter is currently enforced, so these would require constant manual upkeep.
- **`Style/ClassVars`** disabled — `@@resources` etc. in config are intentional module-level inherited shared state, not accidental class variable usage.
- **`Naming/PredicatePrefix`** disabled — `is_create_possible?` / `is_update_possible?` etc. are public API hooks; renaming would be a breaking change for host apps.
- **`Lint/NestedMethodDefinition`** disabled — `def _draw_routes` inside `Rails.application.routes.draw` is a standard Rails routing pattern, not a true nested method definition.
- **`Naming/VariableNumber`** disabled — `filter_2!`, `order_2` etc. match versioned method names in the host app API.
- Many cops producing cosmetic noise (empty lines, trailing commas, string quote style) are disabled to avoid large low-value reformatting commits.

## Architecture

The library has 6 major layers that work in sequence:

### 1. Definition DSL (`lib/habarico/definition/`)
Provides a fluent DSL used inside Rails controllers to declaratively describe a resource's schema: its fields, views, actions, filters, boxes (layout containers), and menu items. Core class is `Definition` (~48 configurable attributes). Subclasses cover `Action`, `View`, `Box`, `MenuItem`, and `Reference` types.

### 2. Controller Concern (`lib/habarico/controller.rb`)
`Habarico::Controller` is an `ActiveSupport::Concern` included in host app controllers. It implements standard CRUD actions (`index`, `show`, `create`, `update`, `destroy`) and schema endpoints. Integrates the base library's `ErrorHandler` and `PaginationHandler`, and requires authentication via the `Habarico::Authenticatable` concern's `authenticate_request` hook (host apps implement it in their `ApplicationController` — Habarico is authentication-agnostic). Exposes hooks: `complement_record_params`, `is_update_possible?`, `is_delete_possible?`.

### 3. Services (`lib/habarico/services/`)
Three singletons:
- **ResourceService** — maps resource names/paths from the config
- **RoutingService** — dynamically draws Rails routes (`config/routes.rb` just calls `RoutingService.instance.draw_routes`)
- **SchemaService** — orchestrates schema generation for a given resource

### 4. Generators (`lib/habarico/generators/`)
Transform a `Definition` object into plain Ruby schema objects. Organized into: action, endpoint, menu, resource, and view generators. Each generator produces a corresponding schema object.

### 5. Schema Models (`lib/habarico/schema/`)
Plain Ruby objects (no ActiveRecord) that mirror the structure of the JSON API response. Parallel structure to generators: action, endpoint, menu, resource, view schemas.

### 6. Supporting Components
- **Serializer** (`lib/habarico/serializer.rb`) — converts ActiveRecord records to JSON using schema metadata
- **Resolvers** (`lib/habarico/resolvers/`) — `FilterParamsResolver` and `RecordParamsResolver` check request params against the resource
- **Queries** (`lib/habarico/queries/`) — `RecordsQuery` builds the list and detail scopes
- **Context** (`lib/habarico/context.rb`) — per-request object holding user, record, permissions
- **Config** (`lib/habarico/config.rb`) — global gem config (resources array, URL prefix, routing scope, currency)
- **Helpers** (`lib/habarico/helpers/`) — `ActionHelper`, `AttributesHelper`, `BoxHelper`, `CallableHelper`, `ReflectionHelper`

### Data Flow

```
Host controller includes Habarico::Controller
  → Controller DSL builds a Definition object
  → SchemaService passes Definition to Generators
  → Generators produce Schema objects
  → Schema objects serialize to JSON for frontend
  → Serializer handles record data alongside schema metadata
```

### Global Configuration

Host apps configure the gem in an initializer:
```ruby
Habarico.configure do |config|
  config.resources = [...]         # Array of resource class names
  config.routing_url_prefix = '...'
  config.routing_scope = '...'
  config.currency = 'CZK'
end
```

## Documentation

User-facing documentation lives in `docs/` **here, beside the code** (rendered as
docs.habarico.com/ruby), **not** in `README.md` — that file is a quick start and stays one. A
change users can see is finished when its page is updated, in the same merge request as the code:
the page is published from the release tag, so one merged later is one the reader does not get
until the next release.

Read `CONTRIBUTING.md` in the `hab-docs` repository first; a page about a DSL attribute follows the
DSL template (Declaration / Options / Generated schema / Example / See also) and examples use the
e-shop domain (`Product`, `Category`, `Order`, `Customer`). Where things go:

| What changed | Page to update |
|---|---|
| A `Definition` DSL attribute — permissions, data loading, views | `docs/basic-usage/` |
| List / detail / form shaping, custom actions, box types, navigation | `docs/schema-and-field-customization/` |
| Field type inference or a new field type | `docs/field-types.md` |
| Filters, sorting, fulltext search | `docs/filtering-and-searching.md` |
| Cross-service references, user preferences | the matching top-level page in `docs/` |
| Aggregation, global search, chunked uploads, PaperTrail history | `ruby-enterprise/docs/` in `habarico-enterprise`, same path |
| The wire format itself | `contract/openapi.yaml` — the API reference is generated from it |

The full DSL reference — field types, view layouts, custom actions and a complete controller
example — is at [docs.habarico.com/ruby](https://docs.habarico.com/ruby/intro).

Where Ruby and Python differ (an enum the gem does not emit yet, a subsystem only one side has),
say so on `concepts/backend-parity.md` in the `hab-docs` repository — that page is what a reader
checks before picking a backend, and a stale claim there is worse than none.

**Verifying a page.** The site is built in a checkout of `hab-docs`, which reads the pages from
here:

```bash
cd <hab-docs>
HABARICO_PATH=<this monorepo> npm start   # dev server on :3000, or
HABARICO_PATH=<this monorepo> npm run build   # fails on a broken link
```

`onBrokenLinks: throw` covers the whole site, free and premium pages together, so a renamed heading
or a moved page fails here rather than at publish time. The `docs-check` workflow runs the same build on
every pull request that touches `*/docs/**`.
