// `ReferenceVariant` — how a reference renders the record it points at — lives in `@schema/types`
// beside the rest of the `fieldDefaults` surface, since the application sets it there as well as
// per field. This module keeps only the width arithmetic the two reference fields share.

// `--field-<source>` is the datagrid column's width, set on the `<td>` itself (see `AdminDatagrid`'s
// `columnSx`), so the space actually available inside the cell is narrower by its own horizontal
// padding — MUI's `TableCell` default, 16px a side. Capping the representation at that width is
// what lets its ellipsis kick in instead of the cell hard-clipping it mid-word.
const CELL_PADDING_X = 32;

// A chip in a `SingleFieldList` row needs more than the cell padding: the row's gap and the chip's
// own inset both eat into the line before the label does. Empirically tuned, and kept exactly as it
// was — the `link` variant does not use it, it stacks one per line and has neither.
const CHIP_ROW_INSET = 46;

export const REFERENCE_WIDTH_OFFSET = {
  /** A single representation in a cell — one chip, or a `link` in either container. */
  cell: CELL_PADDING_X,
  /** A chip in a wrapping `SingleFieldList` row. */
  chipRow: CHIP_ROW_INSET,
} as const;

/**
 * The width to cap a reference's representation at inside a datagrid cell, as a `calc()` over the
 * column-width variable. `500px` is the fallback for a column whose width has not been measured
 * yet; `source` is dotted for a nested field, which a CSS custom property name cannot carry.
 */
export const referenceMaxWidth = (source: string, offset: number) =>
  `calc(var(--field-${source.replace(/\./g, '__')}, 500px) - ${offset}px)`;
