import type {PropertyLabelWidthBreakpoints} from '@design/molecules/PropertyItem';
import {FULL_BLEED_TYPES} from '@schema/components/boxes/BoxLayout';
import {BoxItem, BoxSchema, FieldDescriptor} from '@schema/types';
import {isBoxSchema} from '@schema/utils/api';
import {DEFAULT_LABEL_PERCENT, LABEL_WIDTH_BREAKPOINTS} from './constants';

// A grid cell is either a run of consecutive field descriptors (→ one PropertyList) or a nested box.
export type GridCell = {kind: 'fields'; fields: FieldDescriptor[]} | {kind: 'box'; box: BoxSchema};

export type GridSpans = {xs?: number; sm?: number; md?: number; lg?: number; xl?: number};

export type PanelColumns = {xs: number; sm: number; md: number; lg: number; xl: number};

// Group consecutive field descriptors into one PropertyList cell; each nested box is its own cell.
export const partitionCells = (items: BoxItem[]): GridCell[] => {
  const cells: GridCell[] = [];
  for (const item of items) {
    if (isBoxSchema(item)) {
      cells.push({kind: 'box', box: item});
      continue;
    }
    const last = cells[cells.length - 1];
    if (last?.kind === 'fields') {
      last.fields.push(item);
    } else {
      cells.push({kind: 'fields', fields: [item]});
    }
  }
  return cells;
};

// Whether the grid computes the spans of its cells itself. A cell opts the whole grid out by
// carrying an explicit `gridItem` — a placement any box type may have (HAB-963), so this is read
// from the placement rather than from the box's type. A field descriptor never carries one.
export const shouldAutoComputeSpans = (items: BoxItem[]): boolean =>
  items.every((item) => !(isBoxSchema(item) && item.gridItem));

// Auto-computed responsive spans (up to 4/3/2/1 columns), splitting the parent's 12-col grid across
// the cells — mirrors the legacy default. Returns empty spans when the cells set them themselves.
export const computeAutoSpans = (
  parentColumns: PanelColumns,
  cellCount: number,
  autoCompute: boolean
): GridSpans => {
  if (!autoCompute) return {};
  const span = (parentCols: number, maxCols: number, floor: number) =>
    Math.max(Math.floor(parentCols / Math.min(maxCols, cellCount)), floor);
  return {
    xl: span(parentColumns.xl, 4, 2),
    lg: span(parentColumns.lg, 3, 3),
    md: span(parentColumns.md, 2, 3),
    sm: span(parentColumns.sm, 1, 3),
    xs: span(parentColumns.xs, 1, 3),
  };
};

// Resolve a cell's actually-rendered span at every breakpoint: its own `gridItem` override where
// set, else the box's auto-computed span, cascading exactly like `PanelGridItem`'s own defaults
// (`xs = 12, sm = xs, md = sm, lg = md, xl = lg`) — mirrored here because `computeAutoSpans`
// returns `{}` for every breakpoint as soon as *any* cell in the box carries its own `gridItem`
// (mixing auto and explicit spans), so `xs/sm/md/lg/xl` can't be used as a reference width alone.
export const resolveCellSpans = (autoSpans: GridSpans, gridItem?: GridSpans): PanelColumns => {
  const xs = gridItem?.xs || autoSpans.xs || 12;
  const sm = gridItem?.sm || autoSpans.sm || xs;
  const md = gridItem?.md || autoSpans.md || sm;
  const lg = gridItem?.lg || autoSpans.lg || md;
  const xl = gridItem?.xl || autoSpans.xl || lg;
  return {xs, sm, md, lg, xl};
};

// A cell's actual content width isn't purely proportional to its span: a nested box's own
// `BoxLayout` may wrap it in a padded card (`PanelContent`, `medium` padding) or a padding-less
// bare section (`SectionContent` has none), and `PanelGrid`'s own column gap only applies between
// cells sharing a row — both fixed px amounts that don't scale with the cell's span. `paddingPx`
// captures the former; the latter is folded in separately in `computeLabelWidth` below (it depends
// on `parentColumns`, which isn't known per-cell).
export type CellLayout = {span: PanelColumns; paddingPx: number};

// Mirrors the same `card` decision `useBoxCard` makes, plus `useBoxLayout`'s full-bleed override
// (a `list`/`array`/`gallery` box is always padding-less regardless of `card`). Only accounts for
// the cell's *own* `BoxLayout` wrapper — a box nested another level deeper won't be reflected here.
export const cellPaddingPx = (box: BoxSchema | undefined, mediumPaddingPx: number): number => {
  if (!box) return 0; // a `{kind: 'fields'}` cell renders its `PropertyList` directly, no wrapper
  const hasCard = Boolean(box.label || box.card || box.collapsible || box.toolbarActions?.length);
  if (!hasCard || FULL_BLEED_TYPES.includes(box.type)) return 0;
  return mediumPaddingPx;
};

// The fixed-px part of MUI Grid v2's own width formula for a `span`-wide item out of `parentCols`
// columns with a `gapPx` column gap: `100% * span/parentCols - (parentCols - span) * (gapPx /
// parentCols)`. The `100% * span/parentCols` part scales with the container's own (unknown) width;
// this is just the part that doesn't.
const gridGapFixedPx = (span: number, parentCols: number, gapPx: number): number =>
  ((parentCols - span) * gapPx) / parentCols;

// Pick one cell to align every other cell's label against: the one with the narrowest `md` span
// (`md` is the breakpoint schema-driven `gridItem` overrides are set at in practice).
export const pickReference = (layouts: CellLayout[]): CellLayout =>
  layouts.reduce((narrowest, layout) => (layout.span.md < narrowest.span.md ? layout : narrowest));

const round = (value: number): number => Math.round(value * 100) / 100;

// A cell whose actual content width differs from the reference cell's — wider span, different
// padding, or both — gets a scaled `labelWidth` so its label/value boundary still lines up with
// the reference. `PropertyItem`'s default `labelWidth` is a % of its own rendered width, which
// tracks the reference exactly only when there's no padding/gap involved — with fixed-px padding
// and grid gaps in the mix, the relationship between a cell's span and its actual pixel width is
// *affine* (proportional term + a fixed offset), not purely proportional, so a plain percentage
// can only get close. `calc(percent% + pxCorrection)` corrects for the fixed offset exactly, for
// any actual container width — the container's own width cancels out of the correction
// algebraically, so this holds whether the box renders full-page or inside a narrow dialog.
export const computeLabelWidth = (
  reference: CellLayout,
  own: CellLayout,
  parentColumns: PanelColumns,
  gapPx: number
): PropertyLabelWidthBreakpoints | undefined => {
  const needsScaling =
    own.paddingPx !== reference.paddingPx ||
    LABEL_WIDTH_BREAKPOINTS.some(
      (breakpoint) => own.span[breakpoint] !== reference.span[breakpoint]
    );
  if (!needsScaling) return undefined;

  // Once any breakpoint needs scaling, every breakpoint must be set explicitly: a responsive `sx`
  // object only emits a rule for the keys it's given, so an omitted breakpoint would leave the
  // label with no `flex` value at all there (falling back to the browser's flex initial value)
  // instead of the component's own 40% default.
  const result = {} as PropertyLabelWidthBreakpoints;
  for (const breakpoint of LABEL_WIDTH_BREAKPOINTS) {
    const refSpan = reference.span[breakpoint];
    const ownSpan = own.span[breakpoint];
    if (ownSpan === refSpan && own.paddingPx === reference.paddingPx) {
      result[breakpoint] = `${DEFAULT_LABEL_PERCENT}%`;
      continue;
    }
    const parentCols = parentColumns[breakpoint];
    const percent = (DEFAULT_LABEL_PERCENT * refSpan) / ownSpan;
    const refFixedPx = gridGapFixedPx(refSpan, parentCols, gapPx) + reference.paddingPx;
    const ownFixedPx = gridGapFixedPx(ownSpan, parentCols, gapPx) + own.paddingPx;
    const pxCorrection = (percent / 100) * ownFixedPx - (DEFAULT_LABEL_PERCENT / 100) * refFixedPx;
    const sign = pxCorrection >= 0 ? '+' : '-';
    result[breakpoint] = `calc(${round(percent)}% ${sign} ${Math.abs(round(pxCorrection))}px)`;
  }
  return result;
};
