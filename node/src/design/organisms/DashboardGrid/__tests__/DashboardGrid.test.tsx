import {
  findOrGenerateResponsiveLayout,
  getBreakpointFromWidth,
  noCompactor,
} from 'react-grid-layout';
import type {LayoutItem} from 'react-grid-layout';
import {describe, expect, it} from 'vitest';
import type {DashboardGridPanel} from '../DashboardGrid';
import {GRID_BREAKPOINTS, SPACER_ID, buildLayouts, isNarrowWidth, mapLayoutBack} from '../utils';

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

const SPACER: LayoutItem = {i: SPACER_ID, x: 11, y: 7, w: 1, h: 1, static: true};

// The layout RGL renders for a grid of this width, the way ResponsiveGridLayout resolves it.
const layoutAt = (layouts: ReturnType<typeof buildLayouts>, width: number) => {
  const breakpoint = getBreakpointFromWidth(GRID_BREAKPOINTS, width);
  return findOrGenerateResponsiveLayout(
    layouts,
    GRID_BREAKPOINTS,
    breakpoint,
    breakpoint,
    isNarrowWidth(width) ? 1 : 12,
    noCompactor
  );
};

describe('buildLayouts', () => {
  // A layout lacking the spacer while its grid item is rendered makes RGL synthesize it at
  // {x: 0, y: 0, w: 1, h: 1}, which then blocks dragging a panel into the grid's top-left cell.
  it.each([1280, 1000, 997])(
    'wide edit mode keeps the spacer at its real position on a %ipx wide grid',
    (width) => {
      const layout = layoutAt(buildLayouts(true, PANELS, SPACER), width);

      expect(layout.map((item) => item.i)).toEqual(['a', 'b', '__spacer']);
      expect(layout.find((item) => item.i === '__spacer')).toMatchObject({x: 11, y: 7});
    }
  );

  it.each([996, 600, 320])(
    'narrow edit mode stacks the panels, resizable in height only, on a %ipx wide grid',
    (width) => {
      const layout = layoutAt(buildLayouts(true, PANELS, SPACER), width);

      expect(layout).toEqual([
        expect.objectContaining({i: 'a', x: 0, y: 0, w: 1, h: 2}),
        expect.objectContaining({i: 'b', x: 0, y: 2, w: 1, h: 2, minH: 1}),
      ]);
      for (const item of layout) {
        expect(item).toMatchObject({
          minW: 1,
          maxW: 1,
          resizeHandles: ['s'],
          isDraggable: false,
        });
      }
    }
  );

  it('leaves the spacer out of the wide edit layout when the grid passes none', () => {
    expect(buildLayouts(true, PANELS).lg?.map((item) => item.i)).toEqual(['a', 'b']);
  });

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

  it('stacks panels in reading order of the 12-col layout, not in the order they are passed', () => {
    const panels = [
      panel('bottom', {x: 0, y: 3, w: 12, h: 1}),
      panel('top-right', {x: 6, y: 0, w: 6, h: 3}),
      panel('top-left', {x: 0, y: 0, w: 6, h: 2}),
    ];

    expect(buildLayouts(false, panels, SPACER).sm?.map(({i, y}) => ({i, y}))).toEqual([
      {i: 'top-left', y: 0},
      {i: 'top-right', y: 2},
      {i: 'bottom', y: 5},
    ]);
  });

  it('stacks a panel at its stackedH, falling back to h when it has none', () => {
    const panels = [
      panel('a', {x: 0, y: 0, w: 6, h: 2, stackedH: 4}),
      panel('b', {x: 6, y: 0, w: 6, h: 2}),
    ];

    expect(buildLayouts(false, panels, SPACER).sm?.map(({i, y, h}) => ({i, y, h}))).toEqual([
      {i: 'a', y: 0, h: 4},
      {i: 'b', y: 4, h: 2},
    ]);
  });

  it('keeps h, not stackedH, in the 12-col layout', () => {
    const panels = [panel('a', {x: 0, y: 0, w: 6, h: 2, stackedH: 4})];

    expect(buildLayouts(false, panels, SPACER).lg).toMatchObject([{i: 'a', h: 2}]);
  });
});

describe('isNarrowWidth', () => {
  it.each([
    [1280, false],
    [997, false],
    [996, true],
    [320, true],
  ])('a %ipx wide grid is narrow: %s', (width, narrow) => {
    expect(isNarrowWidth(width)).toBe(narrow);
  });
});

describe('mapLayoutBack', () => {
  it('writes the grid position and size back, keeping the min constraints', () => {
    const items: LayoutItem[] = [
      {i: 'a', x: 0, y: 2, w: 6, h: 3},
      {i: 'b', x: 6, y: 0, w: 3, h: 1, minW: 2, minH: 1},
    ];

    expect(mapLayoutBack(PANELS, items, false)).toEqual([
      {id: 'a', layout: {x: 0, y: 2, w: 6, h: 3}},
      {id: 'b', layout: {x: 6, y: 0, w: 3, h: 1, minW: 2, minH: 1}},
    ]);
  });

  it('keeps the min constraints of the panel even when RGL reports none', () => {
    const items: LayoutItem[] = [{i: 'b', x: 0, y: 0, w: 4, h: 2}];

    expect(mapLayoutBack([PANELS[1]], items, false)).toEqual([
      {id: 'b', layout: {x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1}},
    ]);
  });

  it('leaves out the spacer and keeps a panel RGL did not report unchanged', () => {
    const items: LayoutItem[] = [{i: 'a', x: 0, y: 0, w: 4, h: 2}, SPACER];

    expect(mapLayoutBack(PANELS, items, false)).toEqual([
      {id: 'a', layout: {x: 0, y: 0, w: 4, h: 2}},
      {id: 'b', layout: PANELS[1].layout},
    ]);
  });

  describe('on a narrow grid', () => {
    const stacked = [
      panel('a', {x: 0, y: 0, w: 6, h: 2}),
      panel('b', {x: 6, y: 0, w: 6, h: 2, stackedH: 3}),
    ];

    it('writes only a resized height back, as stackedH, keeping x/y/w/h', () => {
      const items: LayoutItem[] = [
        {i: 'a', x: 0, y: 0, w: 1, h: 4},
        {i: 'b', x: 0, y: 4, w: 1, h: 1},
      ];

      expect(mapLayoutBack(stacked, items, true)).toEqual([
        {id: 'a', layout: {x: 0, y: 0, w: 6, h: 2, stackedH: 4}},
        {id: 'b', layout: {x: 6, y: 0, w: 6, h: 2, stackedH: 1}},
      ]);
    });

    // Otherwise the first layout change after mounting would pin every panel's stackedH to its h.
    it('keeps the layout of a panel whose stacked height did not change', () => {
      const items: LayoutItem[] = [
        {i: 'a', x: 0, y: 0, w: 1, h: 2},
        {i: 'b', x: 0, y: 2, w: 1, h: 3},
      ];

      expect(mapLayoutBack(stacked, items, true)).toEqual([
        {id: 'a', layout: stacked[0].layout},
        {id: 'b', layout: stacked[1].layout},
      ]);
    });
  });
});
