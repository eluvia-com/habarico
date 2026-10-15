# `src/foundation/` — foundation layer

## Contents

- [What this layer is](#what-this-layer-is)
- [Internal structure](#internal-structure)
  - [Where does a member go?](#where-does-a-member-go)
- [Rules](#rules)

## What this layer is

The **non-visual shared kernel** of the library. Everything here is **framework/UI-agnostic**:
no React Admin, no habarico schema, and crucially **no MUI and no theme**. It holds the pieces
every other layer needs but that carry no visual identity — shared types, pure utilities, i18n
message data, and navigation hooks that are pure routing logic.

`foundation` is the **bottom** layer. Dependencies flow strictly downward
(`schema → admin → design → foundation`); foundation itself **never imports "up"** into
`design`, `admin` or `schema`.

## Internal structure

| Directory / file | Contents                                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/`         | Pure, non-visual helpers: `globMatch`, `template`, `navigation` (incl. `LinkTarget`), `form`, `file`, `image`, `upload`, plus the `locale/` message dictionaries and `localflavor/` formatters. |
| `hooks/`         | Non-visual hooks (react-router / plain logic only, no MUI): `usePathname`, `useRouter`, `useTabsLocation`, `useFileModifier`.                                                                   |
| `index.ts`       | The layer barrel (`@foundation`) — re-exports only the genuinely public members.                                                                                                                |

The tier directories deliberately have **no `index.ts`** of their own; leaf modules are imported
by sub-path (`@foundation/utils/globMatch`, `@foundation/hooks/usePathname`), and `index.ts`
re-exports the public members directly.

> **Note — the shared type kernel (`@typing`).** The library's root types still live in
> `src/types.ts` (the `@typing` alias points there), not yet in a `foundation/types/`. Extracting
> the schema-agnostic type vocabulary out of `schema/types.ts` into `foundation/types` is a planned
> follow-up (HAB-668 §6); until then, `foundation` has no `types/` directory.

### Where does a member go?

Classify by **nature**, not by size — everything here is non-visual:

- **pure helper or data** — a framework-agnostic function or dataset (no React, no MUI, no RA):
  `utils/`. _`globMatch`, `template`, the `locale/` dictionaries._
- **non-visual hook** — a logic-only / routing hook that renders nothing and touches no MUI:
  `hooks/`. _`usePathname`, `useTabsLocation`._
- **shared type** — a schema-agnostic type in the library's type vocabulary: `@typing`
  (`src/types.ts` for now — see the note above).

If a member needs MUI or the theme it belongs in `design`; if it needs React Admin or a schema, in
`admin` / `schema`.

## Rules

- **No** imports from `react-admin`, `@schema`, `@design`, `@design/theme`, MUI, or any
  data/UI layer. If a module needs MUI/theme it belongs in `design`; if it needs RA/schema it
  belongs in `admin`/`schema`.
- Keep it pure and generic: framework-agnostic helpers, plain data, and logic-only hooks.

The downward-only layering is enforced in CI by the `boundaries/dependencies` ESLint rule (see the
repo-root `eslint.config.mjs`): as the bottom layer, `foundation` may import nothing from the other
three. The `react-admin` / MUI prohibition above is a convention (the lint rule checks only the
cross-layer direction, not external packages), so keep it in mind when adding dependencies — a
type-only `ra-core` i18n import in `utils/locale` is the one tolerated framework touch.
