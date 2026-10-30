import React, {useEffect, useMemo} from 'react';
import {CoreLayoutProps, LayoutComponent as LayoutComponentType} from 'react-admin';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SchemaLayoutBindingContext} from '../SchemaLayoutBindingContext';
import {SchemaLayoutWithSlots} from '../SchemaLayoutWithSlots';
import {ExtraMenuItem} from '../types';

const onMount = vi.fn();

// Stands in for an open form: it reports every mount, so a remount of the layout shows up as a
// second call even when the rendered output looks unchanged.
const FormUnderEdit = () => {
  useEffect(() => {
    onMount();
  }, []);
  return <input aria-label="Product name" defaultValue="" />;
};

type FakeLayoutProps = CoreLayoutProps & {extraMenuItems?: ExtraMenuItem[]};

const FakeLayout = ({children, extraMenuItems}: FakeLayoutProps) => (
  <div>
    <nav data-testid="menu">{(extraMenuItems ?? []).map((item) => item.key).join(',')}</nav>
    {children}
  </div>
);

const OtherFakeLayout = ({children}: FakeLayoutProps) => (
  <div>
    <nav data-testid="menu">other shell</nav>
    {children}
  </div>
);

type AdminProps = {
  extraMenuItems?: ExtraMenuItem[];
  LayoutComponent?: LayoutComponentType;
};

// Mirrors what `SchemaAdminRuntime` does: the binding is memoized on the slots, and the component
// handed to `<AdminUI layout>` is the module-level `SchemaLayoutWithSlots`.
const Admin = ({
  extraMenuItems,
  LayoutComponent = FakeLayout as LayoutComponentType,
}: AdminProps) => {
  const binding = useMemo(
    () => ({LayoutComponent, extraMenuItems}),
    [LayoutComponent, extraMenuItems]
  );

  return (
    <SchemaLayoutBindingContext.Provider value={binding}>
      <SchemaLayoutWithSlots>
        <FormUnderEdit />
      </SchemaLayoutWithSlots>
    </SchemaLayoutBindingContext.Provider>
  );
};

describe('SchemaLayoutWithSlots', () => {
  beforeEach(() => {
    onMount.mockClear();
  });

  it('keeps the open form mounted when extraMenuItems arrives as a new reference', async () => {
    const user = userEvent.setup();
    const {rerender} = render(<Admin extraMenuItems={[{key: 'reports', title: 'Reports'}]} />);
    expect(onMount).toHaveBeenCalledTimes(1);

    const input = screen.getByLabelText('Product name');
    await user.type(input, 'Espresso machine');

    // An application passing the array inline hands us an equal but fresh one on every render —
    // e.g. because an auth token refresh re-rendered the page holding `SchemaAdmin`.
    rerender(<Admin extraMenuItems={[{key: 'reports', title: 'Reports'}]} />);

    expect(onMount).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Product name')).toHaveValue('Espresso machine');
  });

  it('updates the menu when the contents change, without remounting the form', () => {
    const {rerender} = render(<Admin extraMenuItems={[{key: 'reports', title: 'Reports'}]} />);
    expect(screen.getByTestId('menu')).toHaveTextContent('reports');

    rerender(
      <Admin
        extraMenuItems={[
          {key: 'reports', title: 'Reports'},
          {key: 'exports', title: 'Exports'},
        ]}
      />
    );

    expect(screen.getByTestId('menu')).toHaveTextContent('reports,exports');
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('swaps the shell when LayoutComponent changes', () => {
    const {rerender} = render(<Admin extraMenuItems={[{key: 'reports', title: 'Reports'}]} />);
    expect(screen.getByTestId('menu')).toHaveTextContent('reports');

    rerender(
      <Admin
        extraMenuItems={[{key: 'reports', title: 'Reports'}]}
        LayoutComponent={OtherFakeLayout as LayoutComponentType}
      />
    );

    expect(screen.getByTestId('menu')).toHaveTextContent('other shell');
  });
});
