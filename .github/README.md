# GitHub Actions

These workflows are the repository's only CI: they run the checks and own publishing, to the
public registries only.

| Document | What it is for |
|----------|----------------|
| `README.md` (this file) | Reference — what runs, and every variable and secret it reads |
| `OPERATIONS.md` | Procedures — first-time setup, cutting a release, consuming a beta, troubleshooting |
| `RELEASE-DESIGN.md` | Design record — why the release flow is shaped the way it is |

## What runs

One workflow per versioned unit of the monorepo. Each runs on every pull request, whatever it
changes, so its jobs can be required checks in the `next` ruleset; job names carry the library
because the ruleset matches checks by name alone:

| Workflow | Jobs |
|----------|------|
| `node.yml` | `node-code-quality` (lint + typecheck), `node-unit-tests`, `node-storybook-tests` |
| `python.yml` | `python-code-quality` (flake8 + black), `python-unit-tests` (pipenv + pytest) |
| `ruby.yml` | `ruby-code-quality` (rubocop), `ruby-unit-tests` (`rake test`) |
| `beta-bump.yml` | `beta-bump` |
| `major.yml` | `major` (the major button) |
| `publish.yml` | `detect`, then one job per changed library |
| `release.yml` | `release` (the finalize button) |
| `docs-check.yml` | `docs-check`: builds the documentation site on a pull request touching `*/docs/**` or the contract |
| `changelog-check.yml` | `changelog-check`: reads the changelogs the way the site does, on a pull request touching one |

Both documentation checks clone `hab-docs` from GitLab, and `docs-check` also `habarico-enterprise`,
with a read-only deploy token; a pull request from a fork gets no secrets and skips them.

## Releasing

`publish.yml` is the only workflow that publishes. It does not publish on every merge to `next`,
though — an ordinary merge triggers `beta-bump.yml` instead, which finds every library whose
directory has moved since its last bump commit, bumps each to its next beta version via `pydev`
(no tag), and pushes **one** `Bump version to ...` commit. That push is what actually reaches
`publish.yml`: it reads the version straight back out of the file the bump commit just wrote,
nothing derived. A `<lib>@X.Y.Z` tag, pushed by `release.yml`, publishes the stable artifact the
same way it always has.

`publish.yml` also has a `workflow_dispatch` with a `library` input, which publishes that one
library again: on `next` the beta its version file carries, on a `<lib>@X.Y.Z` tag that release.
It refuses on `next` when the library's directory has moved since its last bump commit.

`release.yml` is the finalize button (`workflow_dispatch`, with a `dry_run` input). It stamps the
changelogs, commits, tags, pushes `next`, fast-forwards `master`, creates `release/<lib>@vX.Y`
maintenance branches. The version files stay on the released version until the next merge, when
`beta-bump.yml` opens the next cycle. It publishes nothing — the tags it pushes are what start `publish.yml`.

`major.yml` is the major button (`workflow_dispatch`, with a `dry_run` input). It moves every
library onto the first beta of the next major in one bump commit on `next`, which `publish.yml`
then publishes. It refuses a second press while a major cycle is already running.

With `SHARED_MINOR_MAJOR` (on by default) the libraries keep one major.minor: a new cycle in
`beta-bump.yml` bumps every library, changed or not, later betas only the changed ones, and
`release.yml` releases all of them once any has moved. A library without commits since its last
tag other than bumps gets the changelog section `No changes. Version aligned with the other
libraries in the repository.` All three workflows fail when the version files are not on one
major.minor, or when only some are on a beta.

Without `SHARED_MINOR_MAJOR`, choosing a different next version is an ordinary edit of the
version file in a reviewed pull request, per library. See `.github/RELEASE-DESIGN.md` for why each step is where it is.

## Where packages go

| Library | Registry | Addressed as |
|---------|----------|--------------|
| node | npmjs.com | `habarico`, betas under the `beta` dist-tag |
| python | PyPI | `habarico` — note PEP 440 normalises `5.11.0-beta.13` to `5.11.0b13` |
| ruby | rubygems.org | `habarico`, betas as pre-release versions (`7.2.0.pre.beta.4`) |

No library has an internal registry; the `@eluvia` npm scope stays with `habarico-enterprise`.

Betas use npm's `beta` dist-tag, so `npm install habarico` still resolves the last stable
version; `pip` and `gem` skip pre-releases unless asked with `--pre`.

## Going public

A version on npmjs.com cannot be unpublished after 72 hours.

`node/package.json` `repository` must stay `github.com/eluvia-com/habarico`: npm provenance
rejects a publish whose repository does not match the GitHub repository it runs in.

## Configuration

**Repository variables**

| Variable | Default | Used by |
|----------|---------|---------|
| `TOOLBOX_IMAGE` | `ghcr.io/druids/developers-chamber:1` | The image carrying `pydev`; `release.yml`, `beta-bump.yml` and `publish.yml`'s `detect` job all run in it. The default is the upstream public image, so this needs no setting — override it only to try a different build. |
| `RELEASE_LEVEL` | `minor` | The level `beta-bump.yml` starts a new prerelease cycle at, and the level `release.yml` releases a library at whose version file is still on its last release. **Both must read the same value** — if they disagreed, a beta could be numbered off a target that never ships. |
| `SHARED_MINOR_MAJOR` | `true` | Keeps major.minor identical across the libraries, read by `beta-bump.yml`, `release.yml` and `major.yml`; `major.yml` does not run without it. |
| `NEXT_BRANCH` | `next` | Trunk. Hard-coded in `publish.yml`'s and `beta-bump.yml`'s triggers as well, because `on:` has no contexts — all three must agree. |
| `STABLE_BRANCH` | `master` | Fast-forwarded by the finalize. |
| `RELEASE_APP_ID` | — (required) | GitHub App used by `release.yml`'s finalize and by the bump commits of `beta-bump.yml` and `major.yml` to write to the repository. |
| `GITLAB_DOCS_TOKEN_USER` | — (required) | Username of the GitLab deploy token `docs-check.yml` and `changelog-check.yml` clone with. |

**Environment `release`** wraps every publish job, which is what keeps the write-scoped
credentials out of the pull-request workflows, and gives somewhere to hang protection rules later.

## Secrets

| Secret | Used by | Needed because |
|--------|---------|----------------|
| `RELEASE_APP_PRIVATE_KEY` | `release.yml`, `beta-bump.yml`, `major.yml` | Private key of the GitHub App above. `GITHUB_TOKEN` will not do: pushes made with it deliberately do not start further workflow runs, so neither the release tags nor a bump commit would ever trigger `publish.yml`. The App needs `contents: write` and a ruleset bypass on both branches. |

| `GITLAB_DOCS_TOKEN` | `docs-check.yml`, `changelog-check.yml` | The GitLab deploy token itself: `read_repository` on the `eluvia/habarico` group, which covers `hab-docs` and `habarico-enterprise`. |

The library checks read no secrets, so `pull_request` runs from forks work unchanged.

## What deliberately does not run

- **The documentation site** has no workflow, and no directory here either: it is its own
  repository (`hab-docs`), which clones the pages out of `<lib>/docs/` and publishes them. Nothing
  in this repository starts that publish on either CI — since HAB-872 it is started by a stable tag
  of `habarico-enterprise`, the release that closes every cycle.
- **No documentation preview.** The pages of a pull request are not published to the test host;
  build them locally with `hab-docs` to see them rendered.
- **No Storybook publish.** storybook.habarico.com is not updated from a `node@X.Y.0` tag, and
  there is no preview of `next` on the Storybook test host.
- **Patch releases from a maintenance branch.** `release.yml` creates `release/<lib>@vX.Y`, but
  there is no patch button — a patch has to be versioned, committed and tagged by hand.
- **A GitHub Release record.** `RELEASE-DESIGN.md` plans one on every stable tag, but
  `publish.yml` does not create one yet.
