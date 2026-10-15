import type {Density} from './layouts/contexts/SettingsContext/types';

// Density coefficients shared across the design layer, all in theme spacing units (8px each).

/**
 * The gap between neighbouring items of a layout per density: between the rows of a `PropertyList`
 * and between the cells of a `PanelGrid`. Shared so a grid splitting one form into columns spaces
 * its cells exactly like the fields inside them.
 */
export const DENSITY_GRID_GAP: Record<Density, number> = {
  compact: 1,
  standard: 1.5,
  comfortable: 2.4,
};

/**
 * The gap between stacked row cards per density — the rows of a `FormTable` and the file rows of
 * an `UploadArea`, which read alike.
 */
export const DENSITY_ROW_CARD_GAP: Record<Density, number> = {
  compact: 0.5,
  standard: 1,
  comfortable: 1.5,
};

/** The padding inside one of those row cards per density. */
export const DENSITY_ROW_CARD_PADDING: Record<Density, number> = {
  compact: 1.5,
  standard: 2,
  comfortable: 2.5,
};

/**
 * Body-cell vertical padding per density. Shared by `DataTable`, `DataGrid` and the admin datagrid
 * so a table and a grid read identically at each density — with auto row height the row grows from
 * this padding plus its line count. Single source of truth for that invariant.
 */
export const DENSITY_TABLE_PADDING_Y: Record<Density, number> = {
  compact: 0.5,
  standard: 1,
  comfortable: 2.5,
};
