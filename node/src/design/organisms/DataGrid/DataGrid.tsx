import React, {useMemo} from 'react';
import {Box} from '@mui/material';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  type GridColDef,
  type GridValidRowModel,
  DataGrid as MuiDataGrid,
  type DataGridProps as MuiDataGridProps,
  useGridApiRef,
} from '@mui/x-data-grid';
import {Icon, IconType} from '../../atoms/Icon';
import {ACTIONS_DEFAULT_WIDTH} from '../../utils/tableActions';
import {useOptionalDataGridApi} from './DataGridContext';
import {ACTIONS_FIELD, ROW_ACTIONS_CLASS, SPACER_FIELD} from './constants';
import {dataGridSx} from './dataGridSx';
import {DENSITY_FACTOR, densityHeaderHeight} from './density';
import {STRIPED_ROW_CLASS} from './striping';
import {isRowTinted} from './tinting';
import {useActionsColumnWidth} from './useActionsColumnWidth';

// Flex weight of the synthetic spacer column. Tiny on purpose so any real (flex 1) consumer column
// out-weighs it to ~0, while it still claims 100% of the leftover width when it is the only flexing
// column (flex ratios are relative, so the absolute value doesn't matter — only that it's ≪ 1).
const SPACER_FLEX = 0.0001;

// Synthetic helper columns (row actions, flexible spacer, selection checkbox) are internal plumbing —
// keep them out of the column-selection panel, where they'd otherwise show up as disabled, meaningless
// rows.
const HELPER_FIELDS: string[] = [ACTIONS_FIELD, SPACER_FIELD, GRID_CHECKBOX_SELECTION_FIELD];

// Sort icons via the design `Icon` wrapper. The grid styles them through the forwarded
// className; `size` sizes the (otherwise tiny) caret. Typed to `{className?}` only — the
// grid's icon-slot `color` prop is a plain string, incompatible with `Icon`, so we don't spread it.
const SortAscendingIcon = ({className}: {className?: string}) => (
  <Icon icon={IconType.ArrowDropUp} className={className} size={32} />
);
const SortDescendingIcon = ({className}: {className?: string}) => (
  <Icon icon={IconType.ArrowDropDown} className={className} size={32} />
);

export type DataGridProps<R extends GridValidRowModel = GridValidRowModel> = MuiDataGridProps<R> & {
  /**
   * Renders each row's actions into the right-pinned actions column. The buttons sit at 30%
   * opacity and go full opacity while the row is hovered or selected. Omit for no actions column.
   */
  rowActions?: (row: R) => React.ReactNode;
  /**
   * Fixed width of the actions column in px. Omit to size it to the widest rendered action set
   * (measured from the DOM) so the column fits its buttons without a hardcoded width.
   */
  actionsWidth?: number;
  /** Message shown (centered, on a `background.paper` surface) when there are no rows. */
  emptyMessage?: React.ReactNode;
  /**
   * Disables the hover/selected row highlight (the primary tint + left accent stripe). Use for
   * grids that rely on per-row semantic tinting (`getRowClassName` → `color-*`), where the
   * highlight would clash with the row colors.
   */
  disableRowHighlight?: boolean;
  /**
   * Zebra-stripes the rows with a subtle `action.hover` tint on every other row. Composes with the
   * hover/selected highlight (a striped row still shows the tint on interaction) and skips
   * semantic-tinted rows (`getRowClassName` → `color-*`), so it never fights the row colors.
   */
  stripedRows?: boolean;
};

/**
 * A thin, presentational restyle of MUI X DataGrid (Community) for the redesign: a neutral
 * header band with column dividers, hover/selected row tints, per-row semantic tinting (via
 * `getRowClassName` returning a `color-*` class) and an optional right-pinned actions column.
 * Pure pass-through — every MUI X prop works; it only adds `rowActions`, a configurable
 * `emptyMessage`, a default style and sensible defaults (single-click selection, no column
 * menu/filter, pagination, auto height).
 *
 * Backend filters are out of scope here. Wrap it in a `DataGridProvider` to drive it from a
 * separately-composed `DataGridToolbar`; used alone it owns its own grid API. Panel-agnostic —
 * drop it in a `Panel` (`PanelContent paddingSize="none"`) or use it as a standalone view.
 */
export const DataGrid = <R extends GridValidRowModel = GridValidRowModel>({
  rowActions,
  actionsWidth,
  emptyMessage = 'No rows',
  disableRowHighlight = false,
  stripedRows = false,
  apiRef: apiRefProp,
  columns,
  rows,
  slots,
  slotProps,
  sx,
  density = 'standard',
  columnHeaderHeight: columnHeaderHeightProp,
  getRowClassName: consumerGetRowClassName,
  ...rest
}: DataGridProps<R>) => {
  const contextApiRef = useOptionalDataGridApi();
  const localApiRef = useGridApiRef();
  const apiRef = apiRefProp ?? contextApiRef ?? localApiRef;

  // Size the header to match DataTable at this density. `+ 0.5` before the multiply guards against
  // float rounding so `floor(columnHeaderHeight * densityFactor)` lands exactly on the target height.
  const columnHeaderHeight =
    columnHeaderHeightProp ?? (densityHeaderHeight(density) + 0.5) / DENSITY_FACTOR[density];

  // Measure the actions column to its content when no fixed `actionsWidth` is given.
  const autosizeActions = rowActions != null && actionsWidth == null;

  const NoRowsOverlay = useMemo(
    () =>
      function NoRowsOverlay() {
        return (
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              minHeight: 96,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.paper',
              color: 'text.secondary',
              typography: 'body2',
            }}
          >
            {emptyMessage}
          </Box>
        );
      },
    [emptyMessage]
  );

  const mergedColumns = useMemo<readonly GridColDef<R>[]>(() => {
    if (!rowActions) {
      return columns;
    }
    // A flexible spacer soaks up the leftover width (mirrors the React-Admin datagrid's `__spacer__`)
    // so the actions column sits flush at the right edge instead of trailing the last data column.
    // Its flex is deliberately tiny: when a consumer column flexes (flex 1), that column dominates and
    // the spacer collapses to ~0; when nothing else flexes — including after "fit columns" strips the
    // flex off the data columns — the spacer is the only flex weight and takes *all* the leftover
    // (the ratio is 1 regardless of the absolute value). `minWidth: 0` lets it collapse to nothing when
    // the columns overflow, so the sticky actions column takes over on horizontal scroll.
    const spacerColumn: GridColDef<R> = {
      field: SPACER_FIELD,
      headerName: '',
      flex: SPACER_FLEX,
      minWidth: 0,
      sortable: false,
      filterable: false,
      hideable: false,
      resizable: false,
      disableColumnMenu: true,
      disableReorder: true,
    };
    const actionsColumn: GridColDef<R> = {
      field: ACTIONS_FIELD,
      headerName: '',
      // Initial width until the first measurement lands (and when there's nothing to measure — e.g.
      // no rows yet). Small so the column only ever grows to its content, never flashes wide.
      width: actionsWidth ?? ACTIONS_DEFAULT_WIDTH,
      sortable: false,
      filterable: false,
      hideable: false,
      resizable: false,
      disableColumnMenu: true,
      disableReorder: true,
      align: 'right',
      headerAlign: 'right',
      // Stop the click from bubbling to the row so triggering an action never selects the row.
      renderCell: (params) => (
        <Box className={ROW_ACTIONS_CLASS} onClick={(event) => event.stopPropagation()}>
          {rowActions(params.row)}
        </Box>
      ),
    };
    return [...columns, spacerColumn, actionsColumn];
  }, [columns, rowActions, actionsWidth]);

  // Pin the actions column to the width of its widest rendered action set (measured from the DOM).
  useActionsColumnWidth({apiRef, autosizeActions, rows, mergedColumns});

  // Keep the helper columns out of the column-selection panel, composing on top of any consumer
  // `getTogglableColumns` rather than replacing it.
  const consumerGetTogglable = slotProps?.columnsManagement?.getTogglableColumns;
  const getTogglableColumns = (cols: GridColDef[]): GridColDef['field'][] =>
    (consumerGetTogglable ? consumerGetTogglable(cols) : cols.map((column) => column.field)).filter(
      (field) => !HELPER_FIELDS.includes(field)
    );

  // Zebra striping: add the striped class to every other row (0-based index 1, 3, … → the 2nd, 4th
  // row, matching DataTable), composing on top of any consumer `getRowClassName`. Semantic-tinted
  // rows opt out so striping never fights the row colors. Left undefined when nothing needs a class.
  const getRowClassName: DataGridProps<R>['getRowClassName'] =
    stripedRows || consumerGetRowClassName
      ? (params) => {
          const consumerClass = consumerGetRowClassName?.(params) ?? '';
          const striped =
            stripedRows &&
            params.indexRelativeToCurrentPage % 2 === 1 &&
            !isRowTinted(consumerClass);
          return [consumerClass, striped ? STRIPED_ROW_CLASS : ''].filter(Boolean).join(' ');
        }
      : undefined;

  return (
    <MuiDataGrid<R>
      autoHeight
      disableColumnMenu
      disableColumnFilter
      pageSizeOptions={[10, 25, 50]}
      // A sticky (not Pro-pinned) actions column needs every column in the DOM to stay put.
      {...(rowActions ? {disableVirtualization: true} : {})}
      {...rest}
      density={density}
      columnHeaderHeight={columnHeaderHeight}
      getRowClassName={getRowClassName}
      apiRef={apiRef}
      columns={mergedColumns}
      rows={rows}
      // Sort with a rounded drop-down caret; consumer slots still override.
      slots={{
        columnSortedAscendingIcon: SortAscendingIcon,
        columnSortedDescendingIcon: SortDescendingIcon,
        noRowsOverlay: NoRowsOverlay,
        ...slots,
      }}
      slotProps={{
        ...slotProps,
        columnsManagement: {...slotProps?.columnsManagement, getTogglableColumns},
      }}
      sx={[
        (theme) => dataGridSx(theme, {rowHighlight: !disableRowHighlight, stripedRows}),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
};
