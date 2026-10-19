# Release flow on GitHub Actions

Design record for moving the release orchestration off GitLab. The GitHub repository becomes the
single home for code, CI and releases, and the libraries publish to the public registries only.

Decided so far: betas are published on every merge to `next`. They are **never tagged**, but every
beta lands in one `Bump version to ...` commit on `next` — `beta-bump.yml` writes it, via `pydev`,
and that push is what triggers `publish.yml`.

## What exists today (GitLab)

| Job | Trigger | Does |
|-----|---------|------|
| `release-next-auto` | push to `next` | Finds libraries whose directory differs from the tag of their current version, bumps each to the next beta, one `Bump version to …` commit, one tag per library, pushes both. |
| `release-next-final` | manual button | Releases every library sitting on a pre-release: writes the stable version, stamps the changelog, one commit, one tag per library, pushes `next`, fast-forwards `master`, pushes tags, creates `release/<lib>@vX.Y` branches. |
| `publish` | tag `<lib>@X.Y.Z` | Builds and pushes to the registry. |

## What it becomes

| Workflow | Trigger | Does |
|----------|---------|------|
| `beta-bump.yml` | push to `next` | Finds libraries whose directory moved since their last bump commit, bumps each to the next beta via `pydev` (continuing an open prerelease cycle, or starting one), one `Bump version to …` commit, no tag, pushes `next`. Publishes nothing — its own push is what starts `publish.yml`. |
| `publish.yml` | push to `next`, tag `<lib>@X.Y.Z`, and `workflow_dispatch` | The **only** workflow that publishes. On `next` it reads the version straight off the bump commit that triggered its run (nothing derived — see "Version derivation" below); on a tag it publishes the stable artifact and creates a GitHub Release from the changelog section; a manual run publishes one library again at the version its file carries on the chosen ref. Writes nothing to git. |
| `major.yml` | `workflow_dispatch` | The major button, only with `SHARED_MINOR_MAJOR`. Moves every library onto the first beta of the next major, one `Bump version to …` commit, pushes `next`; that push starts `publish.yml`. |
| `release.yml` | `workflow_dispatch` | The finalize button. Stamps the changelog, one commit, one tag per library, pushes `next`, fast-forwards `master`, creates maintenance branches, then advances the version files to the next target. Publishes nothing — the tags it pushes are what start `publish.yml`. |

**One publishing workflow, not several, and no reusable `workflow_call` split.** Every registry
matches a trusted publisher on the *workflow filename*, and RubyGems needs extra `Workflow
Repository Owner`/`Name` fields when the job lives in a reusable workflow, because the OIDC token
then points at the reusable workflow rather than the caller. Keeping all publishing in
`publish.yml` makes the configuration in all three registries identical and unambiguous, and it
means a beta and a stable publish cannot drift apart because they are the same code.

Publish jobs run in a GitHub **Environment** named `release`, which the registries can pin in the
trusted publisher configuration and which gives somewhere to hang protection rules later.

`beta-bump.yml` and `release.yml` both push `Bump version to ...` commits to `next`, and only the
former should ever publish a beta. `publish.yml`'s `detect` job guards against both at once by
requiring the commit message to *also* name a prerelease (`-alpha.`/`-beta.`/`-rc.`) — a stable
release's changelog-stamp commit and its version-file advance commit never do, so both are
correctly ignored without a separate check. An ordinary merge to `next` fails the same guard
(its message never starts with `Bump version to` at all) and is ignored too — nothing publishes
until `beta-bump.yml` has actually committed something.

## What identifies a library

Today: a top-level directory with its own `.gitlab-ci.yml`. That marker dies with GitLab.

Replacement: a top-level directory with its own **pydev config** (`.pydev/base.yml` carrying
`version.files`, or the older `.pydev/base.conf` with `VERSION_FILES`). That is the more honest
marker anyway — it is what makes a directory a versioned unit, and the repository already treats
it that way.

## Version derivation — the subtle part

`beta-bump.yml` decides, per library, whether a cycle is already open or has to start:

```
current = pydev version print                 # whatever the file says right now
if current has a -alpha./-beta./-rc. suffix:   # a cycle is already open
    version = pydev version bump-to-next -p beta
else:                                           # last bump was a finalize, or none ever ran
    version = pydev version bump-to-next -r $RELEASE_LEVEL -p beta
```

`pydev` writes the result back to the file itself — there is no separate counter to compute or
target to derive. `RELEASE_LEVEL` (default `minor`) is only consulted when starting a *new* cycle,
matching what the finalize below advances by, so a beta is never numbered off a target that never
ships.

The finalize's write is unchanged by any of this:

1. Stamp the changelog, commit, tag `<lib>@6.9.0` on that commit, push `next`, fast-forward
   `master`, push the tag.
2. A second commit advances the file to the next target (`RELEASE_LEVEL`, default `minor`), pushed
   to `next` alone — which is exactly the state `beta-bump.yml` reads as "no cycle open, start one"
   the next time that library's directory moves.

So `master` always holds exactly the released state, and `next` runs one bump commit ahead of it —
either the finalize's advance, or the open end of a beta cycle.

`SHARED_MINOR_MAJOR` (default `true`, as in `.gitlab-ci.yml`) keeps major.minor identical across
the libraries: when no cycle is open, `beta-bump.yml` bumps every library rather than only the
changed ones, and `release.yml` releases every library once any has moved. The shared check in
`.github/scripts/libraries.sh` fails all three release workflows on drifted version files.

Without it, choosing a different next version is an ordinary edit of the version file in a normal, reviewed
pull request — per library, human-authored, no bot involved, since `beta-bump.yml` only starts a new
cycle when none is open; it never overrides a version someone set by hand.

**Consequences, stated plainly:**

- The version file *does* tell you which beta is current — it is committed, unlike the discarded
  on-the-fly design this replaced.
- Finding the commit that shipped a given beta is `git log --grep '^Bump version to .*6.9.0-beta.3'`
  on the exact string, not counter re-derivation.
- `git checkout node@6.9.0-beta.3` still doesn't work — betas are never tagged, only committed —
  but `git log --grep` on the version string gets you the commit directly.

## Detection

Two tiers now, one per workflow, each comparing against a different base for a different reason.

**`beta-bump.yml`** decides whether a library needs a new beta by comparing its directory against
its **last bump commit**, not the previous commit:

```
BASE=$(git log -1 --format=%H --grep '^Bump version to' -- "<lib>/")
git diff --quiet "$BASE" HEAD -- "<lib>/"
```

A state comparison, not an event one — the same reasoning that ruled out `rules:changes` /
`CI_COMMIT_BEFORE_SHA` on GitLab still applies: those compare against the immediately preceding
commit, so an amend or a force push makes them quietly miss a library. Comparing against the last
bump commit is self-healing instead: a bump that failed to run is still pending next time, no
matter how much history landed in between.

**`publish.yml`'s `detect` job** needs no such comparison at all. By the time it runs on a branch
push, the `if:` guard has already established that this exact commit is a bump commit naming a
prerelease — so it only has to ask "did *this* commit touch `<lib>/`", i.e. `HEAD~1` vs. `HEAD`,
which is safe here specifically because the commit is known to be a single, well-defined one (not
a state comparison over arbitrary history).

## Ordering in the finalize

Kept exactly as it is today, because every step of it is load-bearing:

1. Refuse to run if `master` is not an ancestor of `next` — otherwise the push would be rejected
   halfway through and leave a partial release.
2. Everything up to this point only reads. A rejected release leaves the repository untouched.
3. Stamp the changelogs, one commit. The version files are already correct — see above.
4. Push `next`, then fast-forward `master`, then the tags — **tags last**, because tags start the
   publishes. If anything above fails, nothing has reached a registry yet.
5. Maintenance branches, never force-updated: an existing branch may already carry cherry-picked
   fixes.
6. Advance the version files to the next target, in a second commit pushed to `next` alone. Last
   because it is the least critical step, and because the fallback in the derivation above makes a
   failure here self-correcting rather than fatal.

## Race

Two merges to `next` in quick succession can both start `beta-bump.yml` before either has pushed.
`concurrency: {group: beta-bump-next, cancel-in-progress: false}` queues the second run behind the
first rather than letting them race, which closes most of the window — but not the moment between
the queued run's own checkout and its push, where a push from *outside* this workflow (a direct
push to `next`, if that were ever allowed) could still land first and turn its push into a rejected
non-fast-forward.

No retry loop exists for this, deliberately: detection is a state comparison against the last bump
commit, not an event one, so a run that fails to push is not a lost beta — the next merge's run
recomputes the same "needs a bump" answer and pushes it then. The risk is accepted rather than
engineered around, the same call GitLab's own template makes for the equivalent single job.

## Credentials

**Writing to the repository** (`release.yml`'s finalize, and `beta-bump.yml`'s bump commit) uses a
GitHub App token via `actions/create-github-app-token`, not `GITHUB_TOKEN`, in both workflows.
Pushes made with `GITHUB_TOKEN` deliberately do not start further workflow runs — for `release.yml`
that would mean the release tags never trigger `publish.yml`; for `beta-bump.yml` it would mean its
own bump commit never triggers `publish.yml` either, and no beta would ever actually publish. Both
workflows share the one App, which needs `contents: write` and a ruleset bypass on `next` and
`master`.

`publish.yml` itself needs no write token at all — it publishes and writes nothing.

**Publishing** uses OIDC trusted publishing on all three registries, so no long-lived registry
token exists anywhere:

- npm — `id-token: write`; publishes provenance attestations automatically.
- PyPI — the reason this was impossible before: PyPI supports GitLab CI/CD only for gitlab.com,
  not for self-managed instances.
- RubyGems — via `rubygems/configure-rubygems-credentials`.

Each registry needs the trusted publisher configured once, against this repository and the exact
workflow filename. npm additionally requires the package to have at least one version already
published before a trusted publisher can be attached; see below.

## Bootstrapping the first public release

All three libraries publish as `habarico`: the npm package is unscoped because the `@eluvia` scope
maps to the private registry `habarico-enterprise` is installed from. Trusted publishing cannot be configured the same way for all
three before a package exists:

| Registry | Before the first publish |
|----------|--------------------------|
| PyPI | A **pending publisher** can be configured against the repository and `publish.yml`; the first publish creates the project. Note it does *not* reserve the name until used. |
| RubyGems | Same — a pending trusted publisher works for a gem that does not exist yet. |
| npm | **Not possible.** A trusted publisher can only be attached to a package that already has at least one published version, so the very first `habarico` publish has to be done another way, with a token, and trusted publishing is configured afterwards. |

## Package metadata that becomes public

Publishing to public registries puts these in front of strangers. The source, changelog and
documentation links point at `github.com/eluvia-com/habarico` and docs.habarico.com, and the gem sets `rubygems_mfa_required`: owners pushing by hand need MFA, a
trusted-publisher push does not.

## Settled

- **Betas are never tagged, but every beta lands in one bump commit on `next`.** `beta-bump.yml`
  writes it via `pydev`; `publish.yml` reads the version back from that commit rather than
  deriving one.
- **The version file on `next` names the target version, or the current beta working towards it.**
  Right after a finalize's advance it's the bare target (e.g. `6.9.0`); once `beta-bump.yml` opens
  a cycle it carries that target's prerelease (`6.9.0-beta.1`, then `.2`, …). Changing the target
  itself is an ordinary reviewed PR, same as before — `beta-bump.yml` only starts a new cycle when
  none is open, so it never overwrites a hand-edited target.
- **`RELEASE_LEVEL` is `minor`** — the value the finalize advances the version file by after a
  release, matching today's `AUTO_BETA_RELEASE`.
- **Ruby publishes to rubygems.org** publicly, not to geminabox.
- **Private dependencies are out of scope.** `eluvia-base` and friends are being made public
  separately; the source configuration is switched over later and is not this design's problem.
- **The documentation site** lives in its own repository (`hab-docs`) and is out of scope here; the pages it renders travel with the library they document, in `<lib>/docs/`.
