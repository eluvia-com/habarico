import React, {useRef} from 'react';
import {RaRecord, useRecordContext} from 'react-admin';
import {DraggableCore, type DraggableEventHandler} from 'react-draggable';
import {getEventClientPoint} from '@admin/utils/dragEvents';
import {ImagePanel, ImagePanelProps} from '@design/molecules/ImagePanel';
import {Box} from '@mui/material';

type DraggableImagePanelProps = ImagePanelProps & {
  onDropRow: (record: RaRecord, index: number) => void;
  index: number;
  draggable?: boolean;
  // Class of the ancestor element that wraps each item (owned by the schema-layer collection that
  // renders this panel, e.g. `SchemaImages-item`). Passed in so this admin component stays agnostic
  // of any schema-owned DOM class.
  itemClassName: string;
};

export const DraggableImagePanel = ({
  index,
  draggable,
  onDropRow,
  itemClassName,
  ...props
}: DraggableImagePanelProps) => {
  const record = useRecordContext();
  const ref = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------------------------
  // Drag & drop handlers — driven by react-draggable's DraggableCore (mouse + touch) rather than
  // the HTML5 Drag API, which mobile browsers never fire from touch input.
  // --------------------------------------------------------------------------

  const handleDrag: DraggableEventHandler = (event) => {
    const selectedItem = ref.current;
    const point = getEventClientPoint(event as MouseEvent | TouchEvent);
    if (!selectedItem || !point) return;
    const selectedItemRoot = selectedItem.closest(`.${itemClassName}`);

    if (!selectedItemRoot) return;
    selectedItemRoot.classList.add('drag-active');
    const table = selectedItemRoot.closest('.MuiGrid-container');
    if (!table) return;

    const elementFromPoint = document.elementFromPoint(point.x, point.y);
    const dropItem: Element | null =
      elementFromPoint === null
        ? selectedItemRoot
        : elementFromPoint.closest('.DraggableImagePanel');

    if (!dropItem) return;

    let dropItemRoot: Element | null = dropItem.closest(`.${itemClassName}`);

    if (!dropItemRoot) {
      return;
    }
    if (dropItemRoot === selectedItemRoot) {
      return;
    }

    if (table === dropItemRoot.closest('.MuiGrid-container')) {
      if (dropItemRoot === selectedItemRoot.nextSibling) {
        dropItemRoot = dropItemRoot.nextSibling as Element;
      }
      table.insertBefore(selectedItemRoot, dropItemRoot);
    }
  };

  const handleDragStop: DraggableEventHandler = () => {
    const selectedItem = ref.current;
    if (!selectedItem) return;
    const selectedItemRoot = selectedItem.closest(`.${itemClassName}`);
    const table = selectedItemRoot?.closest('.MuiGrid-container');

    // Read the drop index straight off the DOM order left behind by handleDrag's
    // insertBefore calls, rather than tallying it incrementally during the drag: the
    // latter can desync from where the item visually ended up when the pointer lingers
    // over the final tile for more than one move event.
    if (selectedItemRoot && table) {
      const newIndex = Array.prototype.indexOf.call(table.children, selectedItemRoot);
      if (newIndex !== -1 && newIndex !== index) {
        onDropRow(record!, newIndex);
      }
    }

    selectedItem.classList.remove('drag-active');
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (!record) return null;

  return (
    <DraggableCore disabled={!draggable} onDrag={handleDrag} onStop={handleDragStop} nodeRef={ref}>
      <Box
        className="DraggableImagePanel"
        data-index={index}
        ref={ref}
        sx={draggable ? {cursor: 'move', touchAction: 'none'} : {}}
      >
        <ImagePanel {...props} />
      </Box>
    </DraggableCore>
  );
};
