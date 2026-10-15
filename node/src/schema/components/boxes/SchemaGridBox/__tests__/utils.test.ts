import {describe, expect, it} from 'vitest';
import {BoxSchema, FieldDescriptor} from '@schema/types';
import {
  type CellLayout,
  type PanelColumns,
  cellPaddingPx,
  computeAutoSpans,
  computeLabelWidth,
  partitionCells,
  pickReference,
  resolveCellSpans,
} from '../utils';

const box = (name: string, over: Partial<BoxSchema> = {}): BoxSchema => ({
  name,
  type: 'simple',
  readOnly: false,
  ...over,
});

const field = (name: string): FieldDescriptor => ({type: 'field', name});

const cols = (value: number): PanelColumns => ({
  xs: value,
  sm: value,
  md: value,
  lg: value,
  xl: value,
});

// The grid a `PanelGrid` renders into by default, and the gap it uses (`spacing(1)` = 8px).
const TWELVE = cols(12);
const GAP = 8;
// `PanelContent`'s `medium` padding on both sides: 2 * spacing(2) = 32px.
const CARD_PADDING = 32;

describe('partitionCells', () => {
  it('groups a run of consecutive fields into a single cell', () => {
    expect(partitionCells([field('a'), field('b'), field('c')])).toEqual([
      {kind: 'fields', fields: [field('a'), field('b'), field('c')]},
    ]);
  });

  it('gives every nested box a cell of its own', () => {
    const first = box('one');
    const second = box('two');

    expect(partitionCells([first, second])).toEqual([
      {kind: 'box', box: first},
      {kind: 'box', box: second},
    ]);
  });

  // A box between two field runs breaks the run: the fields after it start a new PropertyList
  // rather than joining the one before, which is what keeps schema order on screen.
  it('starts a new field cell after an interleaved box', () => {
    const nested = box('nested');

    expect(partitionCells([field('a'), nested, field('b')])).toEqual([
      {kind: 'fields', fields: [field('a')]},
      {kind: 'box', box: nested},
      {kind: 'fields', fields: [field('b')]},
    ]);
  });
});

describe('computeAutoSpans', () => {
  it('returns no spans at all when the cells carry their own', () => {
    expect(computeAutoSpans(TWELVE, 3, false)).toEqual({});
  });

  it('splits the parent evenly, capped at 4/3/2/1 columns per breakpoint', () => {
    expect(computeAutoSpans(TWELVE, 4, true)).toEqual({xl: 3, lg: 4, md: 6, sm: 12, xs: 12});
  });

  // The per-breakpoint floors (2 on xl, 3 elsewhere) stop a many-celled box from slicing itself
  // into unreadably narrow columns.
  it('applies the floor rather than dividing indefinitely', () => {
    expect(computeAutoSpans(TWELVE, 12, true)).toEqual({xl: 3, lg: 4, md: 6, sm: 12, xs: 12});
  });

  // Nested grids shrink the parent count, and the floor then clamps the split — at 6 columns a
  // floor of 3 is already half the row, so children stop dividing further.
  it('clamps to the floor once the parent itself is narrow', () => {
    expect(computeAutoSpans(cols(6), 4, true)).toEqual({xl: 2, lg: 3, md: 3, sm: 6, xs: 6});
  });
});

describe('resolveCellSpans', () => {
  it('falls back to a full row when neither the box nor the grid sets a span', () => {
    expect(resolveCellSpans({})).toEqual(cols(12));
  });

  // Mirrors `PanelGridItem`'s own defaulting: each breakpoint inherits the one below it.
  it('cascades an omitted breakpoint up from the one below', () => {
    expect(resolveCellSpans({xs: 12, md: 6})).toEqual({xs: 12, sm: 12, md: 6, lg: 6, xl: 6});
  });

  it("prefers the box's own gridItem over the auto-computed span", () => {
    expect(resolveCellSpans({xs: 12, md: 6}, {xs: 12, md: 4})).toEqual({
      xs: 12,
      sm: 12,
      md: 4,
      lg: 4,
      xl: 4,
    });
  });
});

describe('cellPaddingPx', () => {
  it('reports none for a field cell, which renders its PropertyList with no wrapper', () => {
    expect(cellPaddingPx(undefined, CARD_PADDING)).toBe(0);
  });

  it('reports none for a bare box that draws no card', () => {
    expect(cellPaddingPx(box('bare'), CARD_PADDING)).toBe(0);
  });

  it.each([
    ['label', {label: 'Address'}],
    ['card', {card: true}],
    ['collapsible', {collapsible: 'open' as const}],
  ])('reports the card gutter for a box that draws a card via %s', (_reason, over) => {
    expect(cellPaddingPx(box('carded', over), CARD_PADDING)).toBe(CARD_PADDING);
  });

  // A collection box is full-bleed: `useBoxLayout` drops its gutter even when it draws a card.
  it.each(['list', 'array', 'gallery'] as const)('reports none for a full-bleed %s box', (type) => {
    expect(cellPaddingPx(box('collection', {type, card: true}), CARD_PADDING)).toBe(0);
  });
});

describe('pickReference', () => {
  it('picks the narrowest md span as the cell everything else aligns to', () => {
    const wide: CellLayout = {span: cols(12), paddingPx: 0};
    const narrow: CellLayout = {span: cols(4), paddingPx: 0};
    const middle: CellLayout = {span: cols(6), paddingPx: 0};

    expect(pickReference([wide, narrow, middle])).toBe(narrow);
  });

  it('keeps the first of equally narrow cells', () => {
    const first: CellLayout = {span: cols(6), paddingPx: 0};
    const second: CellLayout = {span: cols(6), paddingPx: 32};

    expect(pickReference([first, second])).toBe(first);
  });
});

describe('computeLabelWidth', () => {
  const half: CellLayout = {span: {xs: 12, sm: 12, md: 6, lg: 6, xl: 6}, paddingPx: CARD_PADDING};
  const full: CellLayout = {span: cols(12), paddingPx: CARD_PADDING};

  it('scales nothing when a cell already matches the reference', () => {
    expect(computeLabelWidth(half, half, TWELVE, GAP)).toBeUndefined();
  });

  // The anchor case, and the one the `MixedWidthLabels` story renders: a full-row cell beside
  // half-width ones. The measured value column in that story starts at the same pixel as its
  // half-width siblings, so this string is checked against a real rendering, not just the algebra.
  it('scales a full-row cell down so its label boundary meets the half-width reference', () => {
    expect(computeLabelWidth(half, full, TWELVE, GAP)).toEqual({
      xs: '40%',
      sm: '40%',
      md: 'calc(20% - 8px)',
      lg: 'calc(20% - 8px)',
      xl: 'calc(20% - 8px)',
    });
  });

  // An omitted breakpoint would leave the label with no `flex` at all there — the browser's flex
  // initial value, not the component's 40% default — so every breakpoint is emitted once any one
  // of them needs scaling.
  it('emits every breakpoint, including those that need no scaling', () => {
    const result = computeLabelWidth(half, full, TWELVE, GAP);

    expect(Object.keys(result ?? {})).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  // Equal spans still misalign when one cell sits in a padded card and the other does not, so
  // padding alone has to trigger the correction.
  it('scales on a padding difference alone, with the spans identical', () => {
    const padded: CellLayout = {span: cols(6), paddingPx: CARD_PADDING};
    const bare: CellLayout = {span: cols(6), paddingPx: 0};

    expect(computeLabelWidth(padded, bare, TWELVE, GAP)).toEqual({
      xs: 'calc(40% - 12.8px)',
      sm: 'calc(40% - 12.8px)',
      md: 'calc(40% - 12.8px)',
      lg: 'calc(40% - 12.8px)',
      xl: 'calc(40% - 12.8px)',
    });
  });

  // The container's own width cancels out of the correction algebraically: only the parent's
  // column count and the gap enter the formula. A half-vs-full pair therefore yields the very same
  // value in a nested 6-column grid as it does in the 12-column one above, even though every
  // rendered pixel width differs.
  it('depends on the column ratio, not on any rendered width', () => {
    const nestedHalf: CellLayout = {span: cols(3), paddingPx: CARD_PADDING};
    const nestedFull: CellLayout = {span: cols(6), paddingPx: CARD_PADDING};

    expect(computeLabelWidth(nestedHalf, nestedFull, cols(6), GAP)).toEqual({
      xs: 'calc(20% - 8px)',
      sm: 'calc(20% - 8px)',
      md: 'calc(20% - 8px)',
      lg: 'calc(20% - 8px)',
      xl: 'calc(20% - 8px)',
    });
  });
});
