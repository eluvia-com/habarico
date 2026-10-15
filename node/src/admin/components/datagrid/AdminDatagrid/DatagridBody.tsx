import React from 'react';
import {
  DatagridBody as RaDatagridBody,
  DatagridBodyProps as RaDatagridBodyProps,
  RaRecord,
} from 'react-admin';
import {DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {DatagridRow} from './DatagridRow';
import {DraggableDatagridRow} from './DraggableDatagridRow';

type DatagridBodyProps = RaDatagridBodyProps & {
  onDropRow?: (record: RaRecord, index: number) => void;
  enableDnd?: boolean;
  loadingDnd?: boolean;
  rowTooltip?: DatagridTooltipFn;
};

export const DatagridBody = ({
  onDropRow,
  enableDnd,
  loadingDnd,
  rowTooltip,
  ...props
}: DatagridBodyProps) => {
  const row =
    enableDnd && onDropRow ? (
      <DraggableDatagridRow onDropRow={onDropRow} loadingDnd={loadingDnd} rowTooltip={rowTooltip} />
    ) : (
      <DatagridRow rowTooltip={rowTooltip} />
    );
  return <RaDatagridBody {...props} row={row} />;
};
