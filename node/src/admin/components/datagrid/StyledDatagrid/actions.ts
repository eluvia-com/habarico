import {CSSObject, Theme} from '@mui/material';
import {ACTIONS_COLUMN_CLASS, ROW_ACTIONS_IDLE_OPACITY} from './constants';

const ACTIONS_HEADER_CELL = `th.RaDatagrid-headerCell.${ACTIONS_COLUMN_CLASS}`;
const ACTIONS_BODY_CELL = `td.RaDatagrid-rowCell.${ACTIONS_COLUMN_CLASS}`;

// A left-clipped shadow that separates the sticky, right-pinned actions cell from the content
// scrolling under it. `clip-path` is ignored on a `display: table-cell`, so it's drawn on a `:before`
// overlay filling the cell rather than the cell itself (the design grid's cells are `div`s, so it can
// use `pinnedColumnShadowSx` directly on the cell).
const pinnedShadowBefore = (theme: Theme): CSSObject => ({
  position: 'absolute' as const,
  content: '""',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  // Mode-aware pinned-column shadow — the same token the design grid uses via `pinnedColumnShadowSx`
  // (`customShadows.pinnedColumn`): a light-grey shadow in light mode and a near-black grey-900 one in
  // dark, so the dark variant reads as the darkest possible shadow instead of a grey lighter than the
  // row background.
  boxShadow: theme.customShadows.pinnedColumn,
  clipPath: 'inset(0 0 0 -10px)',
});

/**
 * The right-pinned **actions column**: the header and body actions cells stay put on horizontal
 * scroll (CSS sticky) and cast a left-clipped shadow over the cells sliding under them, and each
 * row's action buttons sit at 30% opacity until the row is active (hovered/selected). Mirrors
 * design/organisms/DataGrid's `tableActions` (`rowActionsGroupSx` / `ROW_ACTIONS_IDLE_OPACITY`) plus
 * the assembler's pinned-column rules. The actions cell's opaque paper surface and the highlight's
 * gradient overlay live elsewhere (`datagridSx` base rule / `highlight`).
 */
export const actionsColumnSx = (theme: Theme): CSSObject => ({
  // Header actions cell — sticky on the right with the pinned-column shadow.
  [`& ${ACTIONS_HEADER_CELL}`]: {
    padding: 0,
    // Inset the content by the scrollbar width so the sticky action buttons aren't covered by the
    // vertical scrollbar; the cell background/shadow still reach the edge, so no empty gap appears.
    paddingRight: '11px',
    position: 'sticky',
    right: '0',
    width: 0,
    '&:before': pinnedShadowBefore(theme),
  },
  // Body actions cell — same sticky + shadow; content is allowed to overflow (button tooltips etc.).
  [`& ${ACTIONS_BODY_CELL}`]: {
    padding: 0,
    paddingRight: '11px',
    position: 'sticky',
    right: '0',
    width: 0,
    '&:before': pinnedShadowBefore(theme),
    overflow: 'visible',
    textOverflow: 'visible',
    whiteSpace: 'normal',
  },

  // Row actions idle at 30% opacity, full opacity once the row is hovered or selected. Applied to the
  // actions cell's content — its only child (RA's `WrapperField` is a Fragment, so the button-wrapper
  // Box is the cell's direct child) — NOT the `<td>`, so its sticky shadow and paper surface stay
  // fully opaque. Revealed on every row (including tinted ones), so it's not gated by `NOT_TINTED`.
  [`& ${ACTIONS_BODY_CELL} > *`]: {opacity: ROW_ACTIONS_IDLE_OPACITY},
  [`& tr:hover ${ACTIONS_BODY_CELL} > *, & tr.Mui-selected ${ACTIONS_BODY_CELL} > *`]: {opacity: 1},
});
