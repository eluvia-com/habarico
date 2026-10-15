import clsx from 'clsx';
import React from 'react';
import {
  DatagridRowProps,
  DatagridRow as RaDatagridRow,
  RaRecord,
  useRecordContext,
} from 'react-admin';
import {DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {Tooltip} from '@mui/material';
import {useDatagridRowTooltip} from './useDatagridRowTooltip';

type RecordWithTags = RaRecord & {meta?: {tags?: string[]}};

type DatagridRowOwnProps = {rowTooltip?: DatagridTooltipFn};

export const DatagridRow = ({rowTooltip, ...props}: DatagridRowProps & DatagridRowOwnProps) => {
  const record = useRecordContext<RecordWithTags>();
  // React Admin's `DatagridRow` never forwards `selected` to the underlying `<TableRow>` (it only
  // uses it for the checkbox), so a selected row carries no row-level class. Add `Mui-selected`
  // ourselves so `datagridSx` can paint the selected-row highlight — mirroring the `.Mui-selected`
  // target in design/organisms/DataGrid.
  const className = clsx(record?.meta?.tags, {'Mui-selected': props.selected}) || undefined;
  const {tooltipTitle, open, handleMouseOver, handleMouseLeave, handleMouseDown} =
    useDatagridRowTooltip(record, rowTooltip);

  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} open={open} followCursor>
        <RaDatagridRow
          {...props}
          className={className}
          onMouseOver={handleMouseOver}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
        />
      </Tooltip>
    );
  }

  return <RaDatagridRow {...props} className={className} />;
};
