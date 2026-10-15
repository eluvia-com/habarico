import type {GridDensity} from '@mui/x-data-grid';
import {DENSITY_TABLE_PADDING_Y} from '../../constants';

// `DataTable`'s header cell is a 24px line (MUI `TableCell` head `line-height: pxToRem(24)`) plus the
// density vertical padding. Size the grid header to the same box so the two match per density; MUI X
// then multiplies this by its density factor (`DENSITY_FACTOR`), which we pre-divide back out.
const HEADER_LINE_HEIGHT_PX = 24;
const SPACING_UNIT_PX = 8;

/** Target grid header row height (px) that matches `DataTable`'s header at a given density. */
export const densityHeaderHeight = (density: GridDensity): number =>
  HEADER_LINE_HEIGHT_PX + 2 * SPACING_UNIT_PX * DENSITY_TABLE_PADDING_Y[density];

// MUI X derives the header row height as `floor(columnHeaderHeight * densityFactor)` (see
// COMPACT/COMFORTABLE_DENSITY_FACTOR in @mui/x-data-grid). To land the header on the DataTable-matched
// target height, `DataGrid.tsx` pre-divides the target by this factor so the grid's own multiplication
// cancels it out.
export const DENSITY_FACTOR: Record<GridDensity, number> = {
  compact: 0.7,
  standard: 1,
  comfortable: 1.3,
};
