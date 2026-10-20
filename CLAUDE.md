# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Habarico

Habarico is a **schema-driven admin library** available in three independent language implementations. Each backend (Ruby/Python) exposes a JSON schema describing resources, fields, views, and actions; the frontend (JavaScript/React) fetches these schemas and auto-generates admin dashboards without hand-written UI code.

## Monorepo Structure

```
node/         # habarico — React/TypeScript UI library (React Admin + MUI v7)
python/       # habarico — Django REST Framework admin library
ruby/         # habarico gem — Rails engine
<pkg>/docs/   # the documentation pages of that package, rendered by docs.habarico.com
contract/     # OpenAPI 3.0.3 specification (openapi.yaml) — the shared contract
examples/     # runnable example projects built on the libraries in this tree
```

`examples/eshop/` is a working admin — a Django backend, a Rails backend and one React frontend
that serves either — in the e-shop domain the documentation uses. It has no `.pydev` config, so it
is **not** a versioned unit and the release workflows ignore it; it links the three libraries from
the working tree instead, so a change that breaks it fails in the same pull request. The
documentation takes its examples from there and links readers to
`github.com/eluvia-com/habarico/tree/<tag>/examples/eshop`, the version they are running.

Authentication lives in the example, not in the libraries: Habarico has three hook points
(`authenticate_request` in Ruby, a DRF authentication class in Python, plain functions handed to
`buildServiceAuthProvider` in JS) and the example fills them with the stock framework pieces. No
documentation page may reach for a private Eluvia auth library to show one.

Each sub-directory is independently buildable, testable, and publishable. See the CLAUDE.md in each sub-directory for language-specific commands, architecture, and conventions:

- `node/CLAUDE.md` — build, test, lint, path aliases, provider/context architecture
- `python/CLAUDE.md` — commands, schema system, test setup
- `ruby/CLAUDE.md` — commands, 6-layer architecture, DSL reference

## Cross-Language Schema Flow

1. **Backend** (Ruby or Python) defines resources via a DSL/classes → generates an OpenAPI 3.0.3 schema
2. **Frontend** (`SchemaProvider`) fetches the schema; `DataProvider` handles CRUD calls
3. The schema drives which fields, inputs, boxes (layout containers), and actions are rendered

The `contract/openapi.yaml` is the authoritative contract between backend and frontend.

## Paid packages (`habarico-enterprise`)

The paid extensions — dashboard and widgets, AI assistant, global search, change history,
aggregations, chunked uploads and CZ localflavor — live in a **separate repository** and are
released as `habarico-enterprise` (npm, PyPI, gem). Nothing here builds, tests or publishes them:
they have no directory and no workflow here. The free packages never
import them either — a paid package registers itself through runtime extension points resolved by
name (`habarico.settings.EXTENSION_PACKAGE`, `Config.search_highlighter_class`, `Types.register`).

Two things stay in this repository and therefore span both:

- **`contract/openapi.yaml` describes the paid endpoints too** — `/search`, the `aggregate`
  endpoints and the chunked-upload endpoints. A change to a paid API is a change in both
  repositories: bump `info.version` and add the root changelog entry here, implement it there.
- **The documentation pages for paid features live there too**, in
  `<pkg>-enterprise/docs/` along the path they have on the site — `python-enterprise/docs/aggregations/`
  is what the reader reaches at `/python/aggregations/`. Nothing here marks a page as paid: the
  documentation site merges the two trees and stamps the premium badge from the repository a page
  came from. So a paid feature is code there and page there; only the contract is here.

The paid Storybook stays inside that repository and is deliberately not published anywhere public.
A premium page shows a screenshot of its story and no link.

## Publishing

| Language   | Registry                     | Scope / Name        |
|------------|------------------------------|---------------------|
| JavaScript | npmjs.com (betas under the `beta` dist-tag) | `habarico` — unscoped: `@eluvia` maps to the private registry `habarico-enterprise` comes from |
| Python     | PyPI (betas as pre-release versions) | `habarico` |
| Ruby       | rubygems.org (betas as pre-release versions) | `habarico` |

Every top-level directory with its own pydev config (`.pydev/base.yml` with a `version.files` key, or the older `.pydev/base.conf` with `VERSION_FILES`) is a **versioned unit** of the monorepo — the three libraries. They share major.minor (`SHARED_MINOR_MAJOR`): a new cycle in `beta-bump.yml` moves all of them to the next minor beta, later betas only the changed ones, `major.yml` starts a major for all, `release.yml` releases them together and tags them `<dir>@X.Y.Z`; only patches are per library. Version files must stay on one major.minor or the release workflows fail.

`<pkg>/docs/` is part of its package for that purpose too: a change to a page alone bumps the package's beta and ships with its next release. That is the point — the page is published from the release tag it belongs to.

The units are built, released and published from GitHub Actions — see `.github/WORKFLOWS.md`
for what runs and `.github/OPERATIONS.md` for how to release and how to consume a beta.

## Branch Naming

Use YouTrack issue prefixes: e.g. `HAB-275`, `VD-1918`.

## Tests

**Test data is English by default** — labels, titles, record names, error messages, fixture values.
The three implementations are read side by side and their tests are the executable specification of
one shared contract, so an example only reads as an example when it is written in the language the
rest of the code is. This holds the same way in `node/src/**/__tests__/`, `python/tests/` and
`ruby/test/`.

Three things the rule does **not** cover:

- **Storybook stays Czech.** The stories and the fixture data behind them (`*.stories.tsx`,
  `node/src/**/_data.ts`, `_i18n.ts`, `_shell.tsx`) are a demo of a Czech admin — leave them as they
  are.
- **A translation test must use the language it asserts.** A test pinning that a locale catalog is
  actually on the load path (`I18n.with_locale(:cs)`, `translation.override("cs")`) compares against
  the Czech string; that string is the assertion, not fixture noise.
- **A bare locale code is a value, not a language.** `{'locale' => 'cs'}` handed to a serializer or
  sent as `Accept-Language` is fine — nothing about the expected result depends on Czech.

Two traps worth naming:

- **When the test needs diacritics, pick non-Czech ones.** Accent folding (`unaccent`), Unicode
  normalisation and RFC 5987 / UTF-8 decoding need accented input by definition — use a value that
  still reads in an English context: `'Crème brûlée'`, `'Zoë Müller'`, `'résumé.csv'`.
- **The English value must not collide with the fallback it exists to beat.** An i18n label for
  `status` cannot be `'Status'`: `humanize` produces exactly that, so the test would keep passing
  with the translation gone. Use something distinct, e.g. `'Current state'`.

Locale-dependent formatting follows the same default — format with `en` and USD unless the behaviour
under test does not exist in English. A currency symbol trailing the number, for instance, needs a
locale such as `de` with EUR; say in a comment why the test is not on `en`.

A test-only change gets no changelog entry (see below).

## Documentation

**User-facing documentation lives beside the code it documents, in `<pkg>/docs/`, never in a README.** The site built from it (docs.habarico.com) is the single source of truth since HAB-727; the three library READMEs were reduced to a quick start (install, one minimal example, a link to the site) and must stay that size. Adding a section to `node/README.md`, `python/README.md` or `ruby/README.md` re-creates the drift the migration removed.

**The site itself is a separate repository**, `eluvia/habarico/hab-docs`: it clones the pages from here and from `habarico-enterprise`, renders one site out of the two and publishes it. Nothing here builds or publishes it: the publish is started by a release of `habarico-enterprise`, the last step of every release cycle, and reads every package at its newest stable tag — a release here reaches the site with the paid release that follows it (HAB-872). Every publish also keeps a snapshot of the site, so an earlier series stays readable on the site; a fix on an older series is published by a manual run in `hab-docs` with `DOCS_PIN_<PACKAGE>` set for both halves of the language.

**A user-visible change is not finished until its page is updated** — in the same task, in the same merge request as the code. The page is released with the package: it is read out of the release tag, so a page merged after the release is a page the reader does not get until the next one.

**Before writing any page, read `CONTRIBUTING.md` in `hab-docs`** — it holds the binding page templates (UI component / hook / DSL), the example domain (an e-shop: `Product`, `Category`, `Order`, `Customer`) and the rule that props, defaults and types are copied from the source code, not from older documentation.

**Where a page belongs:**

| Content | Location |
|---------|----------|
| Something one library does | `node/docs/…`, `python/docs/…`, `ruby/docs/…` |
| Something a paid package does | `<pkg>-enterprise/docs/…` in `habarico-enterprise`, along the same path |
| A concept spanning the libraries, or backend parity | `concepts/` in `hab-docs` — it documents no package |
| REST endpoints and schema shapes | `contract/openapi.yaml` — the API reference is generated from it |

**An image belongs beside its page** (`<pkg>/docs/<section>/img/`), referenced relatively. It is then content-hashed into the build and travels with the page into the release tag.

**Verify with `npm run build` in a checkout of `hab-docs`** (`HABARICO_PATH=/path/to/this npm run build`) — `onBrokenLinks: throw` is what catches a renamed heading or a moved page. The `docs-check` workflow does the same on every pull request that touches `*/docs/**`, building against the branch of the same name in `hab-docs` and `habarico-enterprise` where there is one.

**Exception — internal developer documentation stays in the repository:** `node/src/*/README.md` (the four architectural layers) and the `CLAUDE.md` files. These describe how the library is built, not how it is used, and have no place on the public site.

## Changelog

Every code change that affects library users must be recorded in the appropriate changelog **as part of the same task** — not deferred.

**Which file to update:**

| Change type | Changelog file |
|-------------|---------------|
| JS/Node code change | `node/CHANGELOG.md` |
| Python code change | `python/CHANGELOG.md` |
| Ruby code change | `ruby/CHANGELOG.md` |
| `contract/openapi.yaml` change | `CHANGELOG.md` (root) — bump `info.version` too |
| Project-level documentation (root README, repo conventions) | `CHANGELOG.md` (root) — date-only entry |

**A page is not a changelog entry of its own.** A page written for a feature is described by that feature's entry, in the same merge request. A documentation-only fix — a typo, a rewritten paragraph, a restructured section — gets no entry, the same way a code comment does not.

**Always add to the `[Unreleased]` section.** Use the appropriate category: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Security`.

**Do not add a changelog entry for:** CI config changes, test-only refactors, tooling changes, code comments, or documentation-only page fixes.

**Breaking changes** must be prefixed with `**BREAKING:**`.

**Reference the YouTrack issue** when the branch name contains a ticket prefix: `(HAB-123)` — the key alone, no URL (HAB-923). The issue itself is at `https://sparktech.myjetbrains.com/youtrack/issue/HAB-123`.
