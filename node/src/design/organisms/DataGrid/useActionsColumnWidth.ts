import {useCallback, useEffect, useRef} from 'react';
import type {GridValidRowModel} from '@mui/x-data-grid';
import type {DataGridApiRef} from './DataGridContext';
import {ACTIONS_FIELD, ROW_ACTIONS_CLASS} from './constants';

type UseActionsColumnWidthArgs = {
  /** The resolved grid API (provider / prop / local), whose root element is measured. */
  apiRef: DataGridApiRef;
  /** Whether to measure — `true` only when there are `rowActions` and no fixed `actionsWidth`. */
  autosizeActions: boolean;
  /** Re-measure when the rows change (the rendered action set may differ). */
  rows: readonly GridValidRowModel[] | undefined;
  /** Re-measure when the columns change (the actions column may be re-created). */
  mergedColumns: readonly unknown[];
};

/**
 * Pins the actions column to exactly the width of its widest rendered action set. We measure the DOM
 * ourselves instead of MUI X's `autosizeColumns` for two reasons: (1) it's deterministic on the first
 * paint — reading each button group's geometry works even before the column is wide enough to show
 * them (the layout positions are correct even while the cell clips them), so both buttons appear
 * immediately rather than only after a manual "fit columns"; (2) it keeps the actions column out of
 * the toolbar's fit-columns pass, which should only touch data columns.
 */
export const useActionsColumnWidth = ({
  apiRef,
  autosizeActions,
  rows,
  mergedColumns,
}: UseActionsColumnWidthArgs): void => {
  const lastActionsWidthRef = useRef<number | null>(null);

  const measureActionsWidth = useCallback(() => {
    const root = apiRef.current?.rootElementRef?.current;
    if (!root) {
      return;
    }
    const boxes = root.querySelectorAll<HTMLElement>(`.${ROW_ACTIONS_CLASS}`);
    // Span from the first button's left edge to the last button's right edge — this includes the
    // inter-button gaps and is independent of how the (cell-filling) flex box aligns them.
    let content = 0;
    boxes.forEach((box) => {
      const kids = box.children;
      if (kids.length === 0) {
        return;
      }
      const left = kids[0].getBoundingClientRect().left;
      const right = kids[kids.length - 1].getBoundingClientRect().right;
      content = Math.max(content, right - left);
    });
    if (content <= 0) {
      return;
    }
    // Add the cell's own horizontal padding, read off a live cell so it tracks the theme.
    const cell = boxes[0]?.closest<HTMLElement>('.MuiDataGrid-cell');
    const style = cell ? getComputedStyle(cell) : null;
    const padX = style ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) : 0;
    const width = Math.ceil(content + padX);
    if (width > 0 && width !== lastActionsWidthRef.current) {
      lastActionsWidthRef.current = width;
      apiRef.current?.setColumnWidth(ACTIONS_FIELD, width);
    }
  }, [apiRef]);

  // Re-measure whenever the rows (and thus the rendered actions) change. Runs after commit, on the
  // next frame, when the cells are in the DOM — `disableVirtualization` (set in DataGrid when
  // `rowActions` is present) keeps every row mounted so we see the widest action set, not just the
  // page slice.
  useEffect(() => {
    if (!autosizeActions) {
      return;
    }
    const frame = requestAnimationFrame(measureActionsWidth);
    return () => cancelAnimationFrame(frame);
  }, [autosizeActions, measureActionsWidth, rows, mergedColumns]);
};
