import {getBreakpointFromWidth} from 'react-grid-layout';
import type {LayoutItem, ResponsiveLayouts} from 'react-grid-layout';
import type {DashboardGridPanel} from './DashboardGrid';

export const GRID_COLS = 12;

/**
 * Container width (px) at and below which the grid stacks its panels into one column. RGL picks
 * `lg` only for a width strictly greater than its breakpoint, so exactly 996px is already narrow.
 */
export const NARROW_BREAKPOINT = 996;

/** The grid's two RGL breakpoints: the 12-col layout above `NARROW_BREAKPOINT`, the stack below. */
export const GRID_BREAKPOINTS = {lg: NARROW_BREAKPOINT, sm: 0};

/** Whether a grid of this container width renders the stacked (single-column) breakpoint. */
export const isNarrowWidth = (width: number) =>
  getBreakpointFromWidth(GRID_BREAKPOINTS, width) === 'sm';

/** Grid item id of the invisible, static drop spacer kept below the panels in edit mode. */
export const SPACER_ID = '__spacer';

const toLayout = (p: DashboardGridPanel): LayoutItem => ({
  i: p.id,
  x: p.layout.x,
  y: p.layout.y,
  w: p.layout.w,
  h: p.layout.h,
  minW: p.layout.minW,
  minH: p.layout.minH,
});

/** A panel's height in rows when the grid stacks it: its own `stackedH`, else its `h`. */
export const stackedHeight = (p: DashboardGridPanel) => p.layout.stackedH ?? p.layout.h;

// The row just below the stack — the stacked heights of all panels added up.
export const stackedBottom = (panels: DashboardGridPanel[]) =>
  panels.reduce((sum, p) => sum + stackedHeight(p), 0);

// On the single-column breakpoint stack panels vertically in the reading order of the 12-col
// layout — top to bottom, then left to right — each at its stacked height. While editing, a
// stacked panel can only be resized from its bottom edge and not dragged: its position is derived
// from the 12-col layout, so there is nothing a drag could write back.
const toStackedLayout = (panels: DashboardGridPanel[], isEditing: boolean): LayoutItem[] => {
  let y = 0;
  return [...panels]
    .sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x)
    .map((p) => {
      const h = stackedHeight(p);
      const item: LayoutItem = {i: p.id, x: 0, y, w: 1, h, minH: p.layout.minH};
      y += h;
      if (!isEditing) return item;
      return {...item, minW: 1, maxW: 1, resizeHandles: ['s'], isDraggable: false};
    });
};

// Per-breakpoint RGL layouts: the 12-col layout on lg, the stack on sm. In wide edit mode the drop
// spacer joins the lg layout. It must not be left out of the layout RGL picks while its grid item
// is rendered: RGL would then place it at {x: 0, y: 0, w: 1, h: 1}, a phantom tile that
// preventCollision keeps panels out of — so the grid renders that item only while it is wide.
export const buildLayouts = (
  isEditing: boolean,
  panels: DashboardGridPanel[],
  spacerItem?: LayoutItem
): ResponsiveLayouts => {
  const lg = panels.map(toLayout);
  return {
    lg: isEditing && spacerItem ? [...lg, spacerItem] : lg,
    sm: toStackedLayout(panels, isEditing),
  };
};

// Map RGL's live layout back to {id, layout}[] for the real panels (spacer/ghost excluded),
// spreading each panel's existing layout first so its minW/minH survive drag/resize writes.
// On a narrow grid the items are the stack, whose x/y/w are derived: only a changed height is
// written back, as `stackedH`. An unchanged one is left alone, so a panel without a `stackedH`
// of its own keeps following its `h` instead of being pinned to it.
export const mapLayoutBack = (
  panels: DashboardGridPanel[],
  items: LayoutItem[],
  isNarrow: boolean
) =>
  panels.map((p) => {
    const item = items.find((l) => l.i === p.id && l.i !== SPACER_ID);
    if (!item) return {id: p.id, layout: p.layout};
    if (isNarrow) {
      if (item.h === stackedHeight(p)) return {id: p.id, layout: p.layout};
      return {id: p.id, layout: {...p.layout, stackedH: item.h}};
    }
    return {id: p.id, layout: {...p.layout, x: item.x, y: item.y, w: item.w, h: item.h}};
  });
