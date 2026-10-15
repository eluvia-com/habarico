import React, {ReactNode, useEffect} from 'react';
import {MemoryRouter} from 'react-router-dom';
import type {GridValidRowModel} from '@mui/x-data-grid';
import {HabaricoLogo} from '../atoms/HabaricoLogo';
import {Icon, IconType} from '../atoms/Icon';
import {_accountMenuItems, _availableLanguages, _marketing, _status} from '../layouts/_mock';
import {useLayoutDynamicContext} from '../layouts/contexts/LayoutDynamicContext';
import {LayoutProvider} from '../layouts/contexts/LayoutProvider';
import {useMockSettings, useSettingsContext} from '../layouts/contexts/SettingsContext';
import {DashboardContent} from '../layouts/dashboard/DashboardContent';
import {DashboardLayout} from '../layouts/dashboard/DashboardLayout';
import {HeaderActionsPortal} from '../layouts/shared/HeaderActions';
import {SearchContent} from '../layouts/shared/Search';
import {
  LayoutBreadcrumb,
  LayoutMenuItem,
  LayoutSearchResult,
  SearchContentComponentProps,
} from '../layouts/types';
import {PropertyList, type PropertyListProps} from '../molecules/PropertyList';
import {DataGrid, type DataGridProps} from '../organisms/DataGrid';
import {DataTable, type DataTableProps} from '../organisms/DataTable';
import {FormTable, type FormTableProps} from '../organisms/FormTable';

/**
 * Story-support module for the `design/pages/*` full-page mockups (HAB-681). It is **not**
 * a shipped component and is never exported from a barrel — it only assembles the authenticated
 * `DashboardLayout` shell (property-management menu, top-bar search / account / notifications)
 * once, so each page story composes just its own content. Mirrors the reference
 * `layouts/dashboard/DashboardLayout.stories.tsx`, but wires a property-management flavour and
 * lets each page pick the active menu item and its own breadcrumbs.
 */

// ----------------------------------------------------------------------------
// Menu — a property-management flavour, presentational only.
// ----------------------------------------------------------------------------

const PAGE_MENU_ITEMS: LayoutMenuItem[] = [
  {title: 'Dashboard', href: '/', icon: <Icon width={22} icon={IconType.BarChart} />},
  {title: 'Clients', href: '/clients', icon: <Icon width={22} icon={IconType.Groups} />},
  {title: 'Properties', href: '/properties', icon: <Icon width={22} icon={IconType.Home} />},
  {title: 'Deals & contracts', href: '/deals', icon: <Icon width={22} icon={IconType.Handshake} />},
  {title: 'Documents', href: '/documents', icon: <Icon width={22} icon={IconType.Description} />},
  {title: 'Payments', href: '/payments', icon: <Icon width={22} icon={IconType.CreditCard} />},
  {title: 'Company', href: '/company', icon: <Icon width={22} icon={IconType.BusinessCenter} />},
];

// ----------------------------------------------------------------------------
// Search — a static demo slot (the toggle / backdrop / slide live in the layout).
// ----------------------------------------------------------------------------

const _searchResults: LayoutSearchResult[] = [
  {
    meta: {label: 'Properties', icon: <Icon size={20} icon={IconType.Home} />},
    objects: [
      {
        href: '/properties/1',
        title: 'Jihlavská 521/62, Prague – Michle',
        description: 'Flat · 2+1 · 50 m²',
      },
      {
        href: '/properties/2',
        title: 'Baarova 2670/13, Prague – Michle',
        description: 'Flat · 2+kk · 48 m²',
      },
    ],
  },
  {
    meta: {label: 'Clients', icon: <Icon size={20} icon={IconType.Groups} />},
    objects: [
      {href: '/clients/1', title: 'Mgr. Ing. Petr Kašák', description: 'Client no. 100712'},
    ],
  },
];

const SearchDemo = ({onClose}: SearchContentComponentProps) => (
  <SearchContent searchResults={_searchResults} onClose={onClose} />
);

// ----------------------------------------------------------------------------
// Provider — like `LayoutMockProvider` but with page-specific breadcrumbs.
// ----------------------------------------------------------------------------

const _currentUser = {
  id: 1,
  fullName: 'Martina Nováková',
  email: 'martina.novakova@example.com',
  avatar: 'https://i.pravatar.cc/300?img=5',
};

// Seeds the page's breadcrumbs into the dynamic context via its setter (breadcrumbs are no longer a
// provider prop). Mirrors how a concrete view sets them at runtime.
const SeedBreadcrumbs = ({
  breadcrumbs,
  children,
}: {
  breadcrumbs: LayoutBreadcrumb[];
  children: ReactNode;
}) => {
  const {setBreadcrumbs} = useLayoutDynamicContext();
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
  }, [breadcrumbs, setBreadcrumbs]);
  return <>{children}</>;
};

const PageProvider = ({
  breadcrumbs,
  children,
}: {
  breadcrumbs: LayoutBreadcrumb[];
  children: ReactNode;
}) => {
  const settings = useMockSettings();
  return (
    <LayoutProvider settings={settings} currentUser={_currentUser}>
      <SeedBreadcrumbs breadcrumbs={breadcrumbs}>{children}</SeedBreadcrumbs>
    </LayoutProvider>
  );
};

// ----------------------------------------------------------------------------
// Shell — the wrapper every page story renders its content into.
// ----------------------------------------------------------------------------

export type PageShellProps = {
  children: ReactNode;
  /** Portaled into the header (the view's global actions — Edit / Save / …). */
  headerActions?: ReactNode;
  /** Router entry, so the matching menu item highlights. */
  activePath?: string;
  /** Breadcrumb trail for this page. */
  breadcrumbs?: LayoutBreadcrumb[];
};

export const PageShell = ({
  children,
  headerActions,
  activePath = '/',
  breadcrumbs = [{title: 'Dashboard', path: '/'}],
}: PageShellProps) => (
  <MemoryRouter initialEntries={[activePath]}>
    <PageProvider breadcrumbs={breadcrumbs}>
      <DashboardLayout
        logo={{Component: HabaricoLogo}}
        menu={{items: PAGE_MENU_ITEMS}}
        account={{menuItems: _accountMenuItems}}
        language={{availableLanguages: _availableLanguages}}
        search={{Component: SearchDemo}}
        marketing={_marketing}
        status={_status}
        appearance={{header: true}}
        arrangement={{header: true}}
        table
        notifications
        breadcrumbs
        settings
      >
        <DashboardContent maxWidth={false}>
          {headerActions && <HeaderActionsPortal>{headerActions}</HeaderActionsPortal>}
          {children}
        </DashboardContent>
      </DashboardLayout>
    </PageProvider>
  </MemoryRouter>
);

// ----------------------------------------------------------------------------
// Settings-aware tables — `density` follows the global setting (the app-bar / settings-panel
// control), which now shares the tables' `'compact' | 'standard' | 'comfortable'` values so it
// passes straight through. Rendered inside the shell, they read it via `useSettingsContext`.
// ----------------------------------------------------------------------------

export function SettingsDataTable<T>(props: DataTableProps<T>) {
  const {density, stripedRows} = useSettingsContext();
  return <DataTable<T> {...props} density={density} stripedRows={stripedRows} />;
}

export function SettingsDataGrid<R extends GridValidRowModel = GridValidRowModel>(
  props: DataGridProps<R>
) {
  const {density, stripedRows} = useSettingsContext();
  return <DataGrid<R> {...props} density={density} stripedRows={stripedRows} />;
}

// `PropertyList` shares the same density values, so the read/edit forms track the global
// setting too. Only the top-level list needs wrapping — nested `PropertyList`s inherit the
// density through context.
export function SettingsPropertyList(props: PropertyListProps) {
  const {density} = useSettingsContext();
  return <PropertyList {...props} density={density} />;
}

// `FormTable` shares the same density values, so the editable row tables track the global setting too.
export function SettingsFormTable<T>(props: FormTableProps<T>) {
  const {density} = useSettingsContext();
  return <FormTable<T> {...props} density={density} />;
}
