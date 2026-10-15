import React, {ReactNode} from 'react';
import {beforeAll, describe, expect, it} from 'vitest';
import {ThemeProvider, createTheme} from '@mui/material';
import {renderHook} from '@testing-library/react';
import {useOverflowCount} from '../useOverflowCount';

// jsdom ships no matchMedia; back it with a mutable viewport width so `useMediaQuery` (and hence
// `useOverflowCount`) resolves MUI's default breakpoints (sm 600 / md 900 / lg 1200 / xl 1536).
let viewportWidth = 1200;
const setViewport = (w: number) => {
  viewportWidth = w;
};

beforeAll(() => {
  window.matchMedia = (query: string): MediaQueryList => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    const matches = !min || viewportWidth >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
});

const theme = createTheme();
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);
const run = (options: Parameters<typeof useOverflowCount>[0]) =>
  renderHook(() => useOverflowCount(options), {wrapper}).result.current;

describe('useOverflowCount', () => {
  it('counts real items only — the ⋮ trigger is extra, never part of maxVisible', () => {
    setViewport(1200);
    // 5 items, room for 3 → 3 inline (NOT 2) + the trigger.
    expect(run({total: 5, maxVisible: 3})).toEqual({
      visibleCount: 3,
      iconOnly: false,
      hasOverflow: true,
    });
  });

  it('shows everything (no menu) when it fits, and when maxVisible is omitted', () => {
    setViewport(1200);
    expect(run({total: 3, maxVisible: 5})).toMatchObject({visibleCount: 3, hasOverflow: false});
    expect(run({total: 4})).toMatchObject({visibleCount: 4, hasOverflow: false});
  });

  it('allows an all-in-menu row when maxVisible=0 and minVisible=0', () => {
    setViewport(1200);
    expect(run({total: 4, maxVisible: 0, minVisible: 0})).toMatchObject({
      visibleCount: 0,
      hasOverflow: true,
    });
  });

  it('keeps at least minVisible inline (default 1) even at a tiny budget', () => {
    setViewport(1200);
    expect(run({total: 4, maxVisible: 0})).toMatchObject({visibleCount: 1, hasOverflow: true});
  });

  it('resolves a per-breakpoint maxVisible from the viewport', () => {
    const options = {total: 5, maxVisible: {xs: 1, md: 3}} as const;
    setViewport(500); // < md → xs value
    expect(run(options).visibleCount).toBe(1);
    setViewport(1000); // ≥ md → md value
    expect(run(options).visibleCount).toBe(3);
  });

  it('forces icon-only below the given breakpoint only', () => {
    const options = {total: 3, iconOnly: 'sm'} as const;
    setViewport(500); // < sm
    expect(run(options).iconOnly).toBe(true);
    setViewport(800); // ≥ sm
    expect(run(options).iconOnly).toBe(false);
  });

  it('never hides a single icon-only item — the trigger is the same width, so nothing is gained', () => {
    setViewport(1200);
    // 3 icon-only items, room for 2 → collapsing 1 into the ⋮ trigger buys back no space at all.
    expect(run({total: 3, maxVisible: 2, iconOnly: true})).toMatchObject({
      visibleCount: 3,
      hasOverflow: false,
    });
  });

  it('still collapses icon-only items when two or more would move into the menu', () => {
    setViewport(1200);
    // 3 icon-only items, room for 1 → the trigger replaces 2 items, which is a real saving.
    expect(run({total: 3, maxVisible: 1, iconOnly: true})).toMatchObject({
      visibleCount: 1,
      hasOverflow: true,
    });
  });

  it('still hides a single item when labels make it wider than the trigger', () => {
    setViewport(1200);
    // Same counts as above, but with labels (iconOnly: false) a lone item can be wider than the
    // trigger, so collapsing it is still worthwhile — the "no savings" rule is icon-only only.
    expect(run({total: 3, maxVisible: 2, iconOnly: false})).toMatchObject({
      visibleCount: 2,
      hasOverflow: true,
    });
  });
});
