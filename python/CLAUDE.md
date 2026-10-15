# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Habarico is a Python/Django REST admin library that helps developers create admin interfaces for applications. It generates REST APIs from Django models with schema-driven views and actions, designed for CMS and ERP systems.

## Tech Stack

- **Language:** Python 3.10+
- **Framework:** Django 4.2.2+, Django REST Framework 3.14+
- **Package Manager:** Pipenv
- **Testing:** pytest + pytest-django
- **Version:** 4.21.1

## Directory Structure

```
src/habarico/           # Main source code
  admin.py              # Core Admin and ModelAdmin classes
  views.py              # DRF views (AdminPermission, AdminSchemaView, etc.)
  site.py               # AdminSite registry
  schema/               # Schema generation system
  serializers/          # DRF serializer implementations
  filters/              # Query filtering
  locale/               # Internationalization (cs, en)

tests/                  # Test suite
  app/                  # Test application with models and admin
    tests/              # Test cases (pytest)
  settings.py           # Django test settings
  urls.py               # Test URL configuration

../contract/openapi.yaml  # OpenAPI 3.0.3 specification (shared, at the repo root)
```

## Common Commands

```bash
# Install dependencies
pipenv install --dev

# Run tests
pytest

# Run specific test file
pytest tests/app/tests/test_admin.py

# Run a single test class / test by node id or keyword
pytest tests/app/tests/test_admin.py::TestAdminBase
pytest -k highlight

# Run tests with coverage
pytest --cov=src/habarico tests/

# Code formatting
black src/ tests/ --line-length 120

# Import sorting
isort src/ tests/

# Linting
flake8 src/ tests/
```

## Code Style

- **Formatter:** Black (line-length: 120)
- **Linter:** Flake8 (max-line-length: 120, ignores E203, W503)
- **Import sorting:** isort (Black-compatible profile)
- **Type hints:** Required for all public functions/classes
- **Docstrings:** Google style, required for public code
- **Translations:** Use gettext for all hardcoded text

## Key Architecture

The library turns a Django model + a `ModelAdmin` declaration into a full REST resource
*plus* a machine-readable schema that a frontend uses to render the entire admin UI
(lists, forms, filters, actions). Understanding three flows is enough to be productive:
**registration**, **URL/viewset generation**, and **schema generation**.

### Public API (from `habarico`)

```python
from habarico import Admin, ModelAdmin, site
```

`Admin` is the abstract base; `ModelAdmin` is what you subclass. `site` is the singleton
`AdminSite` registry (`src/habarico/site.py`).

### Registration is metaclass-driven (no manual register calls)

`ModelAdmin` uses the `AdminBase` metaclass (`src/habarico/admin.py`). When you define a
subclass, `AdminBase.__new__` auto-calls `site.register(new_class)` **unless** the class
sets `abstract = True`. Registration also appends the admin's router to `AdminSite._routers`.
Consequence: simply importing a module that defines a `ModelAdmin` registers it. Use
`abstract = True` for base classes and for test-local admins you don't want globally registered.

### URLs and viewsets

`AdminSite.urls` aggregates every registered admin's router plus the schema/search views into
a `(urlpatterns, "habarico")` namespace tuple. A consuming app wires the whole admin in with
one line — see `tests/urls.py`: `path("admin/", include(site.urls))`.

Each `ModelAdmin` builds its DRF viewset lazily, on first access to `admin.viewset`, via
`get_viewset()` (a dynamic viewset factory in `views.py`). The custom `AdminRouter` injects
schema endpoints (`schema_list`, `schema_detail`) alongside the standard CRUD routes, so every
resource is self-describing at `/admin/<resource>/schema/` and `/admin/<resource>/<pk>/schema/`.

### Permissions are flag-based

`ModelAdmin` exposes boolean flags `can_create` / `can_read` / `can_update` / `can_delete`
(defaults: only `can_read = True`). `AdminPermission` (`views.py`) enforces them per HTTP method,
and they also drive which views/actions appear in the generated schema. This is not Django's
group/permission system — customize `AdminPermission` if you need role integration.

### Schema generation pipeline

The `schema/` module produces OpenAPI 3.0.3-compatible dicts. Key mechanism in
`schema/base.py`: every schema object subclasses `BaseSchema`, and `to_dict()` serializes by
**stripping the leading underscore from instance attributes** (`_get_dict_data`). So a
constructor that stores `self._dashboard_enabled = ...` automatically emits a `dashboard_enabled`
key — there is no separate serialization layer. Nested `BaseSchema` objects are converted
recursively via `schema_to_dict()`. A `SchemaContext` (immutable, passed down the tree, carries
the request/object and render flags) avoids globals; `context.update(**kwargs)` makes a child.

**Getter override (context-dependent output):** `BaseSchema._get_data_value` dispatches on a
`get_<attr>(self)` method for each stored `self._<attr>` — if one exists, its return value is
serialized instead of the raw attribute. Since the getter runs during serialization it can read
`self.context` (request / object / readonly / index / render mode), so **any** schema object
(box, field/action descriptor, resource, view) can make an attribute context-dependent by
subclassing and defining `get_<attr>()` — no need to override `to_dict`/`_get_dict_data`. The
getter is opt-in: attributes without one serialize their stored value. `BaseBox` uses this for
`get_name()` (index fallback) and `get_read_only()` (inherits `context.read_only`).

For a field that has **no backing attribute** at all (built lazily from context — e.g. nested
params objects that can't be constructed in `__init__` because there is no context yet), decorate
its getter with `@schema_getter` (`schema/base.py`). The serializer discovers such getters
(MRO-aware, so a subclass may override without re-decorating) and calls `get_<field>()` during
`to_dict()`, emitting `<field>`. Build a **fresh** object in the getter rather than mutating a
stored one — schema objects are declared once and reused across requests.

The schema is a **nested tree**, not flat: `Resource → Views → Boxes → Fields/Actions`.
- `generators.py` — the generator hierarchy (`AdminSchemaGenerator`, `ListViewSchemaGenerator`,
  `CreateViewSchemaGenerator`, `ShowViewSchemaGenerator`, `EditViewSchemaGenerator`,
  action/field/filter generators). `AdminSchemaGenerator.get_schema()` is where resource-level
  metadata is assembled into `GlobalResourceSchema`.
- `resource.py` — `GlobalResourceSchema` (resource-level metadata container).
- `boxes.py` — form layout containers: `Box`, `TabBox` (tabs), `WizardBox` (steps). Each box builds
  its nested params object lazily via a `@schema_getter get_<x>()` from raw kwargs stored privately;
  override the `_get_<x>_kwargs()` hook in a subclass to make the params context-dependent. Plain box
  fields (`label`, `boxes`, `card`, …) are stored attributes, already overridable via an opt-in
  `get_<field>()` in a subclass — no conversion needed.
- `fields.py` / `actions.py` — leaf field/filter schemas and action (button) schemas. Hand-declared
  descriptors (`FieldDescriptor`, `FilterDescriptor`, `ActionDescriptor`) build their conditional
  nested params (`options`, `view`) lazily via `@schema_getter` from `_get_<x>_kwargs()` — override
  that hook to make them context-dependent. Because the getter is always present, this works even
  when the param wasn't declared (unlike overriding a conditionally-created attribute).

There are two render modes: `render_base_schema=True` yields the lightweight resource metadata
served for the menu/all-resources schema; the full per-object schema needs the model instance.

**Adding a resource-level schema option end-to-end** (the common change): add the attribute with
a backward-compatible default on `ModelAdmin` (`admin.py`) → add the keyword-only param + `self._x`
on `GlobalResourceSchema` (`schema/resource.py`) → return it from
`AdminSchemaGenerator.get_resource_schema_kwargs()` (`schema/generators.py`) → describe it under
`GlobalResourceSchema` in the repo-root `contract/openapi.yaml` → document it in `docs/`
(see [Documentation](#documentation)). The underscore-stripping serializer surfaces it in the
output automatically.

An option that belongs to a **pro/enterprise** feature stays out of core: the feature declares it
on its own `GlobalResourceSchema` subclass and fills it by overriding
`get_resource_schema_kwargs()`, then points `schema_class` / `ModelAdmin.schema_generator_class` at
its composed classes (see `habarico_enterprise.schema`). Core declares no key it cannot produce.

## Testing

- pytest runs from the repo root; `pytest.ini` sets `DJANGO_SETTINGS_MODULE=settings` and
  `pythonpath=tests`, so `settings` resolves to `tests/settings.py`.
- Test models live in `tests/app/models.py`: Category, Tag, Author, Article, Product.
- Database: in-memory SQLite, migrated with `--run-syncdb` (see `conftest.py`).
- Key fixtures (`tests/app/tests/conftest.py`): `db`, `mock_request` (a DRF request with
  `user=None`, used to call `admin.get_schema(mock_request).to_dict(request=mock_request)`),
  model-instance fixtures, and `api_client`.
- Define test-local admins with `abstract = True` to avoid polluting the global `site` registry.
- **Test data is English** — labels, `verbose_name`s, record names, fixture values, and the
  currency on `tests/app/models.py`. The full rule, its exceptions (translation tests keep the
  language they assert) and the diacritics/locale traps are in the repository-root `CLAUDE.md`
  ("Tests").

## Branch Naming

Follow YouTrack issue tracking: `ISSUE-NUMBER` (e.g., `HAB-275`, `VD-1918`)

## Documentation

User-facing documentation lives in `docs/` **here, beside the code** (rendered as
docs.habarico.com/python), **not** in `README.md` — that file is a quick start and stays one. A
change users can see is finished when its page is updated, in the same merge request as the code:
the page is published from the release tag, so one merged later is one the reader does not get
until the next release.

Read `CONTRIBUTING.md` in the `hab-docs` repository first; the DSL template (Declaration / Options
/ Generated schema / Example / See also) is what a page about an admin attribute follows, and
examples use the e-shop domain (`Product`, `Category`, `Order`, `Customer`). Where things go:

| What changed | Page to update |
|---|---|
| A `ModelAdmin` attribute, permissions, serializers, validation | `docs/basic-usage/` |
| A schema generator, field/filter/action descriptor | `docs/view-generators/` |
| Filters, ordering, fulltext search | `docs/filtering-and-searching/` |
| User preferences | `docs/user-preferences/` |
| Aggregations, chunked uploads, AI integration, change history, global search | `python-enterprise/docs/` in `habarico-enterprise`, same path |
| The wire format itself | `contract/openapi.yaml` — the API reference is generated from it |

When a change alters what the frontend does with the schema, link to the matching `/node/…` page
from the backend page — that pairing is what keeps the two halves in sync.

**Verifying a page.** The site is built in a checkout of `hab-docs`, which reads the pages from
here:

```bash
cd <hab-docs>
HABARICO_PATH=<this monorepo> npm start   # dev server on :3000, or
HABARICO_PATH=<this monorepo> npm run build   # what CI runs - fails on a broken link
```

`onBrokenLinks: throw` covers the whole site, free and premium pages together, so a renamed heading
or a moved page fails here rather than at publish time. The `docs-check` job runs the same build on
every merge request that touches `*/docs/**`.

## Changelog

Keep `CHANGELOG.md` up to date **as part of development** — whenever you implement a
change worth releasing, add an entry under the `## [Unreleased]` heading before finishing
the work. Do not create a versioned/dated section by hand: the CI release job replaces
`## [Unreleased]` with `## [X.Y.Z] — YYYY-MM-DD` automatically.

- Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — group entries under
  `### Added` / `### Changed` / `### Deprecated` / `### Removed` / `### Fixed` / `### Security`.
- Write entries in English, one bullet per user-visible change, and reference the YouTrack
  issue in parentheses (e.g. `(HAB-598)`).
- Always leave a `## [Unreleased]` section at the top for the next changes.
