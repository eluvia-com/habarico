import React, {ReactNode} from 'react';
import {CoreAdminContext, memoryStore} from 'react-admin';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {DENSITIES} from '@design/layouts/contexts/SettingsContext';
import {ThemeProvider, createTheme} from '@mui/material';
import {act, renderHook} from '@testing-library/react';
import {useAdminSettings} from '../useAdminSettings';

// jsdom ships no matchMedia. `useAdminSettings` itself only queries the density media query, but
// react-admin's own `useTheme` (aliased `useRaTheme`) also queries `(prefers-color-scheme: dark)` —
// keep that one fixed to light so it never interferes with the density assertions below.
//
// `matches` must be a live getter, not a value captured at call time: MUI's `useMediaQuery` memoizes
// the `MediaQueryList` per query string and re-reads `.matches` off that same object on every render
// (via `useSyncExternalStore`) rather than calling `matchMedia()` again — a plain object would freeze
// whatever `densityQueryMatches` was at the first render.
let densityQueryMatches = true;
beforeAll(() => {
  window.matchMedia = (query: string): MediaQueryList => {
    const mediaQueryList = {
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
    Object.defineProperty(mediaQueryList, 'matches', {
      get: () => (query.includes('prefers-color-scheme') ? false : densityQueryMatches),
    });
    return mediaQueryList as unknown as MediaQueryList;
  };
});

const theme = createTheme();
const wrapper = ({children}: {children: ReactNode}) => (
  <CoreAdminContext>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </CoreAdminContext>
);

// Renders the hook against a store already holding `value` under the density key, the way a
// browser's store holds whatever the app wrote into it the last time it ran.
const renderWithStoredDensity = (value: unknown) => {
  const store = memoryStore();
  store.setItem('preferences.layout.app.density', value);
  const rendered = renderHook(() => useAdminSettings(), {
    wrapper: ({children}: {children: ReactNode}) => (
      <CoreAdminContext store={store}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </CoreAdminContext>
    ),
  });
  return {store, ...rendered};
};

describe('useAdminSettings — density', () => {
  beforeEach(() => {
    document.body.className = '';
    densityQueryMatches = true;
  });

  it('reports densitySupported true on a desktop-class device', () => {
    densityQueryMatches = true;
    const {result} = renderHook(() => useAdminSettings(), {wrapper});
    expect(result.current.densitySupported).toBe(true);
  });

  it('reports densitySupported false on a phone-class device', () => {
    densityQueryMatches = false;
    const {result} = renderHook(() => useAdminSettings(), {wrapper});
    expect(result.current.densitySupported).toBe(false);
  });

  it('applies the stored density as a body class when the device supports it', () => {
    const {result} = renderHook(() => useAdminSettings(), {wrapper});

    act(() => result.current.setDensity('comfortable'));

    expect(document.body.classList.contains('density-comfortable')).toBe(true);
  });

  it.each(DENSITIES)('applies %s, a value that is still a density', (value) => {
    const {result} = renderWithStoredDensity(value);

    expect(result.current.density).toBe(value);
  });

  it('falls back to the default density when the stored value is not a density any more', () => {
    // `normal` was the middle value until 6.7.0 renamed it to `standard`, and it still sits in the
    // store of any browser that set it back then: the backend omits the key it deleted, and an app
    // that does not sync preferences never reads from a backend at all.
    const {result, store} = renderWithStoredDensity('normal');

    expect(result.current.density).toBe('standard');
    expect(document.body.classList.contains('density-standard')).toBe(true);
    expect(document.body.classList.contains('density-normal')).toBe(false);
    // the stored value is left alone - only an explicit choice overwrites it
    expect(store.getItem('preferences.layout.app.density')).toBe('normal');
  });

  it('locks the body to compact on an unsupported device without resetting the stored preference, and restores it when the device becomes supported again', () => {
    const {result, rerender} = renderHook(() => useAdminSettings(), {wrapper});

    act(() => result.current.setDensity('comfortable'));
    expect(document.body.classList.contains('density-comfortable')).toBe(true);

    densityQueryMatches = false;
    rerender();

    expect(document.body.classList.contains('density-comfortable')).toBe(false);
    expect(document.body.classList.contains('density-standard')).toBe(false);
    // the stored preference itself is untouched
    expect(result.current.density).toBe('comfortable');

    densityQueryMatches = true;
    rerender();

    expect(document.body.classList.contains('density-comfortable')).toBe(true);
  });
});
