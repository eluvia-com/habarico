// Semantic per-row tinting vocabulary. The tint itself is painted by the theme's `MuiTableRow`
// (src/design/theme/core/components/TableRow.tsx): a row carrying a `color-*` class in `meta.tags`
// (added by `DatagridRow`) gets a soft 8% tint on its data cells. This module only names those
// classes and builds the opt-out selector the hover/selected highlight uses to leave tinted rows
// alone (so the primary highlight never fights the row colors) — the table equivalent of
// `isRowTinted` in design/organisms/DataGrid's `tinting`.

/** The semantic per-row tint classes (see theme `MuiTableRow`). */
export const TINT_ROW_CLASSES = [
  'color-primary',
  'color-secondary',
  'color-info',
  'color-success',
  'color-warning',
  'color-error',
];

/** A `:not(.color-*)` chain that excludes semantically-tinted rows from a `tr` selector. */
export const NOT_TINTED = TINT_ROW_CLASSES.map((cls) => `:not(.${cls})`).join('');
