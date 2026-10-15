import {Breakpoint} from '@mui/material';

// The MUI breakpoint keys, ascending. Typed as `readonly Breakpoint[]` so the set stays in lockstep
// with the theme's breakpoints at the type level (the build flags a stray key) while keeping the
// resolver pure — no `theme.breakpoints.keys` read needed.
const MUI_BREAKPOINTS: readonly Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

// A dialog this narrow reads better as stacked (label above the input) than as label-beside-input:
// the `PropertyItem` container query only flips at 320px, far below any dialog's real width, so it
// never stacks on its own. Widths at or under `sm` (≤ 600px, or a smaller CSS width) opt into the
// stacked form; anything wider (incl. the default `xl`) keeps the width-driven `auto` layout.
const COMPACT_DIALOG_BREAKPOINTS: readonly Breakpoint[] = ['xs', 'sm'];
const COMPACT_DIALOG_MAX_PX = 600;

// The widest preset — used when `dialogWidth` is omitted or unparseable.
const DEFAULT_DIALOG_MAX_WIDTH: Breakpoint = 'xl';

const isBreakpoint = (value: string): value is Breakpoint =>
  (MUI_BREAKPOINTS as readonly string[]).includes(value);

// Whether a schema `dialogWidth` string denotes a compact (stacked) dialog. Kept separate from the
// resolver so its intent reads on its own, but private — the resolver is the only public entry.
const isCompactDialogWidth = (dialogWidth?: string): boolean => {
  if (!dialogWidth) return false;
  if (isBreakpoint(dialogWidth)) {
    return (COMPACT_DIALOG_BREAKPOINTS as readonly string[]).includes(dialogWidth);
  }
  const px = parseFloat(dialogWidth);
  return Number.isFinite(px) && px <= COMPACT_DIALOG_MAX_PX;
};

export type ResolvedDialogWidth = {
  // MUI `maxWidth` breakpoint, when `dialogWidth` names a breakpoint (or is omitted → `xl`).
  maxWidth?: Breakpoint | false;
  // Exact paper width in px, when `dialogWidth` is a CSS/px value (`'720px'` / `'720'`).
  width?: number;
  // Whether the resolved width is narrow enough to stack property lists (≤ sm / ≤ 600px).
  isCompact: boolean;
};

/**
 * The single interpreter of the schema `dialogWidth` string. A breakpoint key (`'sm'`…) drives the
 * MUI `maxWidth`; anything else is parsed as a px width that pins the dialog paper to that exact
 * width. Omitting `dialogWidth` defaults to the `xl` breakpoint (the widest preset). `isCompact`
 * marks the narrow widths (≤ sm / ≤ 600px) that opt into stacked property lists.
 */
export const resolveDialogWidth = (dialogWidth?: string): ResolvedDialogWidth => {
  const isCompact = isCompactDialogWidth(dialogWidth);
  if (!dialogWidth) {
    return {maxWidth: DEFAULT_DIALOG_MAX_WIDTH, isCompact};
  }
  if (isBreakpoint(dialogWidth)) {
    return {maxWidth: dialogWidth, isCompact};
  }
  const px = parseFloat(dialogWidth);
  if (Number.isFinite(px)) {
    return {width: px, isCompact};
  }
  // Unparseable → fall back to the default preset rather than a broken width.
  return {maxWidth: DEFAULT_DIALOG_MAX_WIDTH, isCompact};
};
