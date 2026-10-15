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
  const dropIndex = useRef<number | null>(null);

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
      const dropItemIndex = toInteger(dropItem.dataset.index);
      const dragItemIndex = toInteger(selectedRow.dataset.index);
      if (
        !dropIndex.current ||
        dropItemIndex > dropIndex.current ||
        dragItemIndex > dropItemIndex
      ) {
        dropIndex.current = dropItemIndex;
      } else {
        dropIndex.current = dropItemIndex - 1;
      }
      if (dropItem === selectedRow.nextSibling) {
        dropItem = dropItem.nextSibling as HTMLTableRowElement;
      }
      table.insertBefore(selectedRow, dropItem);
    }
  };

  const handleDragStop: DraggableEventHandler = () => {
    const selectedItem = dragRef.current;
    if (!selectedItem) return;

    if (dropIndex.current) {
      onDropRow(record!, dropIndex.current);
    }

    selectedItem.classList.remove('drag-active');
    dropIndex.current = null;
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (!record?.id) return null;

  return (
    <DatagridRow {...props} ref={ref} data-index={record?.index} rowTooltip={rowTooltip}>
      <DraggableCore
        disabled={loadingDnd}
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
