import {varAlpha} from '@design/theme';
import {CSSObject, Theme} from '@mui/material';
import {ACTIONS_COLUMN_CLASS} from './constants';
import {NOT_TINTED} from './tinting';

// Body cells the highlight targets: every data cell (tinted with a semi-transparent primary layer)
// vs. the sticky, opaque actions cell (which instead takes the tint as a gradient overlay so it
// stays opaque — mirroring `actionsHighlightSx` in the design grid).
const DATA_CELL = `td.MuiTableCell-body:not(.${ACTIONS_COLUMN_CLASS})`;
const FIRST_CELL = 'td.MuiTableCell-body:first-of-type';
const ACTIONS_CELL = `td.RaDatagrid-rowCell.${ACTIONS_COLUMN_CLASS}`;

/**
 * Row hover / selected highlight — ported from design/organisms/DataGrid (`highlight.ts`): a primary
 * tint on the data cells plus a 4px primary accent stripe down the row's left edge (inset shadow → no
 * layout shift). The tint is a semi-transparent layer over the row's paper surface; the opaque, sticky
 * actions cell instead takes the tint as a gradient overlay so it stays opaque. The selected step is
 * stronger than hover, both stronger in dark mode. Suppressed on semantically-tinted rows (`color-*`,
 * see `./tinting`) so the highlight never fights the row colors.
 */
export const rowHighlightSx = (theme: Theme): CSSObject => {
  // Values copied verbatim from the design grid's `highlight.ts`.
  const isDark = theme.palette.mode === 'dark';
  const c = theme.palette.primary.mainChannel;
  const hoverBg = varAlpha(c, isDark ? 0.2 : 0.08);
  const hoverStripe = varAlpha(c, isDark ? 0.4 : 0.3);
  const selectedBg = varAlpha(c, isDark ? 0.3 : 0.15);
  const selectedStripe = varAlpha(c, isDark ? 0.5 : 0.4);
  // The opaque actions cell takes its own (slightly different) alphas as a gradient overlay.
  const hoverActionsBg = varAlpha(c, isDark ? 0.2 : 0.08);
  const selectedActionsBg = varAlpha(c, isDark ? 0.25 : 0.12);

  return {
    // MUI's `TableRow` paints its own grey `action.hover` / `action.selected` onto the `<tr>`. Our
    // hover/selected tint lives on the (semi-transparent) cells above it, so that grey would show
    // through and muddy the primary tint (making it read darker than the design grid). Pin the row
    // surface back to paper so the tint composites over paper only — the table equivalent of the
    // design grid's `rowHighlightResetSx`. The doubled-class selectors out-specify MUI's own rules.
    '& tr.MuiTableRow-hover:hover, & tr.Mui-selected, & tr.Mui-selected:hover': {
      backgroundColor: theme.palette.background.paper,
    },

    // Hover — data cells get the tint; the leftmost cell also carries the accent stripe.
    [`tr${NOT_TINTED}:hover ${DATA_CELL}`]: {backgroundColor: hoverBg},
    [`tr${NOT_TINTED}:hover ${FIRST_CELL}`]: {
      boxShadow: `inset 4px 0 0 0 ${hoverStripe}`,
    },
    [`tr${NOT_TINTED}:hover ${ACTIONS_CELL}`]: {
      backgroundImage: `linear-gradient(${hoverActionsBg}, ${hoverActionsBg})`,
    },

    // Selected (and selected-while-hovered) — the stronger step. The row-level `Mui-selected` class
    // is added by our `DatagridRow` (React Admin doesn't forward `selected` to the `<tr>`).
    [`tr${NOT_TINTED}.Mui-selected ${DATA_CELL}, tr${NOT_TINTED}.Mui-selected:hover ${DATA_CELL}`]:
      {
        backgroundColor: selectedBg,
      },
    [`tr${NOT_TINTED}.Mui-selected ${FIRST_CELL}, tr${NOT_TINTED}.Mui-selected:hover ${FIRST_CELL}`]:
      {
        boxShadow: `inset 4px 0 0 0 ${selectedStripe}`,
      },
    [`tr${NOT_TINTED}.Mui-selected ${ACTIONS_CELL}, tr${NOT_TINTED}.Mui-selected:hover ${ACTIONS_CELL}`]:
      {
        backgroundImage: `linear-gradient(${selectedActionsBg}, ${selectedActionsBg})`,
      },
  };
};
