/**
 * How compactly the header renders the current view's actions, from roomiest to tightest:
 *
 * - `full` — labelled buttons, as many as the viewport-based budget allows;
 * - `iconOnly` — the same buttons without their labels (the label moves into a tooltip);
 * - `menu` — every action folded into the `⋮` overflow menu.
 */
export type HeaderActionsDensity = 'full' | 'iconOnly' | 'menu';

export const HEADER_ACTIONS_DENSITIES: readonly HeaderActionsDensity[] = [
  'full',
  'iconOnly',
  'menu',
];

/** One measurement of the header row, in CSS pixels. */
export interface HeaderRowMeasurement {
  /** Width the breadcrumb trail currently occupies. */
  trailWidth: number;
  /** Free space between the trail and the right-hand cluster — `0` once the trail is squeezed. */
  freeWidth: number;
  /** Width of the right-hand cluster (the actions plus the header's own icons). */
  actionsWidth: number;
}

export interface HeaderActionsCompactionOptions {
  /**
   * Room the trail is guaranteed before the actions compact: a trail that does not fit and is left
   * less than this compacts the actions one step.
   */
  minTrailWidth: number;
  /** Extra room required before a step is undone, so the header never flips back and forth. */
  hysteresis: number;
}

export interface HeaderActionsCompactionState {
  /** Index into {@link HEADER_ACTIONS_DENSITIES}. */
  level: number;
  /** Width each level freed when it was entered (`savings[level]`), measured, not estimated. */
  savings: Record<number, number>;
  /**
   * A step just taken, waiting for the actions to render at `level` before the row is measured
   * again. `compacting` steps record the width they freed; any step marks the cluster's next width
   * change as expected.
   */
  pending: {level: number; actionsWidth: number; compacting: boolean} | null;
  /** The cluster's width at the last measurement — `null` before the first one. */
  actionsWidth: number | null;
}

export const INITIAL_HEADER_ACTIONS_COMPACTION: HeaderActionsCompactionState = {
  level: 0,
  savings: {},
  pending: null,
  actionsWidth: null,
};

const MAX_LEVEL = HEADER_ACTIONS_DENSITIES.length - 1;

/**
 * Advances the header-actions compaction by one measurement. Pure — the measuring hook
 * (`useHeaderActionsCompaction`) owns the DOM and calls this on every resize of the header row,
 * once the actions have rendered at the current level.
 *
 * - **Compact** one step when the trail is squeezed (no free space left) *and* has less than
 *   `minTrailWidth` — a short trail that fits keeps full actions however narrow the header is.
 * - **Expand** one step only when the width that step freed (measured when it was taken) can be
 *   handed back without squeezing the trail again: either it fits into the free space, or the trail
 *   keeps at least `minTrailWidth` after giving it up. Both carry `hysteresis` on top, which is what
 *   keeps the two rules from undoing each other.
 * - **Start over** from `full` when the cluster changes width without a step — other actions (a
 *   different page) or a different viewport button budget. The recorded savings no longer describe
 *   it, so they are dropped and re-measured rather than trusted.
 */
export const stepHeaderActionsCompaction = (
  state: HeaderActionsCompactionState,
  measurement: HeaderRowMeasurement,
  {minTrailWidth, hysteresis}: HeaderActionsCompactionOptions
): HeaderActionsCompactionState => {
  const {trailWidth, freeWidth, actionsWidth} = measurement;
  const {level} = state;
  let {savings} = state;

  if (state.pending) {
    const {compacting, actionsWidth: before} = state.pending;
    if (compacting) savings = {...savings, [level]: Math.max(0, before - actionsWidth)};
  } else if (
    level > 0 &&
    state.actionsWidth !== null &&
    Math.abs(actionsWidth - state.actionsWidth) >= 1
  ) {
    return {
      level: 0,
      savings: {},
      pending: {level: 0, actionsWidth, compacting: false},
      actionsWidth,
    };
  }

  const available = trailWidth + freeWidth;
  const squeezed = freeWidth < 1 && available < minTrailWidth;

  if (squeezed && level < MAX_LEVEL) {
    const next = level + 1;
    return {
      level: next,
      savings,
      pending: {level: next, actionsWidth, compacting: true},
      actionsWidth,
    };
  }

  const saved = savings[level];
  if (level > 0 && saved !== undefined) {
    const fitsBack =
      freeWidth - saved >= hysteresis || available - saved >= minTrailWidth + hysteresis;
    if (fitsBack) {
      const next = level - 1;
      return {
        level: next,
        savings,
        pending: {level: next, actionsWidth, compacting: false},
        actionsWidth,
      };
    }
  }

  const unchanged =
    savings === state.savings && state.pending === null && actionsWidth === state.actionsWidth;
  return unchanged ? state : {level, savings, pending: null, actionsWidth};
};
