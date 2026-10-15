import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {ThemeProvider, createTheme} from '@mui/material';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LayoutDynamicProvider} from '../../../contexts/LayoutDynamicContext';
import {BreadcrumbsPortal} from '../BreadcrumbsPortal';
import {PortalBreadcrumbItem} from '../PortalBreadcrumbItem';
import {PortalBreadcrumbsOutlet} from '../PortalBreadcrumbsOutlet';

const theme = createTheme();

type Crumb = {title: string; path?: string};

const renderTrail = (crumbs: Crumb[]) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <LayoutDynamicProvider currentUser={null}>
          <PortalBreadcrumbsOutlet />
          <BreadcrumbsPortal>
            {crumbs.map((crumb) => (
              <PortalBreadcrumbItem key={crumb.title} path={crumb.path}>
                {crumb.title}
              </PortalBreadcrumbItem>
            ))}
          </BreadcrumbsPortal>
        </LayoutDynamicProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

const isCrumbHidden = (el: HTMLElement | null) => el?.closest('li')?.style.display === 'none';

describe('PortalBreadcrumbs collapse', () => {
  it('shows every crumb when there are two or fewer', async () => {
    renderTrail([{title: 'Properties', path: '/properties'}, {title: 'Detail'}]);

    expect(await screen.findByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: '…'})).not.toBeInTheDocument();
  });

  it('folds the middle crumbs behind a … once there are more than two', async () => {
    renderTrail([
      {title: 'Dashboard', path: '/'},
      {title: 'Properties', path: '/properties'},
      {title: 'Units', path: '/properties/1/units'},
      {title: 'Detail'},
    ]);

    const ellipsis = await screen.findByRole('button', {name: '…'});
    expect(ellipsis).toBeInTheDocument();

    // First and last stay visible; the two middle crumbs are hidden in the trail.
    expect(isCrumbHidden(screen.getByText('Dashboard'))).toBe(false);
    expect(isCrumbHidden(screen.getByText('Detail'))).toBe(false);
    expect(isCrumbHidden(screen.getByText('Properties'))).toBe(true);
    expect(isCrumbHidden(screen.getByText('Units'))).toBe(true);

    // The … popover lists the hidden crumbs as links to their paths.
    await userEvent.click(ellipsis);
    const menu = await screen.findByRole('menu');
    const links = within(menu).getAllByRole('menuitem');
    expect(links.map((el) => el.textContent)).toEqual(['Properties', 'Units']);
    expect(within(menu).getByText('Properties').closest('a')).toHaveAttribute(
      'href',
      '/properties'
    );
  });

  // The HAB-961 shape: a crumb whose label reads a context supplied around that crumb only. The
  // popover entry must resolve it the same way the trail does. Collecting label elements in the
  // collapse provider and re-rendering them beside the popover resolved them against whatever
  // context sat there instead — for `ResourceRepresentation` that was the page's resource, so the
  // entry fetched the wrong record and rendered blank.
  it('resolves a folded crumb label against the context of the crumb, not of the popover', async () => {
    const ResourceContext = React.createContext('page-resource');
    const ResourceLabel = () => <>{`Record of ${React.useContext(ResourceContext)}`}</>;

    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <LayoutDynamicProvider currentUser={null}>
            <PortalBreadcrumbsOutlet />
            <BreadcrumbsPortal>
              <PortalBreadcrumbItem path="/">Dashboard</PortalBreadcrumbItem>
              <ResourceContext.Provider value="crumb-resource">
                <PortalBreadcrumbItem path="/record">
                  <ResourceLabel />
                </PortalBreadcrumbItem>
              </ResourceContext.Provider>
              <PortalBreadcrumbItem path="/record/units">Units</PortalBreadcrumbItem>
              <PortalBreadcrumbItem>Detail</PortalBreadcrumbItem>
            </BreadcrumbsPortal>
          </LayoutDynamicProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole('button', {name: '…'}));

    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((el) => el.textContent)
    ).toEqual(['Record of crumb-resource', 'Units']);
  });
});
