import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {useInsidePanel} from '@design/contexts/InsidePanelContext';
import {Panel} from '@design/molecules/Panel';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {ReadOnlyBoxProvider, useIsReadOnly} from '@schema/contexts/ReadOnlyBoxContext';
import {render, screen} from '@testing-library/react';
import {ResetBoxProvider} from '../ResetBoxProvider';

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: false}),
}));

// Reads the surface flag the boxes below the reset would see.
const Probe = () => <span data-testid={'surface'}>{String(useInsidePanel())}</span>;

const ReadOnlyProbe = () => <span data-testid={'read-only'}>{String(useIsReadOnly())}</span>;

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

const surface = () => screen.getByTestId('surface').textContent;

describe('ResetBoxProvider', () => {
  it('reports a page surface when nothing above declares a card', () => {
    render(
      <ResetBoxProvider>
        <Probe />
      </ResetBoxProvider>,
      {wrapper}
    );

    expect(surface()).toBe('false');
  });

  // The reset drops the box-layout contexts a view must not inherit, but the surface flag is the
  // surrounding surface's statement: a view rendered inside a card (a dashboard widget) stays
  // inside it, so its first box draws no card of its own.
  it('keeps the surface flag of an enclosing Panel', () => {
    render(
      <Panel>
        <ResetBoxProvider>
          <Probe />
        </ResetBoxProvider>
      </Panel>,
      {wrapper}
    );

    expect(surface()).toBe('true');
  });

  // A show view's boxes are read-only, and a dialog opened from a button inside one of them
  // inherits the scope through the portal; the view in the dialog must start writeable.
  it('drops the read-only scope of an enclosing box', () => {
    render(
      <ReadOnlyBoxProvider readOnly>
        <ResetBoxProvider>
          <ReadOnlyProbe />
        </ResetBoxProvider>
      </ReadOnlyBoxProvider>,
      {wrapper}
    );

    expect(screen.getByTestId('read-only').textContent).toBe('false');
  });
});
