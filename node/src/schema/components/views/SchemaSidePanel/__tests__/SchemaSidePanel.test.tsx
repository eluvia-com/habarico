import React, {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {SidePanelView} from '@schema/types';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SchemaSidePanel} from '../SchemaSidePanel';

// The panel composes the design-layer `SidePanel` (a `nested` `Panel`), which reads theme tokens
// (`theme.radius`), so the tree needs the design theme in context.
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

// Replace the heavy view router with a marker exposing the params it received. The panel supplies
// its surface through the `ViewPresentationContext` it provides, so the marker reads `presentation`
// from that context to prove the panel marks its surface as an overlay (`'panel'`, not `'page'`).
vi.mock('../../SchemaViewRouter', async () => {
  const {useViewPresentation} = await import('@admin/contexts/ViewPresentationContext');
  return {
    SchemaViewRouter: (props: {viewName: string; id?: number}) => {
      const {presentation} = useViewPresentation();
      return (
        <div data-testid="router">
          {props.viewName}:{String(props.id)}:{String(presentation !== 'page')}
        </div>
      );
    },
  };
});

const view: SidePanelView = {
  resource: 'svc/res',
  viewType: 'show',
  viewName: 'show',
  id: 5,
};

describe('SchemaSidePanel', () => {
  it('renders the target view in place (in-dialog mode)', () => {
    render(<SchemaSidePanel view={view} onClose={vi.fn()} />, {wrapper});
    expect(screen.getByTestId('router')).toHaveTextContent('show:5:true');
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<SchemaSidePanel view={view} onClose={onClose} />, {wrapper});

    await userEvent.setup().click(screen.getByRole('button', {name: /close/i}));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
