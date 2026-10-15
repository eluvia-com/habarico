# `src/design/` — design layer

## Contents

- [What this layer is](#what-this-layer-is)
- [Internal structure](#internal-structure)
  - [Which tier does a component go in?](#which-tier-does-a-component-go-in)
- [Storybook](#storybook)
  - [Story standard](#story-standard)
- [Rules](#rules)

## What this layer is

Purely **presentational, schema-agnostic** UI primitives that carry the habarico design
language. Everything here is **props-driven**: no dependency on React Admin, on the habarico
schema, or on any data/context provider. Components take their data and callbacks as props and
render.

This layer is consumed both by the habarico library core (schema-driven generation) and by custom
screens, so the same visual language is reused everywhere. Every reusable, presentational primitive
lives here — the generic building blocks (`Icon`, `SvgColor`, `EluviaLogo`, `HabaricoLogo`,
`FlagIcon`, `SocialIcon`, `NoLogo` …) as well as the richer molecules and organisms below. Anything
schema- or React-Admin-aware belongs one layer up in `admin`/`schema` instead (the `View*`
view-shell primitives, for example, are part of `@admin/views`).

The layering is `foundation → design → admin → schema`, with dependencies flowing strictly
downward.

## Internal structure

Components are organised by **atomic design** (Brad Frost's atoms → molecules →
organisms). This is the one layer where that taxonomy applies, because `design` is the
only layer that _is_ a design system — the other layers (`foundation`, `admin`, `schema`)
stay on a plain `components/` directory. Non-component code keeps the usual
per-layer skeleton (`hooks`/`contexts`/`utils`/`theme`/`types`) as siblings of the
atomic tiers. Two component areas sit **outside** the tiers by design: `layouts/` (the
app-shell chrome, too app-specific to be an "organism") and `pages/` (story-only mockups).

| Directory / file | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `atoms/`         | Smallest building blocks — do **not** compose other design components. `Button`, `Icon`/`Iconify`/`SvgColor`, `Chip`, the plain surfaces (`Card`, `Paper`, `CardHeader`, `Table`, `Tabs`), form atoms (`TextField`, `OutlinedInput`, `Autocomplete`, `Checkbox`, `Radio`, `PasswordField`, `SearchField`), links (`Link`, `RouterLink`), and the logos/marks (`EluviaLogo`, `HabaricoLogo`, `NoLogo`, `FlagIcon`, `SocialIcon`).                                                                          |
| `molecules/`     | A handful of atoms composed into one reusable unit. `Panel` (+ `PanelHeader`/`PanelContent`/`PanelFooter`), `PropertyItem`/`PropertyList`, `InputLayout`, `ActionsStack`, `TreeSelect`, `RichText`, `EnumChip`, `DragHandle`, `CustomDialog` (+ `CustomDialogTitle`), `ImagePanel`/`GhostPanel`.                                                                                                                                                                                                          |
| `organisms/`     | Self-contained, complex sections. `DataGrid` / `DataTable` / `FormTable`, `InspectorPanel`, `ObjectHero`, `Gallery`, `PanelGrid`, `DashboardGrid`, `UploadArea`, `ConfirmDialog`.                                                                                                                                                                                                                                                                                                                         |
| `layouts/`       | App **shells** and their chrome — fully presentational (props/context-driven, no schema/RA): `DashboardLayout` / `AuthLayout` / `SimpleLayout`, the shared header & navigation parts under `shared/` (app bar, `Menu`, `Breadcrumbs`, `Search`, account / notifications / settings panels, mode & width toggles), and the layout contexts under `contexts/` (`LayoutProvider`, `LayoutDynamicContext`, `SettingsContext`). The `admin` layer wraps these into `AdminDashboardLayout` / `AdminAuthLayout`. |
| `theme/`         | MUI theme — tokens + component overrides + `ThemeProvider` / `LocaleProvider` (`@design/theme`); `createTheme` and the `habarico` / `minimals` variants.                                                                                                                                                                                                                                                                                                                                                  |
| `hooks/`         | Presentation-only hooks (local UI state, no data fetching): `useDialog`, `useMenu`, `usePopover`, `useConfirm`.                                                                                                                                                                                                                                                                                                                                                                                           |
| `contexts/`      | Presentation-only React contexts shared within a subtree: `PanelGridContext`, `IsLastPanelContext`, `ValueLocationContext`. (App-shell contexts live under `layouts/contexts/`.)                                                                                                                                                                                                                                                                                                                          |
| `utils/`         | Pure helpers for the design components: `tableActions`.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `types.ts`       | Shared types for the design layer (`@design/types`).                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `constants.ts`   | Density coefficients shared by the design layer and the admin datagrid (`@design/constants`).                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pages/`         | **Story-support** full-page mockups — `design/pages/*.stories.tsx` (Dashboard, PropertyList / Detail / Edit, NewOwnerDialog) + `_shell.tsx`. Static compositions of design components; not exported from the barrel. Parallels `admin/pages/`.                                                                                                                                                                                                                                                            |
| `index.ts`       | The public layer barrel (`@design`) — re-exports leaf modules directly (and the `layouts/*` shells + layout contexts).                                                                                                                                                                                                                                                                                                                                                                                    |

### Which tier does a component go in?

Classify by **composition depth**, not by size or importance:

- **atom** — renders on its own; does not import another `@design` component (it may wrap
  a single MUI atom or an SVG). _Button, Chip, Divider, Icon, SvgColor, EluviaLogo._
- **molecule** — composes a few atoms into one labelled, reusable unit with a bit of local
  behaviour. _Panel (a `Card`/`CardHeader`/`CardContent` compound + `Icon`/`Typography`),
  PropertyItem (label + value/input), InputLayout (fieldset frame + legend), ActionsStack._
- **organism** — a complex, self-contained region built from molecules and atoms, often
  with its own layout. _DataGrid/DataTable/FormTable, InspectorPanel, ObjectHero, Gallery, PanelGrid._
  (App shells — the app bar, sidebar and menu — are **not** organisms; they live in `layouts/`.)

A container that only takes `children` is an **atom** even if consumers nest molecules inside
it — classify by what the component composes **internally**, not by what a caller puts in it.
That is why the plain surfaces (`Card`, `Paper`, `Table`) and the structural leaves
(`CardHeader`, `Backdrop`, `MenuItem`, `Divider`) are all **atoms**.

**Interaction primitives are hooks, not components.** `useDialog` / `useMenu` / `usePopover`
own only open/close state and live in `hooks/` — they add no markup and so don't fit any tier.
Their visual parts (Backdrop, MenuItem …) are atoms; a composed shell that arranges those parts
would be a molecule.

When a component sits on a boundary, place it by the **highest-level thing it composes**
(a component that composes a molecule is an organism). Reclassifying later is a cheap
move + a title change — don't over-think the first placement.

The tier directories deliberately have **no `index.ts`** of their own. `src/design/index.ts`
re-exports leaf modules directly (e.g. `export * from './molecules/Panel';`), and code that
wants a specific module imports it by its sub-path (`@design/atoms/Chip`, `@design/hooks/useDialog`).

## Storybook

Every component in this layer ships with `*.stories.tsx`. The Storybook glob covers
`src/**`, and the global light/dark decorator (`.storybook/preview.ts`) applies, so each
story is verifiable in both **light** and **dark** mode. Group story titles under
`design/<tier>/<Name>` — the tier segment matches the folder (`design/atoms/Button`,
`design/molecules/Panel`, `design/organisms/InspectorPanel`).

### Story standard

Stories follow one documentation/presentation standard so Storybook reads like a component
design system. The canonical rules live in the **Storybook** section of the repo-root
`CLAUDE.md`; the reference implementation is **`design/atoms/Button`**. In short:

- **Autodocs Docs page per component** — set `component` + `tags: ['autodocs']`; write the
  prose in `parameters.docs.description.component`.
- **Curated props/API table** — list only the props that matter in `argTypes` and mirror them
  in `parameters.controls.include` (MUI atoms otherwise dump hundreds of props).
- **Export order = display order:** `Playground` (the only args-driven story → Controls) →
  `Variants` → `Colors` / `Sizes` / `States`.
- **Shared kit** — import `{padDecorator, Showcase, Row, VariantGrid, SHOWCASE_COLORS}` from
  `_storyKit` (the design-layer root). Importing it also loads the MUI theme module augmentations
  (`customShadows`, `radius`, palette shades) that story files miss because they are excluded
  from `tsconfig`. `_storyKit.tsx` is a story-support module — it is **not** exported from the
  layer barrel and never ships in the library.
- **Hooks** live in a top-level demo component, never in a `render` arrow. Pure-composition
  atoms (`Table`) and the interaction hooks (`useDialog` / `useMenu` / `usePopover`, under
  `design/hooks`) skip the Playground and show a single interaction demo instead.

Autodocs requires the `@storybook/addon-docs` dev-dependency (registered in
`.storybook/main.ts` with `docs.autodocs: 'tag'`).

## Rules

- **No** imports from `react-admin`, `@schema` (schema-driven core: providers, contexts,
  types, …), or any data layer. If a component needs backend/schema awareness it does
  not belong here.
- Prefer the MUI theme (`@design/theme`) for all tokens (colors, spacing, radii, shadows) so
  light/dark work out of the box — do not hardcode design values.
- Keep components generic and reusable; screen-specific composition lives elsewhere.

The downward-only layering is enforced in CI by the `boundaries/dependencies` ESLint rule (see the
repo-root `eslint.config.mjs`): `design` may import only `@foundation`. The `react-admin` / `@schema`
prohibition is a convention (the rule checks the cross-layer direction, not external packages) —
`react-admin` and schema awareness simply do not belong in a presentational layer.
