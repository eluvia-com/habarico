import React from 'react';
import {Stack, SxProps, Theme} from '@mui/material';
import {GRID_CHECKBOX_SELECTION_FIELD, GridPreferencePanelsValue} from '@mui/x-data-grid';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../../molecules/ButtonsStack';
import {useDataGridContext} from './DataGridContext';
import {ACTIONS_FIELD, SPACER_FIELD} from './constants';

// The synthetic/fixed columns the "fit columns" pass must leave alone: the actions column sizes
// itself to its buttons, the spacer only exists to absorb leftover width, and the selection checkbox
// has a fixed width.
const NON_AUTOSIZED_FIELDS: string[] = [ACTIONS_FIELD, SPACER_FIELD, GRID_CHECKBOX_SELECTION_FIELD];

export type DataGridToolbarProps = {
  /** Show the column-selection button (opens the grid's columns panel). Defaults to `true`. */
  columns?: boolean;
  /** Show the auto-size-columns button (fits every column to its content). Defaults to `true`. */
  autosize?: boolean;
  /** Show the reset-sorting button (clears the sort model). Defaults to `true`. */
  resetSort?: boolean;
  /** Extra buttons appended after the built-in ones. */
  children?: React.ReactNode;
  /** Extra styles merged onto the toolbar row. */
  sx?: SxProps<Theme>;
};

/**
 * A compact, right-aligned toolbar of grid actions, kept **separate** from the `DataGrid` so it
 * can be composed anywhere (e.g. a `PanelHeader` actions slot) — it drives the grid through the
 * shared api from `DataGridProvider`, so both must live under one provider. Built-in actions:
 * pick visible columns, auto-size columns to content, and reset sorting.
 */
export const DataGridToolbar = ({
  columns = true,
  autosize = true,
  resetSort = true,
  children,
  sx,
}: DataGridToolbarProps) => {
  const {apiRef} = useDataGridContext();

  // The ref is read inside the (deferred) onClick handlers, never during render. Built as a plain
  // literal (spreads, no function call) so the ref-reading handlers only flow through the JSX
  // `actions` prop below.
  const builtins: ButtonDefinition[] = [
    ...(columns
      ? [
          {
            label: 'Columns',
            icon: IconType.ViewWeek,
            onClick: () => apiRef.current?.showPreferences(GridPreferencePanelsValue.columns),
          },
        ]
      : []),
    ...(autosize
      ? [
          {
            label: 'Fit columns',
            icon: IconType.HorizontalAlignCenter,
            onClick: () => {
              const api = apiRef.current;
              if (!api) return;
              // Only the data columns — never the actions/spacer/checkbox plumbing, which owns its
              // own width. No `expand`, so columns fit their content and the spacer keeps the actions
              // column pinned right with whatever width is left over.
              const fields = api
                .getAllColumns()
                .map((column) => column.field)
                .filter((field) => !NON_AUTOSIZED_FIELDS.includes(field));
              api.autosizeColumns({columns: fields, includeHeaders: true, includeOutliers: true});
            },
          },
        ]
      : []),
    ...(resetSort
      ? [
          {
            label: 'Reset sorting',
            icon: IconType.SortByAlpha,
            onClick: () => apiRef.current?.setSortModel([]),
          },
        ]
      : []),
  ];

  return (
    <Stack direction={'row'} spacing={0.5} alignItems={'center'} sx={sx}>
      <ButtonsStack surface={'iconButton'} size={'small'} buttons={builtins} />
      {children}
    </Stack>
  );
};
