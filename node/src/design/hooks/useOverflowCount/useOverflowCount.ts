import {Breakpoint, useMediaQuery, useTheme} from '@mui/material';

/** MUI breakpoints, ascending. */
const BREAKPOINTS: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * A fixed count, or per-breakpoint counts resolved like MUI responsive values: the value defined at the
 * current width, or the nearest smaller one (e.g. `{xs: 2, lg: 3}` yields `2` from `xs` up to `lg`).
 */
export type ResponsiveCount = number | Partial<Record<Breakpoint, number>>;

export interface UseOverflowCountOptions {
  /** Total number of items competing for a slot. */
  total: number;
  /**
   * Max number of items kept inline. The surplus collapses into the `⋮` menu, whose trigger is **always
   * extra** — it never counts against this budget (so `maxVisible: 3` shows 3 items + the trigger, and
   * `maxVisible: 0` puts every item in the menu). Omitted → show everything, no menu.
   */
  maxVisible?: ResponsiveCount;
  /** Force icon-only below a breakpoint (`'sm'` → icon-only under `sm`), or a static boolean. */
  iconOnly?: boolean | Breakpoint;
  /** Fewest items kept inline when overflowing. Defaults to `1`; pass `0` to allow an all-in-menu row. */
  minVisible?: number;
}

export interface OverflowCount {
  /** How many items render inline (before the `⋮` menu). */
  visibleCount: number;
  /** Whether inline controls should drop their labels at the current width. */
  iconOnly: boolean;
  /** Whether any item overflows into the `⋮` menu. */
  hasOverflow: boolean;
}

// Picks the value for the current breakpoint: the last entry defined at or below the active width.
const resolveResponsive = (
  value: ResponsiveCount | undefined,
  active: Record<Breakpoint, boolean>
): number | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  let resolved: number | undefined;
  for (const bp of BREAKPOINTS) {
    if (active[bp] && value[bp] != null) resolved = value[bp];
  }
  return resolved;
};

/**
 * Resolves how many toolbar items stay inline versus collapse into a `⋮` overflow menu at the current
 * viewport, plus whether inline controls go icon-only. Breakpoint-ladder based (variant 2 of HAB-784):
 * it reacts to the viewport, not to the toolbar's own measured width — see HAB-786 for the width-aware
 * successor. Every media query lives here so call sites stay declarative (`maxVisible={{xs: 2, lg: 3}}`)
 * instead of each re-deriving the same `useMediaQuery` ladder.
 */
export const useOverflowCount = ({
  total,
  maxVisible,
  iconOnly,
  minVisible = 1,
}: UseOverflowCountOptions): OverflowCount => {
  const theme = useTheme();
  // Called unconditionally and in a fixed order (rules-of-hooks); `xs` is always active.
  const upSm = useMediaQuery(theme.breakpoints.up('sm'));
  const upMd = useMediaQuery(theme.breakpoints.up('md'));
  const upLg = useMediaQuery(theme.breakpoints.up('lg'));
  const upXl = useMediaQuery(theme.breakpoints.up('xl'));
  const active: Record<Breakpoint, boolean> = {xs: true, sm: upSm, md: upMd, lg: upLg, xl: upXl};

  const budget = resolveResponsive(maxVisible, active) ?? total;

  let iconOnlyResolved: boolean;
  if (typeof iconOnly === 'boolean') {
    iconOnlyResolved = iconOnly;
  } else if (iconOnly) {
    // Below the given breakpoint → force icon-only (`'sm'` → icon-only under `sm`).
    iconOnlyResolved = !active[iconOnly];
  } else {
    iconOnlyResolved = false;
  }

  // On an icon-only row every control — including the `⋮` trigger — occupies the same width, so
  // tucking away a single item behind the trigger buys back no space at all: it costs a click and
  // hides a control for zero layout benefit. Only collapse when at least two items would move into
  // the menu, i.e. the trigger is actually replacing more width than it adds.
  const wouldSaveNothing = iconOnlyResolved && total - budget === 1;
  const effectiveBudget = wouldSaveNothing ? total : budget;

  // `maxVisible` is the exact inline count; the `⋮` trigger is extra (never counted). When it overflows
  // we keep `budget` items inline — but never fewer than the floor (so a `minVisible` of 1 always leaves
  // one real button next to the `⋮`, while `minVisible: 0` allows an all-in-menu row).
  const hasOverflow = total > effectiveBudget;
  const floor = Math.min(minVisible, total);
  const visibleCount = hasOverflow ? Math.max(Math.min(effectiveBudget, total), floor) : total;

  return {visibleCount, iconOnly: iconOnlyResolved, hasOverflow};
};
