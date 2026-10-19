# Operating the CI

How to set the workflows up, use them day to day, and recover when one fails.

`README.md` is the reference — what runs, and every variable and secret it reads.
`RELEASE-DESIGN.md` is the design record — why the release flow is shaped the way it is. This
file is the procedures.

## First-time setup

Nothing here is inferred from the repository; all of it has to be created once by hand. In order:

**1. The `release` environment.** Settings → Environments → New environment → `release`. Every
publish job runs in it, which is what keeps the registry write credentials out of the
pull-request workflows. Leave it without protection rules unless you want a manual approval
gate on publishing.

**2. The GitHub App for `release.yml`, `beta-bump.yml` and `major.yml`.** `GITHUB_TOKEN` cannot be used: pushes
made with it deliberately do not start further workflow runs, so neither the release tags nor a
bump commit would ever trigger `publish.yml`. Create an App with the `contents: write` repository
permission, install it on this repository, and give it a **ruleset bypass on both `next` and
`master`** — the finalize pushes directly to both, and `beta-bump.yml` pushes to `next`. Its App ID
goes in the `RELEASE_APP_ID` variable, its private key in the `RELEASE_APP_PRIVATE_KEY` secret,
shared by both workflows.

**3. The variables and secrets.** See the two tables in `README.md`. `TOOLBOX_IMAGE` needs no
action: it defaults to the public upstream `pydev` image (`ghcr.io/druids/developers-chamber:1`).
python and ruby publish to PyPI and rubygems.org through a trusted publisher, configured there once
before the first publish (see `RELEASE-DESIGN.md`). `PUBLISH_NPM` turns on the node publish to
npmjs.com once the first version is out.

**4. Branch rules.** `next` is the trunk and the default branch; `master` records the last
released state and is only ever fast-forwarded. Neither should accept a force push — the beta
counter is derived from commit history, so rewriting the trunk makes it go backwards.

**5. Verify without publishing.** Run `release.yml` from the Actions tab with `dry_run` checked.
It performs every read and every check and prints what it would release; it still commits and
tags locally, on the throwaway runner, but pushes nothing. If it prints a sensible list of
libraries and versions, the App token and the checkout are working.

## On a pull request

Three workflows, each scoped by `paths` so a change under `ruby/` does not start the Node run.
Every check has a local equivalent — run it before pushing rather than waiting for the runner:

| Check | Locally |
|-------|---------|
| node `code-quality` | `cd node && npm ci && npm run lint && npm run typecheck` |
| node `unit-tests` | `cd node && npm test` |
| node `storybook-tests` | `cd node && npx playwright install --with-deps chromium && npm run test:storybook && npm run build-storybook` |
| python `code-quality` | `cd python && pip install black flake8 flake8-pyproject 'django==4.2' && flake8 && black src tests --check` |
| python `unit-tests` | `cd python && pipenv install --dev && pipenv run pip install . && pipenv run pytest` |
| ruby `code-quality` | `cd ruby && gem install rubocop && rubocop` |
| ruby `unit-tests` | `cd ruby && bundle install && bundle exec rake test` |

A change that touches only `publish.yml`, `release.yml`, `beta-bump.yml` or `major.yml` starts **no** checks,
because the path filters cover each library's own workflow file and nothing else. Use
`workflow_dispatch` to exercise a library workflow after editing one of the release workflows.

## Consuming a beta

Every merge to `next` triggers `beta-bump.yml`, which bumps and commits a new beta for each library
whose directory has moved since its last bump commit; that commit's own push is what makes
`publish.yml` actually publish it. node betas go to npmjs.com, python betas to PyPI and ruby betas
to rubygems.org.

| | Install a beta | Note |
|---|---|---|
| node | `npm install habarico@beta` | Betas carry the `beta` dist-tag, so a plain `npm install` still resolves the last stable version |
| python | `pip install --pre 'habarico==5.11.0b26'` | PEP 440 normalises the version: `5.11.0-beta.26` is stored as `5.11.0b26` |
| ruby | `gem 'habarico', '0.57.0.pre.beta.20'` | `Gem::Version` normalises too: `0.57.0-beta.20` becomes `0.57.0.pre.beta.20` |

**Finding out which beta is current.** Betas are deliberately not tagged, but every one is committed
— the version file on `next` names it directly. To go the other way, from a version back to its
commit:

```sh
git log -1 --grep '^Bump version to .*node@6.9.0-beta.3' -- node/
```

For node, npm also records a provenance attestation on every publish, which names the commit
directly.

## Cutting a release

Releasing is a single button that releases **every** library whose directory has moved since its
last stable tag, together — with `SHARED_MINOR_MAJOR` (the default) every library, once any of
them has moved. That is deliberate: because they all go at once, the tree on `next`
holds only released code afterwards, which is what makes fast-forwarding `master` to it correct.

1. Make sure each library's `## [Unreleased]` changelog section says what you want the release
   notes to say. The finalize rewrites that heading in place; it does not write content.
2. Check the version files name the versions you intend to release. On `next` a version file
   names the version being *worked towards*, not the last one released — so `node/package.json`
   saying `6.9.0` means the next release is `6.9.0`. With `SHARED_MINOR_MAJOR` all of them must
   be on one major.minor; a major is started with `major.yml` (see below). Without it, changing a
   version is an ordinary reviewed pull request, per library.
3. Run `release.yml` with **`dry_run` checked** and read the output.
4. Run it again without `dry_run`.

What it does, in this order — the order is load-bearing, see `RELEASE-DESIGN.md`:

1. Refuses to run unless `master` is an ancestor of `next`.
2. Stamps each changelog and commits once, `Bump version to <lib>@<version>, …`.
3. Pushes `next`, fast-forwards `master`, then pushes the tags. **Tags last**, because tags start
   the publishes — if anything above fails, nothing has reached a registry.
4. Creates `release/<lib>@vX.Y` maintenance branches, never touching one that already exists.
5. Advances the version files to the next cycle in a second commit, pushed to `next` alone.

Afterwards, check that `publish.yml` ran for each tag and that the versions appear in the
registries. There is no patch-release button yet — a patch off a maintenance branch has to be
versioned, committed and tagged by hand.

## Starting a major

With `SHARED_MINOR_MAJOR`, run `major.yml` from the Actions tab — first with **`dry_run`
checked**. It moves every library onto `X+1.0.0-beta.1` in one bump commit on `next`, and that
commit publishes the first beta of each. A second press while the cycle is already on a new major
fails. Release it with `release.yml` as usual.

## Troubleshooting

**`ERROR: SHARED_MINOR_MAJOR is on, but the libraries are on different major.minor versions`** (or
**`only some libraries are on a pre-release`**) — `beta-bump.yml`, `release.yml` and `major.yml`
refuse to run on drifted version files, because `pydev` can only bump, not set a version. Put all
version files on one major.minor, and all or none on a beta, in a pull request to `next`.

**`ERROR: master is not an ancestor of next`** — someone committed directly to `master`, so it can
no longer be fast-forwarded. The finalize refuses before writing anything, so nothing is half
done. Fix it once by merging `origin/master` into `next` and pushing, then run the release again.

**`this version is already on rubygems.org - continuing`** (or PyPI's `Skipping … already exists`) — not an error. A retried job
lands here, and so does a beta whose counter collided. The publish carries on to the next step.

**A library was not published.** `beta-bump.yml` compares the directory against the library's
**last bump commit**, not against the previous commit, so a bump that failed to run is still
pending next time — re-run the workflow rather than forcing anything. If it is still skipped, the
directory genuinely has no changes since that commit. Check with:

```sh
BASE=$(git log -1 --format=%H --grep '^Bump version to' -- node/)
git --no-optional-locks diff --stat "$BASE" HEAD -- node/
```

**A publish job failed.** Fix the cause in a pull request to `next`, then run `publish.yml` from
the Actions tab on `next` with the failed `library` — or on its `<lib>@X.Y.Z` tag for a stable
release. "Re-run failed jobs" does not pick the fix up: a re-run uses the workflow file of the
commit it first ran on. The manual run publishes the version in the library's file, and refuses
when the library has changed since its last bump commit; that change gets a new beta from the next
merge instead. Versions already in a registry are skipped.

**`version file still on a released version, advancing to …`** in the log — the second commit of
the previous release (the one advancing the version files) never landed. The workflow heals
itself by advancing to the next version, which is why this is a note and not a failure. Check
that the version file on `next` now matches what was published.

**Two bump commits landed close together and one push was rejected.** `beta-bump.yml` queues
concurrent runs on the same branch (`concurrency: beta-bump-next`) but does not retry a rejected
push — see the Race note in `RELEASE-DESIGN.md`. Nothing is lost: the failed run's "needs a bump"
answer is still true, so the next merge to `next` bumps and publishes it — or re-run the rejected
`beta-bump.yml` job from the Actions tab, which re-evaluates the same commit and pushes cleanly
once the trunk has stopped moving.

**A publish job did not start at all.** `publish.yml`'s `detect` job only runs on `next` when the
commit message both starts with `Bump version to` *and* names a prerelease
(`-alpha.`/`-beta.`/`-rc.`) — an ordinary merge fails this by design (nothing should publish until
`beta-bump.yml` has actually committed a bump), and so do `release.yml`'s finalize and advance
commits (neither names a prerelease). If `beta-bump.yml` ran and pushed a bump commit but
`publish.yml` still didn't fire, check that commit's message matches the pattern above and that
`beta-bump.yml`'s push actually used the GitHub App token — a push made with `GITHUB_TOKEN` would
not have triggered `publish.yml` at all.
