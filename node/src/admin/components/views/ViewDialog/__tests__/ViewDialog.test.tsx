import React from 'react';
import {describe, expect, it} from 'vitest';
import {SidePanelProvider, useSidePanelController} from '@admin/contexts/SidePanelContext';
import {useInsidePanel} from '@design/contexts/InsidePanelContext';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import {ViewDialog} from '../ViewDialog';

const Probe = () => <span data-testid={'surface'}>{String(useInsidePanel())}</span>;

// Reports whether a docked side panel is reachable from where it is rendered.
const PanelProbe = () => {
  const controller = useSidePanelController();
  return <span data-testid={'panel'}>{controller ? 'reachable' : 'none'}</span>;
};

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

describe('ViewDialog', () => {
  // The dialog's Paper is the card its content sits on, so the dialog declares the surface itself
  // — a view rendered inside must not draw a card of its own on top of it.
  it('declares its content as being inside a panel', () => {
    render(
      <ViewDialog open>
        <Probe />
      </ViewDialog>,
      {wrapper}
    );

    expect(screen.getByTestId('surface').textContent).toBe('true');
  });
});

describe('ViewDialog - the docked side panel does not reach into the dialog', () => {
  it('hides the surrounding list panel from its content', () => {
    // A dialog opened from a list sits *above* it: the panel belongs to that list, so docking a
    // view into it from inside the dialog fills another surface's panel and leaves the dialog
    // stacked over it, out of sight.
    render(
      <SidePanelProvider>
        <ViewDialog open>
          <PanelProbe />
        </ViewDialog>
      </SidePanelProvider>,
      {wrapper}
    );

    expect(screen.getByTestId('panel').textContent).toBe('none');
  });

  it('lets its content mount a panel of its own', () => {
    // A full list rendered in the dialog brings its own provider (see `ListShell`) and that panel
    // is the dialog's own, so it must stay reachable.
    render(
      <SidePanelProvider>
        <ViewDialog open>
          <SidePanelProvider>
            <PanelProbe />
          </SidePanelProvider>
        </ViewDialog>
      </SidePanelProvider>,
      {wrapper}
    );

    expect(screen.getByTestId('panel').textContent).toBe('reachable');
  });
});
