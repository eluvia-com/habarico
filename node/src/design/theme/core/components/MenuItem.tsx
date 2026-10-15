import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiMenuItem: NonNullable<ThemeOptions['components']>['MuiMenuItem'] = {
  styleOverrides: {
    root: ({theme, ownerState}): CSSObject => ({
      ...theme.typography.body2,
      borderRadius: theme.radius.md,
      padding: theme.spacing(0.75, 2, 0.75, 1),
      // MUI bumps a `MenuItem`'s `minHeight` to 48px below `sm` (a mobile touch target) and drops it to
      // `auto` from `sm` up. That makes items visibly taller on narrow screens — exactly where an
      // `OverflowToolbar` collapses (`iconOnly="sm"`), so its `⋮` menu jumped in height. Pin `auto` at
      // every width so the compact, content-driven height (padding + `body2`) stays consistent.
      minHeight: 'auto',
      // The two rules above pin a fixed padding/minHeight on every breakpoint, which silently
      // swallowed MUI's own `dense` variant (it only overrides `paddingTop`/`paddingBottom`/
      // `minHeight`/typography, applied with the same specificity — last one registered wins, and
      // this `root` override is registered after MUI's base styles). Restate `dense` explicitly
      // here so toggling the prop still has a visible effect. In plain MUI the step is body1 →
      // body2; our `root` is already pinned to `body2` at rest (see the `ListItemText-primary`
      // rule below), so dense steps one size further down, to `caption`.
      ...(ownerState.dense && {
        ...theme.typography.caption,
        minHeight: 32,
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
      }),
      // Unify the leading icon + label across menu items (ListItemIcon-based items like
      // ButtonsStack and raw-icon popover items read the same): a consistent 12px gap,
      // 20px glyphs, and an icon that tints with the item's text color (so an `error`
      // item shows a red icon too). Scoped to nested selectors so global Lists are untouched.
      gap: theme.spacing(1.5),
      // 4px gap between consecutive items so they never sit flush. Applied as a sibling
      // margin (not a container `gap`) so it is container-agnostic — it spaces items the
      // same in a `Menu`, a `Select` and a bare `MenuList` (e.g. AccountPopover), none of
      // which share a themeable list slot. Only item-after-item matches, so dividers that
      // break groups keep their own spacing.
      '& + &': {
        marginTop: theme.spacing(0.5),
      },
      '& .MuiListItemIcon-root': {
        minWidth: 'auto',
        marginRight: 0,
        color: 'inherit',
      },
      '& .MuiListItemIcon-root .MuiSvgIcon-root': {
        fontSize: 20,
      },
      '& .MuiListItemText-root': {
        margin: 0,
      },
      // `ListItemText` renders its label as `body1`, which is larger than the item's own `body2`
      // font — so an item built from `ListItemIcon`/`ListItemText` looked bigger than a plain-text
      // one in the same menu. Pin the label to the item's own size (`body2`, or `caption` when
      // `dense`) so every item matches, icon-based or plain text.
      '& .MuiListItemText-primary': {
        ...(ownerState.dense ? theme.typography.caption : theme.typography.body2),
      },
      // A `Divider` that separates groups gets the same 4px breathing room on both sides as the gap
      // between items (replacing MUI's default `8px 0`), so item → divider → item stays evenly
      // spaced. The item after the divider isn't a `& + &` match, so this margin is its only gap.
      '& + .MuiDivider-root': {
        marginTop: theme.spacing(0.5),
        marginBottom: theme.spacing(0.5),
      },
    }),
  },
};
