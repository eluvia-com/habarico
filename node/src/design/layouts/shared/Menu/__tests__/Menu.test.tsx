import React from 'react';
import {Link, MemoryRouter, useLocation} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LayoutMenuItem} from '../../../types';
import {Menu} from '../Menu';

const theme = createLightTheme();

const menuItems: LayoutMenuItem[] = [
  {title: 'Overview', href: '/overview', icon: null},
  {
    title: 'Catalog',
    href: '/catalog/products',
    icon: <span data-testid="catalog-icon" />,
    items: [
      {title: 'Products', href: '/catalog/products', icon: null},
      {title: 'Categories', href: '/catalog/categories', icon: null},
    ],
  },
];

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderMenu = (initialPath: string, collapsed = false) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider theme={theme}>
        <Menu items={menuItems} collapsed={collapsed} />
        <LocationProbe />
        {/* A link outside the menu, the way a breadcrumb or a record link reaches a page. */}
        <Link to="/catalog/categories">elsewhere</Link>
      </ThemeProvider>
    </MemoryRouter>
  );

const location = () => screen.getByTestId('location').textContent;

describe('Menu (full)', () => {
  it('renders a group as a button, not a link', () => {
    renderMenu('/overview');

    expect(screen.queryByRole('link', {name: 'Catalog'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Catalog'})).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a group on click without navigating', async () => {
    renderMenu('/overview');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', {name: 'Catalog'}));

    expect(location()).toBe('/overview');
    expect(screen.getByRole('button', {name: 'Catalog'})).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', {name: 'Categories'})).toBeVisible();
  });

  it('collapses an expanded group on a second click', async () => {
    renderMenu('/overview');
    const user = userEvent.setup();
    const group = screen.getByRole('button', {name: 'Catalog'});

    await user.click(group);
    await user.click(group);

    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(location()).toBe('/overview');
  });

  it('starts expanded when the current location is inside the group', () => {
    renderMenu('/catalog/categories');

    expect(screen.getByRole('button', {name: 'Catalog'})).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses a group holding the current page on click', async () => {
    renderMenu('/catalog/categories');
    const user = userEvent.setup();
    const group = screen.getByRole('button', {name: 'Catalog'});

    await user.click(group);

    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(location()).toBe('/catalog/categories');
  });

  it('navigates on a click on a child item', async () => {
    renderMenu('/overview');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', {name: 'Catalog'}));
    await user.click(screen.getByRole('link', {name: 'Categories'}));

    expect(location()).toBe('/catalog/categories');
  });

  it('expands a manually collapsed group again when navigating into it', async () => {
    renderMenu('/catalog/products');
    const user = userEvent.setup();
    const group = screen.getByRole('button', {name: 'Catalog'});

    await user.click(group);
    expect(group).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('link', {name: 'elsewhere'}));

    expect(location()).toBe('/catalog/categories');
    expect(group).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Menu (collapsed)', () => {
  it('opens the sub-menu on a click on a group without navigating', async () => {
    renderMenu('/overview', true);
    const user = userEvent.setup();

    // The collapsed rail shows icons only, so the group is reached through its icon.
    await user.click(screen.getByTestId('catalog-icon'));

    expect(location()).toBe('/overview');
    expect(await screen.findByRole('link', {name: 'Categories'})).toBeVisible();
  });

  it('navigates on a click on an item of the opened sub-menu', async () => {
    renderMenu('/overview', true);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('catalog-icon'));
    await user.click(await screen.findByRole('link', {name: 'Categories'}));

    await waitFor(() => expect(location()).toBe('/catalog/categories'));
  });

  it('closes the sub-menu it opened on a second click', async () => {
    renderMenu('/overview', true);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('catalog-icon'));
    expect(await screen.findByRole('link', {name: 'Categories'})).toBeVisible();

    await user.click(screen.getByTestId('catalog-icon'));

    await waitFor(() =>
      expect(screen.queryByRole('link', {name: 'Categories'})).not.toBeInTheDocument()
    );
  });

  it('keeps a sub-menu opened by hovering open on a click', async () => {
    renderMenu('/overview', true);
    const user = userEvent.setup();

    await user.hover(screen.getByTestId('catalog-icon'));
    expect(await screen.findByRole('link', {name: 'Categories'})).toBeVisible();

    await user.click(screen.getByTestId('catalog-icon'));

    expect(screen.getByRole('link', {name: 'Categories'})).toBeVisible();
    expect(location()).toBe('/overview');
  });
});
