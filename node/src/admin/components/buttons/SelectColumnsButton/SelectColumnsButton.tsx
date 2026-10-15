import React from 'react';
import {useResourceContext, useStore} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {ConfigurableDatagridColumn} from '@admin/overrides/ra-iu-materialui';
import {Icon, IconType} from '@design/atoms/Icon';
import {usePopover} from '@design/hooks/usePopover';
import {Box} from '@mui/material';
import {ColumnToggle} from './ColumnToggle';

export type SelectColumnsButtonProps = ActionButtonProps & {
  /**
   * Store key namespace for this datagrid's preferences. Defaults to `[resource].datagrid`.
   * Must match the `preferenceKey` given to the datagrid so both read the same column config.
   */
  preferenceKey?: string;
};

/**
 * Lets users show/hide and reorder the columns of a configurable datagrid.
 *
 * De-overridden admin-layer replacement for the React Admin `SelectColumnsButton` fork: the trigger
 * is a plain {@link ActionButton}, the panel is a {@link usePopover} popover, and each row is a
 * {@link ColumnToggle}. It reads and writes the same column-config store contract
 * (`availableColumns` / `omit` / `columns`) that {@link DatagridConfigurable} populates, purely
 * through the public `useStore` hook — no React Admin theme/props override involved.
 */
export const SelectColumnsButton = ({
  preferenceKey,
  resource: resourceProp,
  surface = 'iconButton',
  size = 'medium',
  label = 'ra.action.select_columns',
  ...rest
}: SelectColumnsButtonProps) => {
  const resource = useResourceContext({resource: resourceProp});
  const finalPreferenceKey = preferenceKey || `${resource}.datagrid`;
  const {Popover, openPopover} = usePopover();

  const [availableColumns, setAvailableColumns] = useStore<ConfigurableDatagridColumn[]>(
    `preferences.${finalPreferenceKey}.availableColumns`,
    []
  );
  const [omit] = useStore<string[]>(`preferences.${finalPreferenceKey}.omit`, []);
  const [columns, setColumns] = useStore<string[]>(
    `preferences.${finalPreferenceKey}.columns`,
    availableColumns
      .filter((column) => (column.source ? !omit?.includes(column.source) : true))
      .map((column) => column.index)
  );

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // add the column back at its natural position
      setColumns(
        availableColumns
          .filter((column) => column.index === event.target.name || columns.includes(column.index))
          .map((column) => column.index)
      );
    } else {
      setColumns(columns.filter((index) => index !== event.target.name));
    }
  };

  const handleMove = (index1: string, index2: string) => {
    const index1Pos = availableColumns.findIndex((field) => field.index === index1);
    const index2Pos = availableColumns.findIndex((field) => field.index === index2);
    if (index1Pos === -1 || index2Pos === -1) {
      return;
    }
    let newAvailableColumns: ConfigurableDatagridColumn[];
    if (index1Pos > index2Pos) {
      newAvailableColumns = [
        ...availableColumns.slice(0, index2Pos),
        availableColumns[index1Pos],
        ...availableColumns.slice(index2Pos, index1Pos),
        ...availableColumns.slice(index1Pos + 1),
      ];
    } else {
      newAvailableColumns = [
        ...availableColumns.slice(0, index1Pos),
        ...availableColumns.slice(index1Pos + 1, index2Pos + 1),
        availableColumns[index1Pos],
        ...availableColumns.slice(index2Pos + 1),
      ];
    }
    setAvailableColumns(newAvailableColumns);
    setColumns(
      newAvailableColumns
        .filter((column) => columns.includes(column.index))
        .map((column) => column.index)
    );
  };

  return (
    <>
      <ActionButton
        {...rest}
        surface={surface}
        size={size}
        icon={<Icon icon={IconType.ViewWeek} />}
        label={label}
        onClick={openPopover}
      />
      <Popover
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        transformOrigin={{vertical: 'top', horizontal: 'center'}}
      >
        <Box component="ul" sx={{p: 1, my: 0, listStyle: 'none'}}>
          {availableColumns
            .filter((column) => !column.fixed) // fixed columns cannot be hidden
            .map((column) => (
              <ColumnToggle
                key={column.index}
                index={column.index}
                source={column.source}
                label={column.label}
                selected={columns.includes(column.index)}
                onToggle={handleToggle}
                onMove={handleMove}
              />
            ))}
        </Box>
      </Popover>
    </>
  );
};
