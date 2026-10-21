import React from 'react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent, {UserEvent} from '@testing-library/user-event';
import {HabaricoLogo} from '../../../atoms/HabaricoLogo';
import {LayoutMenuItem} from '../../types';
import {DashboardLayout} from '../DashboardLayout';

const theme = createLightTheme();

const menuItems: LayoutMenuItem[] = [
  {title: 'Overview', href: '/overview', icon: null},
  {
    title: 'Catalog',
    href: '/catalog/products',
    icon: null,
    items: [
      {title: 'Products', href: '/catalog/products', icon: null},
      {title: 'Categories', href: '/catalog/categories', icon: null},
    ],
  },
];

const renderLayout = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route
            path="*"
            element={
              <DashboardLayout logo={{Component: HabaricoLogo}} menu={{items: menuItems}}>
                content
              </DashboardLayout>
            }
          />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );

// The desktop sidebar renders the same menu, so look inside the mobile drawer only.
const openDrawer = async (user: UserEvent) => {
  await user.click(screen.getByTestId(/^MenuOpen/).closest('button')!);
  return within(await screen.findByRole('presentation'));
};

describe('DashboardLayout mobile nav drawer', () => {
  it('stays open and expands a top-level item with children', async () => {
    renderLayout('/overview');
    const user = userEvent.setup();
    const drawer = await openDrawer(user);

    await user.click(drawer.getByRole('button', {name: 'Catalog'}));

    expect(screen.getByRole('presentation')).toBeInTheDocument();
    expect(drawer.getByRole('link', {name: 'Categories'})).toBeVisible();
  });

  it('closes after navigating through the logo', async () => {
    renderLayout('/overview');
    const user = userEvent.setup();
    const drawer = await openDrawer(user);

    await user.click(drawer.getAllByRole('link').find((a) => a.getAttribute('href') === '/')!);

    await waitFor(() => expect(screen.queryByRole('presentation')).not.toBeInTheDocument());
  });

  it('closes after clicking a leaf item', async () => {
    renderLayout('/catalog/products');
    const user = userEvent.setup();
    const drawer = await openDrawer(user);

    await user.click(drawer.getByRole('link', {name: 'Categories'}));

    await waitFor(() => expect(screen.queryByRole('presentation')).not.toBeInTheDocument());
  });
});
