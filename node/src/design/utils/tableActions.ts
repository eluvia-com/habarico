import type {CSSObject, Theme} from '@mui/material';

/**
 * Shared look of a per-row **actions column**, used by both `DataTable` (a plain MUI `Table`) and
 * `DataGrid` (MUI X). One source of truth for the numbers and the button-group / pinned-shadow rules
 * so the two components never drift; the component-specific sticky selectors stay in each component.
 */

/** Default width (px) of a per-row actions column. */
export const ACTIONS_DEFAULT_WIDTH = 96;

/** Idle opacity of a row's action buttons — full opacity once the row is active (hovered/selected). */
export const ROW_ACTIONS_IDLE_OPACITY = 0.3;

/**
 * The button group inside an actions cell: right-aligned, small gap, dimmed until the row is
 * "active". Parametrised by the wrapper class and the active-row selectors so a plain table and a
 * MUI X grid share one rule — pass the row-level selector(s) that should reveal the buttons, e.g.
 * `['.MuiTableRow-root:hover']` or `['.MuiDataGrid-row:hover', '.MuiDataGrid-row.Mui-selected']`.
 */
export const rowActionsGroupSx = (
  actionsClass: string,
  activeRowSelectors: string[],
  theme: Theme
): CSSObject => ({
  [`& .${actionsClass}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing(0.5),
    opacity: ROW_ACTIONS_IDLE_OPACITY,
  },
  [activeRowSelectors.map((selector) => `& ${selector} .${actionsClass}`).join(', ')]: {
    opacity: 1,
  },
});

/**
 * Left-clipped shadow that separates a right-pinned (CSS-sticky) column from the content scrolling
 * under it. The shadow itself is the theme's `customShadows.pinnedColumn` token (mode-correct grey
 * base — light 300 / dark 900); here it's clipped to the left edge (`inset(0 0 0 -10px)`) → a clean,
 * uniform, full-height shadow. **Must be applied to a block element** (`div`): `clip-path` is ignored
 * on a `display: table-cell` (`<td>`), so `DataTable` mounts it on an inner overlay div rather than
 * the cell itself (`DataGrid`'s cells are already `div`s).
 */
export const pinnedColumnShadowSx = (theme: Theme): CSSObject => ({
  boxShadow: theme.customShadows.pinnedColumn,
  clipPath: 'inset(0 0 0 -10px)',
});
