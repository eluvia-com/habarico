import {
  DEFAULT_BREAKPOINTS,
  findOrGenerateResponsiveLayout,
  getBreakpointFromWidth,
  noCompactor,
} from 'react-grid-layout';
import type {LayoutItem} from 'react-grid-layout';
import {describe, expect, it} from 'vitest';
import type {DashboardGridPanel} from '../DashboardGrid';
import {buildLayouts} from '../utils';

const panel = (id: string, layout: DashboardGridPanel['layout']): DashboardGridPanel => ({
  id,
  layout,
  label: id,
  content: null,
});

const PANELS: DashboardGridPanel[] = [
  panel('a', {x: 4, y: 0, w: 4, h: 2}),
  panel('b', {x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 1}),
];

const SPACER: LayoutItem = {i: '__spacer', x: 11, y: 7, w: 1, h: 1, static: true};

describe('buildLayouts', () => {
  // A breakpoint whose layout lacks the spacer makes RGL synthesize it at {x: 0, y: 0, w: 1, h: 1},
  // which then blocks dragging a panel into the grid's top-left cell.
  it.each([1280, 1000, 900, 600, 320])(
    'edit mode keeps the spacer at its real position on a %ipx wide grid',
    (width) => {
      const layouts = buildLayouts(true, PANELS, SPACER);
      const breakpoint = getBreakpointFromWidth(DEFAULT_BREAKPOINTS, width);
      const layout = findOrGenerateResponsiveLayout(
        layouts,
        DEFAULT_BREAKPOINTS,
        breakpoint,
        breakpoint,
        12,
        noCompactor
      );

      expect(layout.map((item) => item.i)).toEqual(['a', 'b', '__spacer']);
      expect(layout.find((item) => item.i === '__spacer')).toMatchObject({x: 11, y: 7});
    }
  );

  it('detail mode keeps the 12-col layout on lg and stacks panels on sm, without the spacer', () => {
    const layouts = buildLayouts(false, PANELS, SPACER);

    expect(layouts.lg).toEqual([
      {i: 'a', x: 4, y: 0, w: 4, h: 2, minW: undefined, minH: undefined},
      {i: 'b', x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 1},
    ]);
    expect(layouts.sm).toEqual([
      {i: 'a', x: 0, y: 0, w: 1, h: 2, minH: undefined},
      {i: 'b', x: 0, y: 2, w: 1, h: 2, minH: 1},
    ]);
  });
});
