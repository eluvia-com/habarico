# GitHub Actions

These workflows run the checks and own publishing. The GitLab pipeline is on its way out; what
stays behind on GitLab is the **package registries**, because the Eluvia projects resolve Habarico
from them during deployment — and, until they are ported, the three documentation jobs listed
under "What deliberately does not run".

| Document | What it is for |
|----------|----------------|
| `README.md` (this file) | Reference — what runs, and every variable and secret it reads |
| `OPERATIONS.md` | Procedures — first-time setup, cutting a release, consuming a beta, troubleshooting |
| `RELEASE-DESIGN.md` | Design record — why the release flow is shaped the way it is |

## What runs

One workflow per versioned unit of the monorepo, each scoped by `paths` so a change in `ruby/`
does not start the Node pipeline:

| Workflow | Jobs | Mirrors |
|----------|------|---------|
| `node.yml` | `code-quality` (lint + typecheck), `unit-tests`, `storybook-tests` | `ci-toolbox/node-library@2` + the hand-written `storybook-tests` job in `node/.gitlab-ci.yml` |
| `python.yml` | `code-quality` (flake8 + black), `unit-tests` (pipenv + pytest) | `ci-toolbox/python-library@2` |
| `ruby.yml` | `code-quality` (rubocop), `unit-tests` (`rake test`) | `ci-toolbox/ruby-library@2` |
| `beta-bump.yml` | `beta-bump` | the beta half of `release-next-auto` |
| `major.yml` | `major` (the major button) | `release-next-major` |
| `publish.yml` | `detect`, then one job per changed library | `publish` |
| `release.yml` | `release` (the finalize button) | `release-next-final` |

## Releasing

`publish.yml` is the only workflow that publishes. It does not publish on every merge to `next`,
though — an ordinary merge triggers `beta-bump.yml` instead, which finds every library whose
directory has moved since its last bump commit, bumps each to its next beta version via `pydev`
(no tag), and pushes **one** `Bump version to ...` commit. That push is what actually reaches
`publish.yml`: it reads the version straight back out of the file the bump commit just wrote,
nothing derived. A `<lib>@X.Y.Z` tag, pushed by `release.yml`, publishes the stable artifact the
same way it always has.

`release.yml` is the finalize button (`workflow_dispatch`, with a `dry_run` input). It stamps the
changelogs, commits, tags, pushes `next`, fast-forwards `master`, creates `release/<lib>@vX.Y`
maintenance branches, and finally advances the version files to the next cycle in a second commit.
It publishes nothing — the tags it pushes are what start `publish.yml`.

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
| node | npmjs.com | `habarico`, betas under the `beta` dist-tag; on only with `PUBLISH_NPM` |
| python | GitLab project registry, project **784** | `…/projects/784/packages/pypi` — note PEP 440 normalises `5.11.0-beta.13` to `5.11.0b13` |
| ruby | geminabox | `https://geminabox.eluvia.dev`, the host `habarico.gemspec` pins in `allowed_push_host` |

python and ruby publish betas and stable releases to the internal registries the consuming
projects are configured for — `python/Pipfile` and `ruby/Gemfile` need no change. node has no
internal registry: the package is unscoped, so no `.npmrc` scope mapping can route it to GitLab,
and the `@eluvia` scope stays with `habarico-enterprise`.

Betas use npm's `beta` dist-tag, so `npm install habarico` still resolves the last stable
version; `pip` and `gem` skip pre-releases unless asked with `--pre`.

## Going public

`PUBLISH_NPM` set to `true` turns on the node publish to npmjs.com, for betas and stable
versions alike. A version on npmjs.com cannot be unpublished after 72 hours.

The python and ruby jobs carry a second, gated step for PyPI and rubygems.org. Setting
`PUBLISH_PUBLIC` to `true` turns them on for **stable versions only**. It is off because:

- `python/pyproject.toml` depends on `eluvia-base` and `eluvia-base-django`, and
  `ruby/habarico.gemspec` on `eluvia-base`. None of them are on public PyPI or rubygems.org, so a
  public release would declare dependencies nobody outside the company can resolve.
- `habarico.gemspec` pins `allowed_push_host` to geminabox, which makes `gem push` to
  rubygems.org refuse outright.

`node/package.json` `repository` must stay `github.com/eluvia-com/habarico`: npm provenance
rejects a publish whose repository does not match the GitHub repository it runs in.

## Configuration

**Repository variables**

| Variable | Default | Used by |
|----------|---------|---------|
| `TOOLBOX_IMAGE` | `ghcr.io/druids/developers-chamber:1` | The image carrying `pydev`; `release.yml`, `beta-bump.yml` and `publish.yml`'s `detect` job all run in it. The default is the upstream public image, so this needs no setting — override it only to try a different build. |
| `RELEASE_LEVEL` | `minor` | The level `release.yml`'s finalize advances version files by, and the level `beta-bump.yml` starts a new prerelease cycle at when none is open. **Both must read the same value** — if they disagreed, a beta could be numbered off a target that never ships. |
| `SHARED_MINOR_MAJOR` | `true` | Keeps major.minor identical across the libraries, read by `beta-bump.yml`, `release.yml` and `major.yml`; `major.yml` does not run without it. Mirrors the variable of the same name in `.gitlab-ci.yml`. |
| `NEXT_BRANCH` | `next` | Trunk. Hard-coded in `publish.yml`'s and `beta-bump.yml`'s triggers as well, because `on:` has no contexts — all three must agree. |
| `STABLE_BRANCH` | `master` | Fast-forwarded by the finalize. |
| `RELEASE_APP_ID` | — (required) | GitHub App used by `release.yml`'s finalize and by the bump commits of `beta-bump.yml` and `major.yml` to write to the repository. |
| `GITLAB_PACKAGES_USER` | — (required) | Username half of the GitLab deploy token, used by twine. A deploy token's default username is `gitlab+deploy-token-<n>`. |
| `GEMINABOX_USER` | — (required) | Basic-auth user for geminabox. |
| `PUBLISH_NPM` | unset | `true` publishes node betas and stable versions to npmjs.com. See "Going public". |
| `PUBLISH_PUBLIC` | unset | `true` also publishes stable python and ruby versions to PyPI / rubygems.org. See "Going public". |

**Environment `release`** wraps every publish job, which is what keeps the write-scoped
credentials out of the pull-request workflows, and gives somewhere to hang protection rules later.

## Secrets

| Secret | Used by | Needed because |
|--------|---------|----------------|
| `RELEASE_APP_PRIVATE_KEY` | `release.yml`, `beta-bump.yml`, `major.yml` | Private key of the GitHub App above. `GITHUB_TOKEN` will not do: pushes made with it deliberately do not start further workflow runs, so neither the release tags nor a bump commit would ever trigger `publish.yml`. The App needs `contents: write` and a ruleset bypass on both branches. |
| `GITLAB_PACKAGES_TOKEN` | `publish.yml` | A GitLab **deploy token on project 784 with `write_package_registry`** (a personal or group access token with `api` also works), for the PyPI registry. |
| `GEMINABOX_PASSWORD` | `publish.yml` | Basic-auth password for geminabox; `gem push` carries it in the host URL. |
| `GITLAB_TOKEN` | `node.yml`, `publish.yml` | `node/.npmrc` points the `@eluvia` scope at the GitLab npm registry and interpolates the variable. Deliberately a **separate, read-only** token from `GITLAB_PACKAGES_TOKEN` — the pull-request workflows never need write access to a registry. npm accepts an empty value, so an unset secret still installs cleanly today: no `@eluvia` package is currently a dependency. |
| `PYPI_REGISTRY_USERNAME`, `PYPI_REGISTRY_TOKEN` | `python.yml` | `python/Pipfile` resolves `eluvia-base` and `eluvia-base-django` from the GitLab PyPI registry. Both are required until the Pipfile points at the public indexes. |

Because these secrets are involved, `pull_request` runs from forks will not have them. Once the
libraries resolve their dependencies from public sources, the Python job loses its secret
requirement and fork PRs work unchanged.

## What deliberately does not run

- **The documentation site** has no workflow, and no directory here either: it is its own
  repository (`hab-docs`), which clones the pages out of `<lib>/docs/` and publishes them. Nothing
  in this repository starts that publish on either CI — since HAB-872 it is started by a stable tag
  of `habarico-enterprise`, the release that closes every cycle.
- **The two documentation checks** `docs-check` and `docs-changelog-check` (`.gitlab-ci.yml`),
  which build the whole site and read the changelogs on a merge request that touches a page or a
  `CHANGELOG.md`. A pull request here gets neither, so a broken link or a malformed changelog is
  caught only by the GitLab merge request. Nor does it get the manual `docs-preview`, which
  publishes the pages of a merge request to the documentation test host.
- **The Storybook publish** `publish-storybook` (`node/.gitlab-ci.yml`), which puts the built
  Storybook on storybook.habarico.com from a `node@X.Y.0` tag. It runs only in the GitLab tag
  pipeline — the documentation pages link that site per series, so turning the GitLab pipeline off
  would freeze it. The same holds for `publish-storybook-next`, the manual preview of `next` on the
  Storybook test host.
- **Patch releases from a maintenance branch.** `release.yml` creates `release/<lib>@vX.Y`, but
  there is no port of GitLab's `release-patch` button yet — a patch has to be tagged by hand.
- **A GitHub Release record.** GitLab hangs one on every stable tag (`CREATE_GITLAB_RELEASE`);
  `RELEASE-DESIGN.md` plans the same here, but `publish.yml` does not create one yet.
- **The AI review jobs** (`ci-toolbox/ai.yml`) — off in this repo on GitLab too.
