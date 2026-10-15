import React from 'react';
import {DENSITY_TABLE_PADDING_Y} from '@design/constants';
import type {Density} from '@design/layouts/contexts/SettingsContext';
import {GlobalStyles, useTheme} from '@mui/material';

// Vertical cell padding (px) per density, shared with design/organisms/DataTable via
// DENSITY_TABLE_PADDING_Y (spacing units × 8): compact 4, standard 8, comfortable 20. Combined with
// the 24px line box pinned by datagridSx, a single-line row/header lands on the density target
// height — compact 24 + 2×4 = 32, standard 24 + 2×8 = 40, comfortable 24 + 2×20 = 64 — matching the
// design tables (design/organisms/DataGrid density.ts uses the same formula). Multi-line content
// grows the row from there.
const cellPaddingY = (density: Density) =>
  `calc(${8 * DENSITY_TABLE_PADDING_Y[density]}px - 1px) !important`;

// The helper columns (right-pinned row actions, drag handle, selection checkbox) keep their own
// zero vertical padding (set in datagridSx / MUI's `padding="checkbox"`) so their taller controls
// don't drive the row height — the density padding must not re-add a `py` to them, or an action
// button / checkbox cell would grow the row past its density target. Excluded from the rules below.
const HELPER_CELLS =
  ':not(.column-__row_action_buttons__):not(.column-__drag_and_drop__):not(.MuiTableCell-paddingCheckbox)';

// The datagrid header (th) + body (td) content cells, scoped to a body density class.
const datagridCells = (bodyScope: string) =>
  `${bodyScope} .RaDatagrid-root td.MuiTableCell-root${HELPER_CELLS}, ${bodyScope} .RaDatagrid-root th.MuiTableCell-root${HELPER_CELLS}`;

// Striped even rows, minus the interactive states. Excluding `:hover` / `.Mui-selected` lets the
// hover/selected highlight (rowHighlightSx) REPLACE the stripe instead of the `!important` stripe
// winning over (or stacking on) it — on interaction the stripe rule simply stops matching.
const STRIPED_EVEN_ROW =
  'body.hab-striped .RaDatagrid-root tbody tr:nth-of-type(even):not(:hover):not(.Mui-selected)';

/**
 * Global CSS for the density and striped-rows settings, scoped by the body classes
 * set imperatively in `useAdminSettings`. Targets the react-admin datagrid, so it
 * lives in the admin layer (not the presentational design layer). Applying the settings
 * via body classes means toggling them needs zero React re-renders on the table.
 */
export const AdminSettingsStyles = () => {
  const {palette} = useTheme();
  return (
    <GlobalStyles
      styles={{
        // Density = padding overrides on top of the STANDARD baseline, which lives in datagridSx —
        // so the datagrid reads as standard density (and keeps its 24px line box) even when this
        // component isn't mounted. Only compact/comfortable differ from standard, so only they get a
        // rule here; standard falls through to the baseline. These rules don't need their own
        // device check: `useAdminSettings` only ever sets the `density-standard` /
        // `density-comfortable` body class on a device that supports that density, so the class
        // itself already reflects the device-appropriate value.
        // compact — the body carries no density class (useAdminSettings only classes non-compact)
        [datagridCells('body:not(.density-standard):not(.density-comfortable)')]: {
          paddingTop: cellPaddingY('compact'),
          paddingBottom: cellPaddingY('compact'),
        },
        [datagridCells('body.density-comfortable')]: {
          paddingTop: cellPaddingY('comfortable'),
          paddingBottom: cellPaddingY('comfortable'),
        },
        // Regular data cells: semi-transparent stripe is fine (they sit on a static paper surface).
        [`${STRIPED_EVEN_ROW} td.RaDatagrid-rowCell:not(.column-__row_action_buttons__):not(.column-__drag_and_drop__):not(.MuiTableCell-paddingCheckbox)`]:
          {
            backgroundColor: `${palette.stripeRow} !important`,
          },
        // The sticky / opaque columns — row actions, drag handle and the selection checkbox — can't
        // take a semi-transparent `backgroundColor` (the sticky actions column would let horizontally-
        // scrolled content bleed through, and these cells keep an opaque paper base). So overlay the
        // SAME `stripeRow` tint as a gradient layer on top of that paper base: paper + stripeRow reads
        // identically to the regular cells' stripeRow-over-paper, from a single source of truth — so it
        // tracks `palette.stripeRow` (incl. dark mode) instead of a separate, drifting solid color.
        // Mirrors the design grid's `stripedActionsSx`.
        [`${STRIPED_EVEN_ROW} td.RaDatagrid-rowCell.column-__row_action_buttons__, ${STRIPED_EVEN_ROW} td.RaDatagrid-rowCell.column-__drag_and_drop__, ${STRIPED_EVEN_ROW} td.MuiTableCell-paddingCheckbox`]:
          {
            backgroundImage: `linear-gradient(${palette.stripeRow}, ${palette.stripeRow}) !important`,
          },
      }}
    />
  );
};
