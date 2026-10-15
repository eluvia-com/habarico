import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {ThemeProvider, createTheme} from '@mui/material';
import {render, screen} from '@testing-library/react';
import {EllipsisWithTitle} from '../../../../atoms/EllipsisWithTitle';
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
                <EllipsisWithTitle maxWidth={200}>{crumb.title}</EllipsisWithTitle>
              </PortalBreadcrumbItem>
            ))}
          </BreadcrumbsPortal>
        </LayoutDynamicProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

// `EllipsisWithTitle` renders its label twice (the text and the tooltip's copy), so take the first.
const crumbOf = (title: string) => screen.getAllByText(title)[0].closest('li') as HTMLElement;
const shrinks = (title: string) => crumbOf(title).style.flexShrink === '1';

describe('PortalBreadcrumbItem', () => {
  it('shrinks only the last crumb, even when an earlier one has no path', async () => {
    // A path-less crumb in front of the current one — e.g. a `link` menu entry with an empty URL.
    renderTrail([{title: 'Reports'}, {title: 'Sales report'}]);

    await screen.findAllByText('Sales report');
    expect(shrinks('Sales report')).toBe(true);
    expect(shrinks('Reports')).toBe(false);
  });

  it('shrinks the last crumb even when it has a path', async () => {
    renderTrail([
      {title: 'Orders', path: '/orders'},
      {title: 'Sales report', path: '/orders/report'},
    ]);

    await screen.findAllByText('Sales report');
    expect(shrinks('Sales report')).toBe(true);
    expect(shrinks('Orders')).toBe(false);
  });

  it('lifts the width cap on the last crumb only', async () => {
    renderTrail([{title: 'Reports'}, {title: 'Sales report'}]);

    await screen.findAllByText('Sales report');
    const capOf = (title: string) =>
      getComputedStyle(crumbOf(title).querySelector('.mnl__ellipsis__with__title__root')!).maxWidth;
    expect(capOf('Sales report')).toBe('100%');
    expect(capOf('Reports')).toBe('200px');
  });

  it('treats a path-less crumb as the current one outside a BreadcrumbsPortal', () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <ol>
            <PortalBreadcrumbItem path="/orders">Orders</PortalBreadcrumbItem>
            <PortalBreadcrumbItem>Sales report</PortalBreadcrumbItem>
          </ol>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Sales report').closest('li')).toHaveStyle({flexShrink: '1'});
    expect(screen.getByText('Orders').closest('li')?.style.flexShrink).toBe('');
  });
});
