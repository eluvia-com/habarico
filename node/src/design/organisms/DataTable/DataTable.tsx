import React from 'react';
import {varAlpha} from '@design/theme/utils';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import {DENSITY_TABLE_PADDING_Y} from '../../constants';
import type {Density} from '../../layouts/contexts/SettingsContext/types';
import {
  ACTIONS_DEFAULT_WIDTH,
  pinnedColumnShadowSx,
  rowActionsGroupSx,
} from '../../utils/tableActions';

/** Class on the wrapper around a row's action buttons — drives the idle/hover opacity. */
const ROW_ACTIONS_CLASS = 'dt-row-actions';

/** Class on the sticky, right-pinned actions cells (both header and body). */
const ACTIONS_CELL_CLASS = 'dt-actions-cell';

// Horizontal cell padding (px), matching `DataGrid` (MUI's default `TableCell` padding is 16px). Set
// on every cell (header + body) via the container so it also covers the actions and empty-message
// cells. The actions-shadow overlay uses its negative to stretch back over that padding (below).
const CELL_PADDING_X = 10;
const cellPaddingXSx: SxProps<Theme> = {
  '& .MuiTableCell-root': {px: `${CELL_PADDING_X}px`},
};

// A hover state on the body rows (header excluded), matching `FormTable`: a soft primary tint plus a
// 4px primary accent stripe on the left. The stripe is an inset shadow on the first cell (box-shadow
// isn't reliably rendered on a `tr`), so it adds no layout shift.
const rowHoverSx: SxProps<Theme> = (theme) => {
  // The tint/stripe are stronger in dark mode so they read on the darker surface.
  const isDark = theme.palette.mode === 'dark';
  const bg = isDark ? 0.2 : 0.08;
  const stripe = isDark ? 0.4 : 0.3;
  return {
    '& .MuiTableBody-root .MuiTableRow-root:hover': {
      backgroundColor: varAlpha(theme.palette.primary.mainChannel, bg),
    },
    '& .MuiTableBody-root .MuiTableRow-root:hover > .MuiTableCell-root:first-of-type': {
      boxShadow: `inset 4px 0 0 0 ${varAlpha(theme.palette.primary.mainChannel, stripe)}`,
    },
  };
};

// Zebra striping — a subtle `action.hover` tint on every other body row (the 2nd, 4th, …). Emitted
// before `rowHoverSx` so the equal-specificity hover rule still wins: a striped row shows the primary
// hover tint on interaction.
const stripedRowsSx: SxProps<Theme> = (theme) => ({
  '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
});

// Row actions idle at 30%, going full opacity while the row is hovered — shared look with `DataGrid`.
const rowActionsSx: SxProps<Theme> = (theme) =>
  rowActionsGroupSx(ROW_ACTIONS_CLASS, ['.MuiTableRow-root:hover'], theme);

// The sticky, right-pinned actions column: it stays put while the table scrolls sideways, so the
// data cells slide *under* it (mirrors `DataGrid`). The pinned cell needs an OPAQUE background — the
// row's hover/striped tints are semi-transparent and would let the scrolled content bleed through —
// so it paints a paper base (the header band `background.default` on the head cell) and the row
// tints are re-applied as opaque gradient overlays (`pinnedActionsHoverSx` / `pinnedActionsStripedSx`).
// The separating shadow is *not* here: `clip-path` is ignored on a `<td>`, so it goes on the inner
// overlay below. The head cell also bumps to `zIndex: 3` so, when scrolling in both axes at once, the
// top-right corner stays above both the sticky header row (z2, from `stickyHeader`) and this sticky
// column (z2).
const pinnedActionsSx: SxProps<Theme> = (theme) => ({
  [`& .${ACTIONS_CELL_CLASS}`]: {
    position: 'sticky',
    right: 0,
    zIndex: 2,
    backgroundColor: theme.palette.background.paper,
  },
  [`& .MuiTableHead-root .${ACTIONS_CELL_CLASS}`]: {
    backgroundColor: theme.palette.background.default,
    zIndex: 3,
  },
});

// The pinned column's left shadow, mounted on an absolutely-positioned block overlay filling the
// actions cell's *border* box (the negative insets cancel the cell's horizontal padding). It lives on
// this `<div>` rather than the `<td>` because `clip-path` (in `pinnedColumnShadowSx`) is ignored on a
// `display: table-cell`. `aria-hidden` + `pointerEvents: none` keep it purely decorative.
const actionsShadowSx: SxProps<Theme> = (theme) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  pointerEvents: 'none',
  ...pinnedColumnShadowSx(theme),
});

const ActionsShadow = () => <Box aria-hidden sx={actionsShadowSx} />;

// Hover tint overlaid onto the opaque pinned actions cell (as a gradient so it stays opaque),
// matching `rowHoverSx`'s primary tint. Emitted after the striped overlay so hover wins on interaction.
const pinnedActionsHoverSx: SxProps<Theme> = (theme) => {
  const bg = varAlpha(
    theme.palette.primary.mainChannel,
    theme.palette.mode === 'dark' ? 0.2 : 0.08
  );
  return {
    [`& .MuiTableBody-root .MuiTableRow-root:hover .${ACTIONS_CELL_CLASS}`]: {
      backgroundImage: `linear-gradient(${bg}, ${bg})`,
    },
  };
};

// Striped tint overlaid onto the opaque pinned actions cell on alternate rows, matching `stripedRowsSx`.
const pinnedActionsStripedSx: SxProps<Theme> = (theme) => ({
  [`& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even) .${ACTIONS_CELL_CLASS}`]: {
    backgroundImage: `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`,
  },
});

export type DataTableAlign = 'left' | 'right' | 'center';

export type DataTableDensity = Density;

export type DataTableColumn<T> = {
  /** Stable column id; also the default value accessor (`row[key]`) when no `render` is given. */
  key: string;
  /** Header cell content. When every column omits it, the header row is dropped. */
  header?: React.ReactNode;
  /** Cell alignment (header + body). Defaults to `left`. */
  align?: DataTableAlign;
  /** Fixed column width. Number → px, string → any CSS length. */
  width?: number | string;
  /**
   * Let this column's cells wrap long content onto multiple lines. Default: no wrap — content stays
   * on a single line and overflow is reached via the table's horizontal scroll, matching `DataGrid`.
   */
  wrap?: boolean;
  /** Custom cell renderer. Defaults to the raw `row[key]` value. */
  render?: (row: T, rowIndex: number) => React.ReactNode;
};

export type DataTableProps<T> = {
  /** Column definitions, in display order. */
  columns: DataTableColumn<T>[];
  /** Row data. */
  rows: readonly T[];
  /** Row key — defaults to the row index. */
  getRowKey?: (row: T, index: number) => React.Key;
  /**
   * Row density — scales the header and body cells' vertical padding, exactly like `DataGrid`.
   * `standard` (default) matches MUI's default cell padding; `compact` tightens it for dense panel
   * tables.
   */
  density?: DataTableDensity;
  /**
   * Zebra-stripes the body rows with a subtle `action.hover` tint on every other row. Composes with
   * the hover tint (a striped row still shows the primary tint on hover). Never applied to the header.
   */
  stripedRows?: boolean;
  /** Centered, muted message shown (as a full-width row) when there are no rows. */
  emptyMessage?: React.ReactNode;
  /**
   * Renders each row's actions into a trailing, right-aligned actions column. The buttons sit at
   * 30% opacity and go full opacity while the row is hovered. Omit for no actions column.
   */
  rowActions?: (row: T, rowIndex: number) => React.ReactNode;
  /** Width of the actions column. Number → px, string → any CSS length. Defaults to `96`. */
  actionsWidth?: number | string;
  /** Extra styles merged onto the `TableContainer`. */
  sx?: SxProps<Theme>;
};

const cellValue = <T,>(column: DataTableColumn<T>, row: T, index: number): React.ReactNode =>
  column.render ? column.render(row, index) : (row as Record<string, React.ReactNode>)[column.key];

/**
 * A simple, read-only table for **nested objects that are edited in bulk together with their
 * parent** — e.g. a property's parcels or building numbers. Deliberately plain: no pagination,
 * filtering, sorting or column resizing/hiding — just a header and rows built from MUI `Table` /
 * `TableRow` / `TableCell` (so it inherits the shared table theme: a `background.default` header
 * band and divider row borders), with a hover tint on the body rows and an optional trailing per-row actions
 * column (`rowActions`) — both matching `DataGrid`. Like `DataGrid`, cells do **not** wrap by
 * default (long content stays on one line and is reached via the container's horizontal scroll; opt
 * a column back into wrapping with `column.wrap`), and the actions column is **pinned** to the right
 * edge so the data cells scroll under it. For full relations with their own paging, filters and
 * editing use `DataGrid` instead; for bulk-editing these rows use `FormTable` (the editable
 * counterpart). Purely presentational and Panel-agnostic — drop it inside a `Panel` (`PanelContent`,
 * usually `paddingSize="none"`) or anywhere.
 */
export const DataTable = <T,>({
  columns,
  rows,
  getRowKey,
  density = 'standard',
  stripedRows = false,
  emptyMessage,
  rowActions,
  actionsWidth = ACTIONS_DEFAULT_WIDTH,
  sx,
}: DataTableProps<T>) => {
  const hasHeader = columns.some((column) => column.header != null);
  // The empty-message / actions cells must span the data columns plus the actions column.
  const colSpan = columns.length + (rowActions ? 1 : 0);
  // Density drives the header and body cells' vertical padding; the actions cell stays unpadded (its
  // taller icon buttons would otherwise inflate the row height) and just centers within that height.
  const cellPaddingY = DENSITY_TABLE_PADDING_Y[density];

  // The striping / hover tint only apply to data rows, not the standalone empty-message row. Striping
  // is emitted before the hover so the hover tint wins on interaction — the same order is mirrored
  // onto the pinned actions cell's opaque overlays (`pinnedActionsStripedSx` before `…HoverSx`).
  const hasDataRows = rows.length > 0;
  const mergedSx: SxProps<Theme> = [
    // Own the vertical scroll: bound the container to its parent's height so the sticky header
    // (`<Table stickyHeader>`) sticks relative to a container that actually scrolls. `maxHeight: 100%`
    // is inert in unconstrained contexts (percentage max-height against an auto-height parent resolves
    // to no constraint), so the table keeps its natural height and only scrolls internally when a
    // parent bounds it (e.g. a fixed-height dashboard `Panel`). `overflow: auto` adds the vertical
    // axis to MUI's default `overflow-x: auto` (which already drives the pinned-column horizontal scroll).
    {maxHeight: '100%', overflow: 'auto'},
    cellPaddingXSx,
    ...(stripedRows && hasDataRows ? [stripedRowsSx] : []),
    ...(hasDataRows ? [rowHoverSx] : []),
    ...(rowActions ? [rowActionsSx, pinnedActionsSx] : []),
    ...(rowActions && stripedRows && hasDataRows ? [pinnedActionsStripedSx] : []),
    ...(rowActions && hasDataRows ? [pinnedActionsHoverSx] : []),
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  return (
    <TableContainer sx={mergedSx}>
      {/* stickyHeader pins the head cells (position: sticky; top: 0) while the body scrolls; it also
          flips the table to border-collapse: separate, which is what makes sticky <th> actually work. */}
      <Table stickyHeader>
        {hasHeader && (
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  sx={{
                    width: column.width,
                    py: cellPaddingY,
                    whiteSpace: column.wrap ? 'normal' : 'nowrap',
                  }}
                >
                  {column.header}
                </TableCell>
              ))}
              {rowActions && (
                <TableCell
                  className={ACTIONS_CELL_CLASS}
                  align={'right'}
                  sx={{width: actionsWidth, py: 0}}
                >
                  <ActionsShadow />
                </TableCell>
              )}
            </TableRow>
          </TableHead>
        )}
        <TableBody sx={{backgroundColor: 'background.paper'}}>
          {rows.length === 0 && emptyMessage ? (
            <TableRow>
              <TableCell colSpan={colSpan} sx={{borderBottom: 'none'}}>
                <Typography
                  variant={'body2'}
                  sx={{color: 'text.secondary', textAlign: 'center', py: 1}}
                >
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={getRowKey ? getRowKey(row, index) : index}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    sx={{py: cellPaddingY, whiteSpace: column.wrap ? 'normal' : 'nowrap'}}
                  >
                    {cellValue(column, row, index)}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell
                    className={ACTIONS_CELL_CLASS}
                    align={'right'}
                    sx={{width: actionsWidth, py: 0}}
                  >
                    <Box className={ROW_ACTIONS_CLASS}>{rowActions(row, index)}</Box>
                    <ActionsShadow />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
