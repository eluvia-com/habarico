import React, {useCallback, useEffect, useRef, useState} from 'react';
import {RaRecord} from 'react-admin';
import {DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {ACTIONS_COLUMN_CLASS} from '@admin/components/datagrid/StyledDatagrid/constants';
import {TOOLTIP_ENTER_DELAY} from '@admin/constants';

export const useDatagridRowTooltip = (
  record: RaRecord | undefined,
  tooltipFn: DatagridTooltipFn | null | undefined
) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const tooltipTitle = record && tooltipFn ? (tooltipFn(record) ?? null) : null;

  const handleMouseOver = useCallback(
    (e: React.MouseEvent) => {
      // `currentTarget` is the `<tr>` this is bound to in `DatagridRow`; `target` is whatever the
      // pointer is really over. Two kinds of event reach this handler without belonging to the row's
      // own content, and both are recognised by *where the target sits in the DOM*:
      //
      //  - Out of a portal. A row action renders its dialog as a React descendant of the actions
      //    cell, but MUI mounts that dialog on `document.body`. React bubbles synthetic events along
      //    the JSX tree rather than the DOM tree, so hovering a panel inside the open dialog still
      //    fires this handler — and that panel is a plain `div`, so no "does it look interactive"
      //    test rejects it. `contains` is the question only the DOM tree can answer: the dialog is
      //    not under the row, so the row hint must not open over it.
      //  - In the row-actions cell. That cell is row chrome, not row content, so it gets no hint.
      //    Matching the cell class (rather than `button` / `a` / `[role=button]`) also covers the
      //    gaps between the buttons, the `span` wrappers around disabled ones and the overflow menu.
      const row = e.currentTarget as HTMLElement;
      const target = e.target as HTMLElement;
      const outsideRow = !row.contains(target);
      const inActionsCell = target.closest(`.${ACTIONS_COLUMN_CLASS}`) !== null;

      if (outsideRow || inActionsCell) {
        clearTimer();
        setOpen(false);
      } else if (!open) {
        clearTimer();
        timerRef.current = setTimeout(() => setOpen(true), TOOLTIP_ENTER_DELAY);
      }
    },
    [open, clearTimer]
  );

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  // A click never moves the pointer, so no further `mouseover` arrives to re-evaluate the target and
  // the hint would stay open on top of whatever that click just opened. `mousedown` fires ahead of
  // both `click` and `dblclick`, and is the handler that is free to take: react-admin's
  // `DatagridRow` spreads its rest props *after* its own `onClick` (`DatagridRow.tsx:181`), so
  // passing `onClick` would override row activation outright, while `onMouseDown` composes safely.
  const handleMouseDown = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  return {tooltipTitle, open, handleMouseOver, handleMouseLeave, handleMouseDown};
};
