import type {CSSObject, Theme} from '@mui/material';
import {ACTIONS_FIELD} from './constants';

/** Class applied (via `getRowClassName`) to a zebra-striped row. */
export const STRIPED_ROW_CLASS = 'dg-row-striped';

// Zebra striping — a subtle `stripeRow` tint on alternate rows. The striped class is added by
// `getRowClassName` (see DataGrid.tsx) and never to semantic-tinted rows. Emitted BEFORE the
// hover/selected highlight so those equal-specificity rules still win: a striped row shows the
// primary hover/selected tint on interaction (both share the `backgroundImage` channel, so the
// highlight overrides — replaces — the stripe rather than stacking on it).
export const stripedRowSx = (theme: Theme): CSSObject => ({
  // Overlay the stripe as a gradient on the row's opaque paper base (kept, not replaced) — the same
  // technique as the sticky actions cell (`stripedActionsSx`), so both composite `paper + stripeRow`
  // and match exactly. A plain semi-transparent `backgroundColor` would drop the paper base and
  // composite over the darker layer behind the row, reading darker (most visibly in dark mode).
  [`& .MuiDataGrid-row.${STRIPED_ROW_CLASS}`]: {
    backgroundImage: `linear-gradient(${theme.palette.stripeRow}, ${theme.palette.stripeRow})`,
  },
});

// The stripe overlaid onto the opaque, sticky actions cell (as a gradient layer so it stays opaque),
// mirroring `actionsHighlightSx`. Emitted before it so the hover/selected overlay wins on interaction.
export const stripedActionsSx = (theme: Theme): CSSObject => ({
  [`& .MuiDataGrid-row.${STRIPED_ROW_CLASS} .MuiDataGrid-cell[data-field="${ACTIONS_FIELD}"]`]: {
    backgroundImage: `linear-gradient(${theme.palette.stripeRow}, ${theme.palette.stripeRow})`,
  },
});
