import React, {useEffect, useState} from 'react';
import {ResponsiveGridLayout, noCompactor, useContainerWidth} from 'react-grid-layout';
import type {Compactor, Layout, LayoutItem, ResponsiveLayouts} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type {ColorType} from '@design/theme/core';
import {Box, SxProps, Theme, Typography, useTheme} from '@mui/material';
import {IconType} from '../../atoms/Icon';
import {Panel} from '../../molecules/Panel';
import {PanelContent, type PanelContentPadding} from '../../molecules/PanelContent';
import {PANEL_DRAG_HANDLE_CLASS, PanelHeader} from '../../molecules/PanelHeader';
import {buildLayouts} from './utils';

const GRID_COLS = 12;
const COLS_VIEW = {lg: GRID_COLS, md: GRID_COLS, sm: 1, xs: 1, xxs: 1};
const COLS_EDIT = {lg: GRID_COLS, md: GRID_COLS, sm: GRID_COLS, xs: GRID_COLS, xxs: GRID_COLS};
const ROW_HEIGHT = 100;
const GRID_MARGIN = 10;
const SPACER_ID = '__spacer';
// standard width (cols) of the add-panel ghost tile, and its height when it starts a new row
const ADD_GHOST_W = 3;
const ADD_GHOST_FALLBACK_H = 2;
// Empty rows kept below the last panel while editing — the dot grid is drawn this far down
// and an invisible drop spacer sits on the same row, so the grid always has room to grow.
const DOT_EXTRA_ROWS = 5;

const noCompactorPreventCollision: Compactor = {...noCompactor, preventCollision: true};

type Rect = {x: number; y: number; w: number; h: number};
const rectsOverlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Layout for the add-panel ghost: scan top-to-bottom, left-to-right for the first free slot of the
// given width that doesn't overlap ANY panel (so it clears tall panels spanning down from above),
// taking the height of the panels starting on that row (else a fallback); if no gap fits, start a
// new row below everything.
const computeAddGhostLayout = (
  panels: DashboardGridPanel[],
  w: number
): DashboardGridPanelLayout => {
  const bottom = Math.max(0, ...panels.map((p) => p.layout.y + p.layout.h));
  for (let y = 0; y <= bottom; y++) {
    const rowStart = panels.filter((p) => p.layout.y === y);
    const h =
      rowStart.length > 0 ? Math.max(...rowStart.map((p) => p.layout.h)) : ADD_GHOST_FALLBACK_H;
    for (let x = 0; x + w <= GRID_COLS; x++) {
      const candidate: Rect = {x, y, w, h};
      if (!panels.some((p) => rectsOverlap(candidate, p.layout))) return candidate;
    }
  }
  return {x: 0, y: bottom, w, h: ADD_GHOST_FALLBACK_H};
};

/** Grid geometry for one panel, in 12-column grid units (mirrors react-grid-layout's item subset). */
export type DashboardGridPanelLayout = {
  /** Column offset (0-indexed from the left edge of the 12-col grid). */
  x: number;
  /** Row offset (0-indexed from the top); one row is 100px tall. */
  y: number;
  /** Width in grid columns (1..12). */
  w: number;
  /** Height in grid rows. */
  h: number;
  /** Minimum width in columns the grid clamps drag-resize to. */
  minW?: number;
  /** Minimum height in rows the grid clamps drag-resize to. */
  minH?: number;
};

/** Interaction mode. `detail` = static read view; `edit` = drag/resize with a dot grid. */
export type DashboardGridMode = 'detail' | 'edit';

/**
 * One panel in the dashboard. The `DashboardGrid` renders the standard `Panel` chrome from these
 * header fields plus `content` (the widget body is opaque and fills the grid cell).
 */
export type DashboardGridPanel = {
  /** Stable unique id — the grid item key, echoed back in `onLayoutChange`. */
  id: string;
  /** Grid position + size. */
  layout: DashboardGridPanelLayout;
  /** Panel header title. */
  label: React.ReactNode;
  /** Optional leading header icon. */
  icon?: IconType | string;
  /** Semantic tint for the leading icon. */
  iconColor?: ColorType;
  /**
   * When `true` (default) the leading icon sits in a soft tinted rounded-square badge; when `false`
   * it is rendered as a bare colored glyph. Forwarded verbatim to the panel's `PanelHeader`.
   */
  iconBadge?: boolean;
  /** Optional header help tooltip content. */
  help?: React.ReactNode;
  /** Optional header actions (right-aligned) — e.g. edit/delete controls in edit mode. */
  actions?: React.ReactNode;
  /** Panel body (chart / table / number / …). Fills the cell height. */
  content: React.ReactNode;
  /** Content padding step. Defaults to the standard `medium` gutter; `none` is full-bleed (e.g. a table). */
  contentPaddingSize?: PanelContentPadding;
};

export type DashboardGridProps = {
  /** Panels with their current layouts. The component is CONTROLLED — this is the source of truth. */
  panels: DashboardGridPanel[];
  /** Interaction mode. Defaults to `detail`. */
  mode?: DashboardGridMode;
  /**
   * Fired on every drag/resize commit in edit mode with the panels' new layouts (spacer excluded).
   * The consumer updates `panels`. The design layer does no overlap validation or persistence.
   */
  onLayoutChange?: (layouts: {id: string; layout: DashboardGridPanelLayout}[]) => void;
  /**
   * Optional "add panel" affordance (typically a `GhostPanel`). In edit mode it is rendered as an
   * overlay aligned to the next free slot after the last row's panels (sized to that row), and as
   * the empty state when there are no panels yet. Ignored in detail mode.
   */
  addPanel?: React.ReactNode;
  /**
   * Centered, muted message shown when there are no panels (detail mode, or edit mode without
   * `addPanel`). Defaults to `"No content, please add widgets."`.
   */
  emptyMessage?: string;
  /** Extra styles merged onto the grid container. */
  sx?: SxProps<Theme>;
};

// Map RGL's live layout back to {id, layout}[] for the real panels (spacer/ghost excluded),
// spreading each panel's existing layout first so its minW/minH survive drag/resize writes.
const mapLayoutBack = (panels: DashboardGridPanel[], items: LayoutItem[]) =>
  panels.map((p) => {
    const item = items.find((l) => l.i === p.id && l.i !== SPACER_ID);
    if (!item) return {id: p.id, layout: p.layout};
    return {id: p.id, layout: {...p.layout, x: item.x, y: item.y, w: item.w, h: item.h}};
  });

/** The edit-mode dot grid overlay — a circle at every grid intersection. */
const DotGrid = ({
  cols,
  rows,
  cellW,
  cellH,
  width,
  height,
  color,
}: {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  width: number;
  height: number;
  color: string;
}) => (
  <svg style={{position: 'absolute', top: 0, left: 0, width, height, pointerEvents: 'none'}}>
    {Array.from({length: cols + 1}).flatMap((_, ci) =>
      Array.from({length: rows + 1}).map((_, ri) => (
        <circle
          key={`${ci}-${ri}`}
          cx={GRID_MARGIN / 2 + ci * cellW}
          cy={GRID_MARGIN / 2 + ri * cellH}
          r={1.5}
          fill={color}
        />
      ))
    )}
  </svg>
);

/**
 * A presentational, **controlled** 12-column responsive dashboard grid. In `detail` mode the
 * panels are static (stacked on narrow screens); in `edit` mode it enables drag + resize within
 * the grid and shows a dot-grid overlay. It renders the standard `Panel` chrome from each panel
 * definition and emits `onLayoutChange` — persistence, overlap validation, the add/edit flow and
 * the mode toggle belong to the consumer.
 */
export const DashboardGrid = ({
  panels,
  mode = 'detail',
  onLayoutChange,
  addPanel,
  emptyMessage = 'No content, please add widgets.',
  sx,
}: DashboardGridProps) => {
  const isEditing = mode === 'edit';
  const {width, containerRef} = useContainerWidth();
  const theme = useTheme();
  // while a panel is being dragged/resized, drop the add-panel ghost: its static tile would
  // otherwise reserve its grid cell (preventCollision) and block moving/resizing into that space
  const [isInteracting, setIsInteracting] = useState(false);

  // the add-panel ghost is a static tile placed after the last row while editing (with panels)
  const showAddGhost = isEditing && Boolean(addPanel) && panels.length > 0 && !isInteracting;
  const addGhostLayout = showAddGhost
    ? computeAddGhostLayout(panels, Math.min(ADD_GHOST_W, GRID_COLS))
    : null;

  // -- grid geometry --
  const gridWidth = width;
  const colWidth = (gridWidth - GRID_MARGIN * (GRID_COLS + 1)) / GRID_COLS;
  const cellW = colWidth + GRID_MARGIN;
  const cellH = ROW_HEIGHT + GRID_MARGIN;

  const rowBottoms = [
    ...panels.map((p) => p.layout.y + p.layout.h),
    ...(addGhostLayout ? [addGhostLayout.y + addGhostLayout.h] : []),
  ];
  const maxGridRow = rowBottoms.length > 0 ? Math.max(...rowBottoms) : 4;

  // cap the dot grid to the visible screen height so it doesn't extend far below the fold
  const [screenDotRows, setScreenDotRows] = useState<number | null>(null);
  useEffect(() => {
    if (!isEditing || !containerRef.current) {
      setScreenDotRows(null);
      return;
    }
    const top = containerRef.current.getBoundingClientRect().top;
    setScreenDotRows(Math.floor((window.innerHeight - top - GRID_MARGIN) / cellH));
  }, [isEditing, cellH, containerRef]);

  const dotRows = Math.max(maxGridRow + DOT_EXTRA_ROWS, screenDotRows ?? 0);
  const svgHeight = GRID_MARGIN + dotRows * cellH;
  const spacerRow = maxGridRow + DOT_EXTRA_ROWS;
  const spacerItem: LayoutItem = {
    i: SPACER_ID,
    x: GRID_COLS - 1,
    y: spacerRow,
    w: 1,
    h: 1,
    static: true,
  };

  const layouts = buildLayouts(isEditing, panels, spacerItem);

  const handleLayoutChange = (currentLayout: Layout, _all: ResponsiveLayouts) => {
    if (!isEditing || !currentLayout || !onLayoutChange) return;
    onLayoutChange(mapLayoutBack(panels, currentLayout as LayoutItem[]));
  };

  // Empty state: in edit mode the add-panel ghost is the "add your first panel" affordance;
  // otherwise (detail, or no addPanel) a centered, muted message.
  const emptyContent =
    isEditing && addPanel ? (
      <Box sx={{minHeight: ROW_HEIGHT * 2 + GRID_MARGIN}}>{addPanel}</Box>
    ) : (
      <Box sx={{py: 8, textAlign: 'center'}}>
        <Typography color={'text.secondary'}>{emptyMessage}</Typography>
      </Box>
    );

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: isEditing ? svgHeight : undefined,
        // RGL animates position/size changes; suppress the initial layout transition so panels
        // appear at their final place instead of growing in on first render
        '& .react-grid-item': {transition: 'none'},
        // round the drop-preview placeholder to match the (root) panel corners
        '& .react-grid-placeholder': {borderRadius: `${theme.radius.lg}px`},
        // keep the placeholder behind the panel being resized: RGL gives the resized item
        // z-index 1 but the placeholder z-index 2, so the red ghost paints over the panel;
        // lift the resized item above it (matching the dragging item's z-index 3) so the
        // ghost stays behind — visible only where the panel grows, never flashing over it
        '& .react-grid-item.resizing': {zIndex: 3},
        // hide RGL's own resize glyph (the ::after corner mark) — it collides with the Panel's
        // resize affordance. Keep the handle element itself (the transparent hit area) so resize
        // still works; only our Panel corner is drawn.
        '& .react-grid-item > .react-resizable-handle::after': {display: 'none'},
        ...sx,
      }}
    >
      {panels.length === 0 ? (
        emptyContent
      ) : (
        <>
          {isEditing && (
            <DotGrid
              cols={GRID_COLS}
              rows={dotRows}
              cellW={cellW}
              cellH={cellH}
              width={gridWidth}
              height={svgHeight}
              color={theme.palette.text.disabled}
            />
          )}
          <ResponsiveGridLayout
            key={isEditing ? 'edit' : 'view'}
            className={'layout'}
            width={gridWidth}
            layouts={layouts}
            cols={isEditing ? COLS_EDIT : COLS_VIEW}
            rowHeight={ROW_HEIGHT}
            margin={[GRID_MARGIN, GRID_MARGIN]}
            compactor={noCompactorPreventCollision}
            onLayoutChange={handleLayoutChange}
            dragConfig={{enabled: isEditing, handle: `.${PANEL_DRAG_HANDLE_CLASS}`}}
            resizeConfig={{enabled: isEditing}}
            onDragStart={() => setIsInteracting(true)}
            onDragStop={() => setIsInteracting(false)}
            onResizeStart={() => setIsInteracting(true)}
            onResizeStop={() => setIsInteracting(false)}
          >
            {isEditing && <Box key={SPACER_ID} sx={{display: 'none'}} />}
            {panels.map((p) => (
              // raise the hovered item so an inner chart tooltip isn't painted over by neighbours
              <Box key={p.id} sx={{height: '100%', '&:hover': {zIndex: 5}}}>
                <Panel resizeHandle={isEditing} sx={{height: '100%'}}>
                  <PanelHeader
                    label={p.label}
                    icon={p.icon}
                    iconColor={p.iconColor}
                    iconBadge={p.iconBadge}
                    help={p.help}
                    actions={p.actions}
                    dragHandle={isEditing}
                  />
                  <PanelContent
                    paddingSize={p.contentPaddingSize}
                    sx={{flexGrow: 1, minHeight: 0, overflow: 'auto'}}
                  >
                    {p.content}
                  </PanelContent>
                </Panel>
              </Box>
            ))}
          </ResponsiveGridLayout>
          {/* The add-panel ghost is an absolutely-positioned overlay (NOT a grid item) aligned to
              the next free slot — so its cell never blocks dragging/resizing panels into that
              space. It's hidden while a panel is being dragged/resized (see `showAddGhost`). */}
          {addGhostLayout && (
            <Box
              sx={{
                position: 'absolute',
                left: cellW * addGhostLayout.x + GRID_MARGIN,
                top: cellH * addGhostLayout.y + GRID_MARGIN,
                width: colWidth * addGhostLayout.w + GRID_MARGIN * (addGhostLayout.w - 1),
                height: ROW_HEIGHT * addGhostLayout.h + GRID_MARGIN * (addGhostLayout.h - 1),
              }}
            >
              {addPanel}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
