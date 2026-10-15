// CSS class names of the synthetic helper columns (their `source` prop becomes a `column-<source>`
// class on the header/body cells). Shared by the `datagridSx` feature modules so the selectors have
// one source of truth — mirrors the field-name constants in design/organisms/DataGrid's `constants`.
/** Right-pinned column hosting each row's action buttons. */
export const ACTIONS_COLUMN_CLASS = 'column-__row_action_buttons__';
/** Flexible spacer column that pushes the actions column flush to the right edge. */
export const SPACER_COLUMN_CLASS = 'column-__spacer__';
/** Leading drag-handle column (drag-and-drop row reordering). */
export const DND_COLUMN_CLASS = 'column-__drag_and_drop__';

/**
 * Idle opacity of a row's action buttons — they go full opacity once the row is active (hovered or
 * selected). Mirrors the design grid's `ROW_ACTIONS_IDLE_OPACITY`. The opacity is applied to the
 * actions cell's content (its only child) rather than a dedicated wrapper class — see `actions`.
 */
export const ROW_ACTIONS_IDLE_OPACITY = 0.3;
