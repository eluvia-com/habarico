import {toInteger} from 'lodash-es';
import React, {forwardRef, useRef} from 'react';
import {DatagridRowProps, RaRecord, useRecordContext, useTranslate} from 'react-admin';
import {DraggableCore, type DraggableEventHandler} from 'react-draggable';
import {DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {getEventClientPoint} from '@admin/utils/dragEvents';
import {DragHandle} from '@design/molecules/DragHandle';
import {Box, BoxProps} from '@mui/material';
import {DatagridRow} from './DatagridRow';
import {IndexedRecord} from './types';

const BoxWithSource = forwardRef<HTMLDivElement, BoxProps & {source: string}>((props, ref) => (
  <Box ref={ref} {...props} />
));

BoxWithSource.displayName = 'BoxWithSource';

const indexedRows = (table: HTMLTableSectionElement) =>
  Array.from(table.rows).filter((row) => row.dataset.index !== undefined);

type DraggableDatagridRowProps = DatagridRowProps & {
  onDropRow: (record: RaRecord, index: number) => void;
  loadingDnd?: boolean;
  rowTooltip?: DatagridTooltipFn;
};

export const DraggableDatagridRow = ({
  onDropRow,
  loadingDnd,
  rowTooltip,
  children,
  ...props
}: DraggableDatagridRowProps) => {
  const record = useRecordContext<IndexedRecord>();
  const translate = useTranslate();

  // --------------------------------------------------------------------------
  // Drag & drop handlers
  // --------------------------------------------------------------------------

  const ref = useRef(null);
  const dragRef = useRef<HTMLDivElement>(null);
  // The rows' indices in display order when the drag starts; the n-th entry is the index of the
  // n-th place, whichever way the list is sorted.
  const slots = useRef<number[]>([]);

  const handleDragStart: DraggableEventHandler = () => {
    const table = dragRef.current?.closest('tbody');
    slots.current = table ? indexedRows(table).map((row) => toInteger(row.dataset.index)) : [];
  };

  const handleDrag: DraggableEventHandler = (event) => {
    const selectedItem = dragRef.current;
    const point = getEventClientPoint(event as MouseEvent | TouchEvent);
    const selectedRow = selectedItem?.closest('tr');

    if (!selectedItem || !point || !selectedRow) return;
    selectedItem.classList.add('drag-active');
    const table = selectedRow.closest('tbody');
    if (!table) return;

    const elementFromPoint = document.elementFromPoint(point.x, point.y);

    let dropItem = elementFromPoint === null ? selectedRow : elementFromPoint.closest('tr');

    if (!dropItem) {
      return;
    }
    if (dropItem === selectedRow) {
      return;
    }
    if (table === dropItem.closest('tbody')) {
      if (dropItem === selectedRow.nextSibling) {
        dropItem = dropItem.nextSibling as HTMLTableRowElement;
      }
      table.insertBefore(selectedRow, dropItem);
    }
  };

  const handleDragStop: DraggableEventHandler = () => {
    const selectedItem = dragRef.current;
    if (!selectedItem) return;
    selectedItem.classList.remove('drag-active');

    const selectedRow = selectedItem.closest('tr');
    const table = selectedRow?.closest('tbody');
    if (!selectedRow || !table) return;

    const newIndex = slots.current[indexedRows(table).indexOf(selectedRow)];

    if (newIndex !== undefined && newIndex !== record!.index) {
      onDropRow(record!, newIndex);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (!record?.id) return null;

  return (
    <DatagridRow {...props} ref={ref} data-index={record?.index} rowTooltip={rowTooltip}>
      <DraggableCore
        disabled={loadingDnd}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        nodeRef={dragRef}
      >
        <BoxWithSource
          ref={dragRef}
          source="__drag_and_drop__"
          sx={{
            display: 'flex',
            alignItems: 'center',
            touchAction: 'none',
          }}
        >
          <DragHandle loading={loadingDnd} aria-label={translate('ra.action.drag_to_reorder')} />
        </BoxWithSource>
      </DraggableCore>
      {React.Children.toArray(children).slice(1)}
    </DatagridRow>
  );
};
