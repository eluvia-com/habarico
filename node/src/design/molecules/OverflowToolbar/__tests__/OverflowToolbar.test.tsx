import React, {ReactNode} from 'react';
import {beforeAll, describe, expect, it} from 'vitest';
import {ThemeProvider, createTheme} from '@mui/material';
import {fireEvent, render, screen} from '@testing-library/react';
import {OverflowToolbar} from '../OverflowToolbar';

// `useOverflowCount` calls `useMediaQuery`; jsdom has no matchMedia. A fixed wide viewport is enough —
// these tests drive overflow through the numeric `maxVisible` prop, not the breakpoints.
beforeAll(() => {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
});

const theme = createTheme();
const Toolbar = ({maxVisible}: {maxVisible: number}): ReactNode => (
  <ThemeProvider theme={theme}>
    <OverflowToolbar maxVisible={maxVisible}>
      <button>One</button>
      <button>Two</button>
      <button>Three</button>
    </OverflowToolbar>
  </ThemeProvider>
);

describe('OverflowToolbar', () => {
  it('closes the ⋮ menu when a widening removes the overflow, so it cannot reopen anchorless', () => {
    const {rerender} = render(<Toolbar maxVisible={1} />); // 3 > 1 → overflow, ⋮ shown

    fireEvent.click(screen.getByRole('button', {name: 'More'}));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Widen so nothing overflows: the trigger + menu unmount while the menu was open.
    rerender(<Toolbar maxVisible={5} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Narrow again: the menu must stay closed (it was reset), not reopen against a stale anchor.
    rerender(<Toolbar maxVisible={1} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
