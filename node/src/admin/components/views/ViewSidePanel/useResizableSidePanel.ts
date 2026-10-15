import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useStore} from 'react-admin';
import {
  SIDE_PANEL_DEFAULT_WIDTH,
  SIDE_PANEL_LIST_MIN_WIDTH,
  SIDE_PANEL_MIN_WIDTH,
} from './constants';

// Clamps a proposed panel width between the fixed minimum and `container - LIST_MIN`, so the
// panel stays usable for a form while never squeezing the list below its minimum. When the
// container is too narrow to satisfy both, the panel minimum wins.
export const clampSidePanelWidth = (next: number, containerWidth: number): number => {
  const max = Math.max(SIDE_PANEL_MIN_WIDTH, containerWidth - SIDE_PANEL_LIST_MIN_WIDTH);
  return Math.min(Math.max(next, SIDE_PANEL_MIN_WIDTH), max);
};

// Drag-to-resize width for the docked side panel. The width persists per user through the
// preferences store (like datagrid column widths) and is clamped between a fixed minimum (so the
// panel stays wide enough for a form column) and `container - LIST_MIN` (so the list beside it
// keeps a usable width). Returns the panel ref (used to measure the container), the width to
// apply, and a pointer-down handler for the drag handle.
export const useResizableSidePanel = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [storedWidth, setStoredWidth] = useStore<number>(
    'preferences.sidePanel.width',
    SIDE_PANEL_DEFAULT_WIDTH
  );
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const width = dragWidth ?? storedWidth;
  // Track the currently displayed width so a drag can start from it without re-creating the handler.
  // Synced in an effect (not during render) since it is only read when a drag starts, after commit.
  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const clamp = useCallback((next: number) => {
    const rowWidth = panelRef.current?.parentElement?.getBoundingClientRect().width ?? Infinity;
    return clampSidePanelWidth(next, rowWidth);
  }, []);

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = widthRef.current;
      let finalWidth = startWidth;

      const onMove = (ev: PointerEvent) => {
        // The panel is docked on the right, so dragging the handle left widens it.
        finalWidth = clamp(startWidth + (startX - ev.clientX));
        setDragWidth(finalWidth);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        setStoredWidth(finalWidth);
        setDragWidth(null);
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [clamp, setStoredWidth]
  );

  return {panelRef, width, onResizeStart};
};
