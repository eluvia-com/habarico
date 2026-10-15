import {describe, expect, it} from 'vitest';
import {
  HEADER_ACTIONS_DENSITIES,
  HeaderActionsCompactionState,
  HeaderRowMeasurement,
  INITIAL_HEADER_ACTIONS_COMPACTION,
  stepHeaderActionsCompaction,
} from '../headerActionsDensity';

const OPTIONS = {minTrailWidth: 320, hysteresis: 16};

const step = (state: HeaderActionsCompactionState, measurement: HeaderRowMeasurement) =>
  stepHeaderActionsCompaction(state, measurement, OPTIONS);

const density = (state: HeaderActionsCompactionState) => HEADER_ACTIONS_DENSITIES[state.level];

describe('stepHeaderActionsCompaction', () => {
  it('keeps full actions while the trail fits, however little room is left', () => {
    const state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 120,
      freeWidth: 40,
      actionsWidth: 500,
    });

    expect(density(state)).toBe('full');
  });

  it('keeps full actions when a squeezed trail still has the minimum width', () => {
    const state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 400,
      freeWidth: 0,
      actionsWidth: 500,
    });

    expect(density(state)).toBe('full');
  });

  it('goes icon-only when a squeezed trail drops below the minimum width', () => {
    const state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });

    expect(density(state)).toBe('iconOnly');
    expect(state.pending).toEqual({level: 1, actionsWidth: 500, compacting: true});
  });

  it('records the width a step freed on the next measurement', () => {
    const compacted = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    const measured = step(compacted, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});

    expect(density(measured)).toBe('iconOnly');
    expect(measured.savings[1]).toBe(150);
    expect(measured.pending).toBeNull();
  });

  it('folds everything into the menu when icon-only is still not enough', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 100,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 200, freeWidth: 0, actionsWidth: 400});

    expect(density(state)).toBe('menu');
  });

  it('stays at the menu, the tightest density, while the trail is squeezed', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 50,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 100, freeWidth: 0, actionsWidth: 450});
    state = step(state, {trailWidth: 150, freeWidth: 0, actionsWidth: 400});

    expect(density(state)).toBe('menu');
  });

  it('does not undo a step that only just made room', () => {
    const compacted = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    // The 150px the labels freed went to the trail (250 → 400): handing them back would squeeze
    // it under the minimum again, so the density must hold.
    const measured = step(compacted, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});
    const again = step(measured, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});

    expect(density(again)).toBe('iconOnly');
    expect(again).toBe(measured);
  });

  it('expands back once the freed width fits into the free space', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});
    // The trail got shorter (another page) — 200px free now covers the 150px the labels need.
    state = step(state, {trailWidth: 200, freeWidth: 200, actionsWidth: 350});

    expect(density(state)).toBe('full');
  });

  it('expands back when the trail keeps the minimum width after giving the room up', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});
    // The window widened: the trail is still truncated, but would keep 640 - 150 = 490px.
    state = step(state, {trailWidth: 640, freeWidth: 0, actionsWidth: 350});

    expect(density(state)).toBe('full');
  });

  it('does not expand within the hysteresis margin', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});
    state = step(state, {trailWidth: 480, freeWidth: 0, actionsWidth: 350});

    expect(density(state)).toBe('iconOnly');
  });

  it('keeps compacting when a step freed no width', () => {
    const compacted = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    // A step that freed nothing (e.g. actions that ignore the density) is recorded as 0 and is
    // only undone once the trail has room on its own.
    const measured = step(compacted, {trailWidth: 250, freeWidth: 0, actionsWidth: 500});

    expect(measured.savings[1]).toBe(0);
    expect(density(measured)).toBe('menu');
  });

  it('starts over from full when the actions change width without a step', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});
    // Fewer actions now (another page, or a smaller viewport button budget): the 150px recorded
    // for the labels no longer applies, so the density is re-derived from full.
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 300});

    expect(density(state)).toBe('full');
    expect(state.savings).toEqual({});
    expect(state.pending).toEqual({level: 0, actionsWidth: 300, compacting: false});
  });

  it('re-compacts after starting over when the trail is still squeezed', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 250,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 350});
    state = step(state, {trailWidth: 400, freeWidth: 0, actionsWidth: 300});
    // Rendered at full again: the labels are back and the trail is squeezed once more.
    state = step(state, {trailWidth: 200, freeWidth: 0, actionsWidth: 480});

    expect(density(state)).toBe('iconOnly');
  });

  it('expects the width change of its own expansion', () => {
    let state = step(INITIAL_HEADER_ACTIONS_COMPACTION, {
      trailWidth: 50,
      freeWidth: 0,
      actionsWidth: 500,
    });
    state = step(state, {trailWidth: 100, freeWidth: 0, actionsWidth: 450});
    state = step(state, {trailWidth: 150, freeWidth: 0, actionsWidth: 400});
    expect(density(state)).toBe('menu');
    // Plenty of room: expanding to icon-only grows the cluster by the 50px recorded for the menu —
    // a change the step itself made, so it must not count as a new set of actions.
    state = step(state, {trailWidth: 300, freeWidth: 600, actionsWidth: 400});
    expect(density(state)).toBe('iconOnly');
    state = step(state, {trailWidth: 300, freeWidth: 550, actionsWidth: 450});

    expect(density(state)).toBe('full');
    expect(state.savings).toEqual({1: 50, 2: 50});
  });

  it('returns the same state when nothing changes', () => {
    const measurement = {trailWidth: 120, freeWidth: 40, actionsWidth: 500};
    const state = step(INITIAL_HEADER_ACTIONS_COMPACTION, measurement);

    expect(step(state, measurement)).toBe(state);
  });
});
