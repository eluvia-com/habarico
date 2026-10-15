import React from 'react';
import {describe, expect, it} from 'vitest';
import {useInsidePanel} from '@design/contexts/InsidePanelContext';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import {ViewSidePanel} from '../ViewSidePanel';

const Probe = () => <span data-testid={'surface'}>{String(useInsidePanel())}</span>;

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

describe('ViewSidePanel', () => {
  // The panel shell is a `SidePanel`, not a `Panel`, so it declares the surface itself: its content
  // sits on the panel's own card and must not draw another one.
  it('declares its content as being inside a panel', () => {
    render(
      <ViewSidePanel onClose={() => undefined}>
        <Probe />
      </ViewSidePanel>,
      {wrapper}
    );

    expect(screen.getByTestId('surface').textContent).toBe('true');
  });
});
