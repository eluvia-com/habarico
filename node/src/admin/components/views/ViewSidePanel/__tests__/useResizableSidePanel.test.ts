import {describe, expect, it} from 'vitest';
import {SIDE_PANEL_LIST_MIN_WIDTH, SIDE_PANEL_MIN_WIDTH} from '../constants';
import {clampSidePanelWidth} from '../useResizableSidePanel';

const CONTAINER = 2000;
const maxForContainer = CONTAINER - SIDE_PANEL_LIST_MIN_WIDTH;

describe('clampSidePanelWidth', () => {
  it('keeps a width that is within bounds', () => {
    expect(clampSidePanelWidth(600, CONTAINER)).toBe(600);
  });

  it('floors at the panel minimum', () => {
    expect(clampSidePanelWidth(SIDE_PANEL_MIN_WIDTH - 100, CONTAINER)).toBe(SIDE_PANEL_MIN_WIDTH);
  });

  it('caps so the list keeps its minimum width', () => {
    expect(clampSidePanelWidth(CONTAINER, CONTAINER)).toBe(maxForContainer);
  });

  it('lets the panel minimum win when the container is too narrow for both', () => {
    // container - LIST_MIN would be below the panel minimum here
    const narrow = SIDE_PANEL_MIN_WIDTH + SIDE_PANEL_LIST_MIN_WIDTH - 100;
    expect(clampSidePanelWidth(9999, narrow)).toBe(SIDE_PANEL_MIN_WIDTH);
  });
});
