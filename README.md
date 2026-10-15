# Habarico

Habarico is a schema-driven admin library for building admin dashboards in CMS and ERP applications. The backend exposes a JSON schema describing resources, fields, views, and actions; the frontend auto-generates the full admin UI from that schema without hand-written UI code.

This repository is a monorepo containing the three library implementations:

| Directory | Package | Licence | Description |
|-----------|---------|---------|-------------|
| [`node/`](node/README.md) | `@eluvia/habarico` (npm) | MIT | React/TypeScript UI library built on React Admin and MUI v7 |
| [`python/`](python/README.md) | `habarico` (PyPI) | MIT | Django REST Framework admin library |
| [`ruby/`](ruby/README.md) | `habarico` (gem) | MIT | Rails engine |

The paid extensions — dashboard and widgets, AI assistant, global search, change history,
aggregations, chunked uploads and CZ localflavor — are developed and released from a repository of
their own as `habarico-enterprise` (npm, PyPI and gem). They are documented on
[docs.habarico.com](https://docs.habarico.com) beside the free features, where their pages are
marked premium.

The `contract/openapi.yaml` file contains the OpenAPI 3.0.3 specification that serves as the contract between backend and frontend.

## License

**The repository is not licensed as a whole** — `node/`, `python/` and `ruby/` each carry their own
`LICENSE` file and are **MIT** (see HAB-842).

The paid `habarico-enterprise` packages are **commercial and proprietary** — use, copying and
distribution only under a valid licence agreement with Eluvia.land s.r.o. They are developed and
released from a repository of their own (HAB-846).

The free packages never reference the paid ones: a paid package registers itself through runtime
extension points resolved by name, so the split is enforced in code, not only on paper.

## How it works

1. A **backend** library (Ruby or Python) defines resources via a DSL or admin classes and exposes a schema endpoint.
2. The **frontend** library (JavaScript) fetches the schema and uses it to auto-render list, show, create, edit, and action views — including fields, inputs, filters, and layout containers (boxes).

## Documentation

The documentation website **[docs.habarico.com](https://docs.habarico.com)** is the source of
truth — installation, configuration and usage for all three libraries, the REST reference generated
from `contract/openapi.yaml`, and the shared concepts:

- [JavaScript — `@eluvia/habarico`](https://docs.habarico.com/node/intro)
- [Python — `habarico`](https://docs.habarico.com/python/intro)
- [Ruby — `habarico`](https://docs.habarico.com/ruby/intro)
- [API reference](https://docs.habarico.com/api) — the contract between backend and frontend

The pages live beside the code they document, in `node/docs/`, `python/docs/` and `ruby/docs/`;
write documentation there, not in the READMEs. Each library's README is a quick start — install, a
minimal example, and a link to the site. The site itself is built and published by `hab-docs`,
which clones these pages and the paid ones from `habarico-enterprise` into one site.

## Versioning

All packages follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

| Bump | When |
|------|------|
| **MAJOR** | Breaking change in the public API or OpenAPI schema contract |
| **MINOR** | New backward-compatible feature or schema addition |
| **PATCH** | Bug fix, performance improvement, or internal refactor with no API change |

Each package is **versioned independently** — a change in one package does not require a version bump in the others unless it affects the shared schema contract or cross-package compatibility.

**Version file locations:**

| Package | File |
|---------|------|
| `@eluvia/habarico` (JS) | `node/package.json` → `"version"` |
| `habarico` (Python) | `python/pyproject.toml` → `version` |
| `habarico` (Ruby) | `ruby/version.json` → `"version"` |

**OpenAPI schema (`contract/openapi.yaml`)** is versioned via its `info.version` field and must be bumped together with any package that introduces a schema-level change.

**Major version alignment:** all three packages should share the same MAJOR version. When a breaking change bumps the MAJOR in one package, the others must follow in the same release cycle, even if they have no other changes.

## Changelog

Changes are tracked at two levels:

| Changelog | Covers |
|-----------|--------|
| [`CHANGELOG.md`](CHANGELOG.md) | OpenAPI schema changes (versioned `[schema X.Y.Z]`) and project-level documentation (date-only entries) |
| `node/CHANGELOG.md` | `@eluvia/habarico` releases |
| `python/CHANGELOG.md` | `habarico` (Python) releases |
| `ruby/CHANGELOG.md` | `habarico` (Ruby gem) releases |

### Format

All changelogs follow the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) convention.

**Package changelogs** use version headers:
```
## [6.2.0] — YYYY-MM-DD

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
```

**Root changelog** uses schema version or date:
```
## [schema 1.2.0] — YYYY-MM-DD   ← OpenAPI schema change
## 2026-05-15                     ← documentation-only change
```

### Rules

1. **Every release gets an entry.** No release without a changelog entry, no matter how small.
2. **Unreleased changes go to `[Unreleased]`.** The top section always exists and is renamed to the version on release.
3. **One bullet per logical change.** Write for a human reader — describe *what changed and why it matters*, not implementation details.
4. **Breaking changes are marked.** Prefix the bullet with `**BREAKING:**` when the change requires action from library users.
5. **Schema changes go to root `CHANGELOG.md`.** Any change to `contract/openapi.yaml` must bump `info.version` and add an entry there, regardless of which package triggered it.
6. **Omit internal-only changes.** CI tweaks, test refactors, and tooling changes do not need changelog entries unless they affect users.
7. **Reference YouTrack issues** where relevant: `(HAB-123)`.
