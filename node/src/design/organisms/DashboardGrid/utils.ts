import {DEFAULT_BREAKPOINTS} from 'react-grid-layout';
import type {LayoutItem, ResponsiveLayouts} from 'react-grid-layout';
import type {DashboardGridPanel} from './DashboardGrid';

const toLayout = (p: DashboardGridPanel): LayoutItem => ({
  i: p.id,
  x: p.layout.x,
  y: p.layout.y,
  w: p.layout.w,
  h: p.layout.h,
  minW: p.layout.minW,
  minH: p.layout.minH,
});

// On single-column breakpoints (detail mode) stack panels vertically in their current order.
const toStackedLayout = (panels: DashboardGridPanel[]): LayoutItem[] => {
  let y = 0;
  return panels.map((p) => {
    const item: LayoutItem = {i: p.id, x: 0, y, w: 1, h: p.layout.h, minH: p.layout.minH};
    y += p.layout.h;
    return item;
  });
};

// Per-breakpoint RGL layouts. Detail mode keeps the layout on lg and stacks to one column on sm.
// Edit mode uses the 12-col grid everywhere and must give every breakpoint RGL can pick the same
// panels + drop spacer: a layout without the spacer makes RGL place it at {x: 0, y: 0, w: 1, h: 1},
// a phantom tile that preventCollision keeps panels out of — the top-left cell becomes unreachable.
export const buildLayouts = (
  isEditing: boolean,
  panels: DashboardGridPanel[],
  spacerItem: LayoutItem
): ResponsiveLayouts => {
  if (!isEditing) return {lg: panels.map(toLayout), sm: toStackedLayout(panels)};
  const editItems = [...panels.map(toLayout), spacerItem];
  return Object.fromEntries(Object.keys(DEFAULT_BREAKPOINTS).map((bp) => [bp, editItems]));
};
