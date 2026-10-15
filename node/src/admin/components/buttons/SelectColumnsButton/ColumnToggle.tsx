import React, {useRef} from 'react';
import {FieldTitle, useResourceContext} from 'react-admin';
import {DraggableCore, type DraggableEventHandler} from 'react-draggable';
import {getEventClientPoint} from '@admin/utils/dragEvents';
import {Icon, IconType} from '@design/atoms/Icon';
import {Box, Switch, Typography} from '@mui/material';

export type ColumnToggleProps = {
  /** Whether this column is currently shown. */
  selected: boolean;
  /** Explicit column label. When absent, {@link FieldTitle} humanizes `source`. */
  label?: string;
  /** Field source, used by {@link FieldTitle} to derive/translate a label. */
  source?: string;
  /** Stable column index (position in `availableColumns`), used as the toggle/move identity. */
  index: string;
  /** Fired when the switch flips; the event's `name` carries the column `index`. */
  onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Fired after a drag-reorder with the dragged and drop-target indices. */
  onMove: (dragIndex: string, dropIndex: string) => void;
};

/**
 * A single show/hide row inside {@link SelectColumnsButton}'s panel: a labelled switch plus a
 * drag handle for reordering. This is the de-overridden replacement for React Admin's internal
 * `FieldToggle` — it ports the same drag-reorder behaviour (mirroring `DraggableDatagridRow`) but
 * builds on the design-layer `Icon`, carries real types, and drives the reorder off
 * `react-draggable`'s `DraggableCore` (mouse + touch) instead of the HTML5 Drag API, which mobile
 * browsers never fire from touch input.
 */
export const ColumnToggle = ({
  selected,
  label,
  source,
  index,
  onToggle,
  onMove,
}: ColumnToggleProps) => {
  const resource = useResourceContext();
  const switchId = React.useId();
  const itemRef = useRef<HTMLLIElement>(null);
  const dropIndex = useRef<string | null>(null);

  const handleDrag: DraggableEventHandler = (event) => {
    const selectedItem = itemRef.current;
    const point = getEventClientPoint(event as MouseEvent | TouchEvent);
    if (!selectedItem || !point) return;
    selectedItem.classList.add('drag-active');
    const list = selectedItem.closest('ul');
    if (!list) return;

    const elementAtDragCoordinates = document.elementFromPoint(point.x, point.y);
    let dropItem: Element | null =
      elementAtDragCoordinates === null ? selectedItem : elementAtDragCoordinates.closest('li');
    if (!dropItem) return;
    if (dropItem.classList.contains('dragIcon')) {
      dropItem = dropItem.parentElement;
    }
    if (!dropItem || dropItem === selectedItem) return;

    if (list === dropItem.parentElement?.closest('ul')) {
      dropIndex.current = (dropItem as HTMLElement).dataset.index ?? null;
      if (dropItem === selectedItem.nextSibling) {
        dropItem = dropItem.nextSibling as Element;
      }
      list.insertBefore(selectedItem, dropItem);
    }
  };

  const handleDragStop: DraggableEventHandler = (event) => {
    const selectedItem = itemRef.current;
    if (!selectedItem) return;
    const list = selectedItem.closest('ul');
    const point = getEventClientPoint(event as MouseEvent | TouchEvent);
    const elementFromPoint = point ? document.elementFromPoint(point.x, point.y) : null;
    let dropItem: Element | null =
      !point || elementFromPoint === null ? selectedItem : elementFromPoint.closest('li');

    if (point && list && !dropItem) {
      const closestUL = selectedItem.closest('ul');
      if (closestUL && point.y > closestUL.getBoundingClientRect().bottom) {
        dropItem = list.lastElementChild;
      } else {
        dropItem = list.firstElementChild;
      }
    }

    if (dropItem && list === dropItem.closest('ul')) {
      if (selectedItem.dataset.index != null && dropIndex.current != null) {
        onMove(selectedItem.dataset.index, dropIndex.current);
      }
    }
    selectedItem.classList.remove('drag-active');
    dropIndex.current = null;
  };

  return (
    <DraggableCore handle=".dragIcon" onDrag={handleDrag} onStop={handleDragStop} nodeRef={itemRef}>
      <Box
        component="li"
        role="option"
        aria-selected={selected}
        ref={itemRef}
        data-index={index}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 0,
          '& svg': {cursor: 'move'},
          '&.drag-active': {
            background: 'transparent',
            color: 'transparent',
            outline: (theme) => `1px solid ${theme.palette.action.selected}`,
            '& .MuiSwitch-root, & svg': {visibility: 'hidden'},
          },
        }}
      >
        <Box component="label" htmlFor={switchId} sx={{display: 'flex', alignItems: 'center'}}>
          <Switch
            checked={selected}
            onChange={onToggle}
            name={index}
            id={switchId}
            size="small"
            sx={{mr: 0.5, ml: -0.5}}
          />
          <Typography variant="body2" component="span">
            <FieldTitle label={label} source={source} resource={resource} />
          </Typography>
        </Box>
        <Icon
          className="dragIcon"
          icon={IconType.DragIndicator}
          color="disabled"
          fontSize="small"
          sx={{touchAction: 'none'}}
        />
      </Box>
    </DraggableCore>
  );
};
