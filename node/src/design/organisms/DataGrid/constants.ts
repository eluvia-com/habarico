// Field names and CSS class names shared across the DataGrid's component, toolbar and its `sx`
// feature modules — the small structural vocabulary that everything else keys off.

/** Field name of the synthetic, right-pinned column that hosts each row's actions. */
export const ACTIONS_FIELD = '__actions__';

/**
 * Field name of the synthetic flexible spacer column. Injected right before the actions column when
 * the consumer's own columns have no `flex` — it soaks up the leftover width so the actions column
 * ends flush against the grid's right edge (instead of trailing the last data column) and MUI X
 * renders no empty filler beside it.
 */
export const SPACER_FIELD = '__spacer__';

/** Class on the wrapper around a row's action buttons — drives the idle/hover opacity. */
export const ROW_ACTIONS_CLASS = 'dg-row-actions';
