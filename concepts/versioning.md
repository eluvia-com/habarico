---
title: Versioning
sidebar_position: 5
---

All packages follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

| Bump | When |
| --- | --- |
| **MAJOR** | Breaking change in the public API or in the OpenAPI schema contract |
| **MINOR** | New backward-compatible feature or schema addition |
| **PATCH** | Bug fix, performance improvement, or internal refactor with no API change |

The Python, Ruby and Node libraries share **MAJOR.MINOR**: a new minor or major moves all of them,
and they are released together. Only patch releases are made per library.

The paid package of a library shares the MAJOR.MINOR of the free one: `habarico-enterprise` 7.3.x
goes with `habarico` 7.3.x.

The **OpenAPI contract** is versioned through its own `info.version` field and is bumped together
with any package that introduces a schema-level change.

## Changelogs

Changes are tracked per package — free and paid separately — plus one project-level changelog for
the contract itself:

| Changelog | Covers |
| --- | --- |
| [Project & API contract](./changelog/project.md) | OpenAPI schema changes (versioned `[schema X.Y.Z]`) and project-level documentation |
| [Python library](./changelog/python.md) | `habarico` (PyPI) releases |
| [Python library (premium)](./changelog/python-premium.md) | `habarico-enterprise` (PyPI) releases |
| [Ruby library](./changelog/ruby.md) | `habarico` (gem) releases |
| [Ruby library (premium)](./changelog/ruby-premium.md) | `habarico-enterprise` (gem) releases |
| [Node library](./changelog/node.md) | `habarico` (npm) releases |
| [Node library (premium)](./changelog/node-premium.md) | `@eluvia/habarico-enterprise` (npm) releases |

All of them follow the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) convention:
unreleased work accumulates under `[Unreleased]`, which is renamed to the version on release, and
every release gets an entry. Changes that require action from library users are prefixed with
**BREAKING:**.

## Documentation versions

The documentation is versioned with the library it documents. The site you are reading shows the
**newest release** of each library; the bar above a page names it — `Python 5.11` — and opens a menu
of the other versions of that library, with a link to its changelog, which is where "what changed
between two releases" is answered.

Pages belong to a **minor series**, not to a single release: the documentation you read under
`5.11` describes the whole 5.11 line, including its patch releases.

The **paid package** of a library shares its version: `habarico-enterprise` 5.11 goes with
`habarico` 5.11, so the series on a page is the series of both, and a page of a paid feature
carries a **Premium** badge and no second number.

The [API reference](/api) is the newest released **contract**, which is versioned separately from
the libraries — a library release decides which contract you get. The bar above a library page
therefore names that contract as well and links to the reference.

### Earlier versions

Every publish of the site keeps a **snapshot** of itself, under `/s/<id>/`: the whole site as it was
that day — concepts, the three libraries, the API reference, its own search — and it is never
rebuilt afterwards. When a library moves to a new series, the snapshot in which the old series was
last current is what the version menu offers for it. The menu shows the newest series and five
behind it; [Versions](/versions) lists every one.

A snapshot is another build of the site, so switching versions lands on the front page of the
version picked, not on the same page — and the version menu of a snapshot still knows about the
series released since, because it reads the list of versions from the current site rather than
from the snapshot. A fix on an older series is published as a new snapshot of that series, which
replaces the one the menu pointed at before.
