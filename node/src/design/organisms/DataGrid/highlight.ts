import {varAlpha} from '@design/theme/utils';
import type {CSSObject, Theme} from '@mui/material';
import {ACTIONS_FIELD} from './constants';

// Hover / selected row highlight — a primary tint plus a 4px primary accent stripe on the left
// (inset shadow → no layout shift), matching `FormTable`/`DataTable`. Selected is the stronger step
// (12% tint / 40% stripe) over hover (8% / 30%). Toggled off for grids that use per-row tinting,
// where this highlight would fight the semantic row colors.
export const rowHighlightSx = (theme: Theme): CSSObject => {
  // The tint/stripe are stronger in dark mode so they read on the darker surface.
  const isDark = theme.palette.mode === 'dark';
  const c = theme.palette.primary.mainChannel;
  const hoverBg = isDark ? 0.2 : 0.08;
  const hoverStripe = isDark ? 0.4 : 0.3;
  const selectedBg = isDark ? 0.3 : 0.15;
  const selectedStripe = isDark ? 0.5 : 0.4;
  // Keep the row's opaque paper base and overlay the tint as a gradient (mirroring the sticky actions
  // cell and the stripe): it composites over paper — not the darker layer behind the row — so it reads
  // right in dark mode, and it shares the `backgroundImage` channel with the stripe, so hover/selected
  // REPLACE the stripe on interaction instead of stacking. `backgroundColor: paper` also neutralizes
  // MUI X's own hover/selected row background so it can't tint through.
  return {
    '& .MuiDataGrid-row:hover': {
      backgroundColor: theme.palette.background.paper,
      backgroundImage: `linear-gradient(${varAlpha(c, hoverBg)}, ${varAlpha(c, hoverBg)})`,
      boxShadow: `inset 4px 0 0 0 ${varAlpha(c, hoverStripe)}`,
    },
    '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover': {
      backgroundColor: theme.palette.background.paper,
      backgroundImage: `linear-gradient(${varAlpha(c, selectedBg)}, ${varAlpha(c, selectedBg)})`,
      boxShadow: `inset 4px 0 0 0 ${varAlpha(c, selectedStripe)}`,
    },
  };
};

// Neutralizes MUI X's built-in hover/selected row backgrounds — used instead of `rowHighlightSx`
// when the highlight is disabled, so those defaults don't fight per-row semantic tinting. It pins
// the hover/selected background back to the row's resting surface (`background.paper`): the base
// surface is transparent, so resetting to `transparent` would drop the row's own paper on hover
// (revealing the darker layer behind), whereas pinning to paper keeps the row unchanged.
export const rowHighlightResetSx = (theme: Theme): CSSObject => ({
  '& .MuiDataGrid-row:hover': {backgroundColor: theme.palette.background.paper},
  '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover': {
    backgroundColor: theme.palette.background.paper,
  },
});

// The row highlight overlaid onto the opaque, sticky actions cell (as a gradient layer so it stays
// opaque). Paired with `rowHighlightSx` — omitted together when the highlight is disabled.
export const actionsHighlightSx = (theme: Theme): CSSObject => {
  const isDark = theme.palette.mode === 'dark';
  const c = theme.palette.primary.mainChannel;
  const hoverBg = varAlpha(c, isDark ? 0.2 : 0.08);
  const selectedBg = varAlpha(c, isDark ? 0.25 : 0.12);
  return {
    [`& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="${ACTIONS_FIELD}"]`]: {
      backgroundImage: `linear-gradient(${hoverBg}, ${hoverBg})`,
    },
    [`& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell[data-field="${ACTIONS_FIELD}"]`]: {
      backgroundImage: `linear-gradient(${selectedBg}, ${selectedBg})`,
    },
  };
};
