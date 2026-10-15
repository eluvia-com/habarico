import React, {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {useSidePanelController} from '@admin/contexts/SidePanelContext';
import {render, screen} from '@testing-library/react';
import {ListShell} from '../ListShell';

// Reduce the React Admin `<List>` controller and the surrounding frame to pass-throughs, so the
// test exercises only what `ListShell` itself wires: the conditional `SidePanelProvider` mount and
// the `ListSurface` layout. The real `SidePanelProvider` is kept (that is what we assert on).
vi.mock('react-admin', () => ({
  List: ({children}: {children: ReactNode}) => <div>{children}</div>,
  InfiniteList: ({children}: {children: ReactNode}) => <div>{children}</div>,
  InfinitePagination: () => null,
  TopToolbar: ({children}: {children: ReactNode}) => <div>{children}</div>,
  ResourceContextProvider: ({children}: {children: ReactNode}) => <div>{children}</div>,
}));
vi.mock('@admin/contexts/ListConfigContext', () => ({
  ListConfigProvider: ({children}: {children: ReactNode}) => <div>{children}</div>,
}));
vi.mock('@admin/components/views/ViewContent', () => ({
  ViewContent: ({children}: {children: ReactNode}) => <div>{children}</div>,
}));
vi.mock('@admin/components/datagrid/DatagridActions', () => ({
  DatagridActions: () => null,
}));
vi.mock('@design/atoms/Scrollbar', () => ({
  ResponsiveScrollbar: ({children}: {children: ReactNode}) => <div>{children}</div>,
}));

// Probe reporting whether a `SidePanelProvider` is mounted above it.
const Probe = ({name}: {name: string}) => {
  const controller = useSidePanelController();
  return <div data-testid={name}>{controller ? 'has-controller' : 'no-controller'}</div>;
};

const listConfig = {
  preferenceKey: 'p',
  sort: {field: 'id', order: 'ASC' as const},
  filterDefaultValues: {},
  filters: [],
};

describe('ListShell', () => {
  it('mounts a SidePanelProvider (controller available) when a side panel is passed', () => {
    render(
      <ListShell listConfig={listConfig} sidePanel={<Probe name="panel" />}>
        <Probe name="list" />
      </ListShell>
    );
    // Both the list body and the docked panel see one shared controller.
    expect(screen.getByTestId('panel')).toHaveTextContent('has-controller');
    expect(screen.getByTestId('list')).toHaveTextContent('has-controller');
  });

  it('does not mount a SidePanelProvider (controller absent) without a side panel', () => {
    render(
      <ListShell listConfig={listConfig}>
        <Probe name="list" />
      </ListShell>
    );
    // No provider → `useSidePanelController` is undefined, preserving the dialog fallback.
    expect(screen.getByTestId('list')).toHaveTextContent('no-controller');
  });
});
