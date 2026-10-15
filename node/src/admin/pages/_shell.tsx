import React, {ReactNode, useEffect, useState} from 'react';
import {
  AuthProvider,
  DashboardComponent,
  TestMemoryRouter,
  memoryStore,
  useRecordContext,
} from 'react-admin';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {Icon, IconType} from '@design/atoms/Icon';
import {useLayoutDynamicContext} from '@design/layouts/contexts/LayoutDynamicContext';
import {SearchContent} from '@design/layouts/shared/Search';
import {
  type LayoutBreadcrumb,
  LayoutMenuItem,
  LayoutSearchResult,
  LayoutUser,
  MarketingSlot,
  SearchContentComponentProps,
  StatusSlot,
} from '@design/layouts/types';
import {ObjectHero, ObjectHeroStatus} from '@design/organisms/ObjectHero';
import {BaseAdmin} from '../components/base/BaseAdmin';
import {type Property, createFakeDataProvider} from './_data';
import {LANGUAGES} from './_i18n';

/**
 * Story-support harness for the admin-layer page stories (HAB-668). It boots a **real** React
 * Admin instance through the admin-layer entry point `BaseAdmin` — an in-memory
 * `ra-data-fakerest` data provider, a fake auth provider (so the account avatar resolves), a
 * memory router and the mock app-shell config. It is the admin-layer analogue of
 * `design/pages/_shell.tsx`, one level up and *live* instead of static.
 *
 * Only the mock shell data and the `AdminStoryShell` wrapper are story-support (never exported
 * from the barrel); everything else is the real `@admin` `BaseAdmin`, which wires the design
 * layouts, i18n, settings and account menu / dialogs on its own.
 *
 * Everything here is schema-agnostic on purpose — the point of the harness is to prove the admin
 * layer stands up on `admin + design + foundation` alone, with no `@schema` in sight.
 */

// ----------------------------------------------------------------------------
// Mock app-shell data — a property-management flavour, standalone (the admin
// stories keep their own set rather than sharing design/pages' `_mock`).
// ----------------------------------------------------------------------------

const MENU_ITEMS: LayoutMenuItem[] = [
  {title: 'Dashboard', href: '/', icon: <Icon width={22} icon={IconType.BarChart} />},
  {title: 'Properties', href: '/properties', icon: <Icon width={22} icon={IconType.Home} />},
  {title: 'Owners', href: '/owners', icon: <Icon width={22} icon={IconType.Groups} />},
  {title: 'Documents', href: '/documents', icon: <Icon width={22} icon={IconType.Description} />},
  {title: 'Payments', href: '/payments', icon: <Icon width={22} icon={IconType.CreditCard} />},
];

const noop = () => {};

const CURRENT_USER: LayoutUser = {
  id: 1,
  fullName: 'Martina Nováková',
  email: 'martina.novakova@example.com',
  avatar: 'https://i.pravatar.cc/300?img=5',
};

const MARKETING: MarketingSlot = {label: 'Habarico admin', href: '#'};
const STATUS: StatusSlot = {version: '1.0.0', environment: 'dev'};

const SEARCH_RESULTS: LayoutSearchResult[] = [
  {
    meta: {label: 'Properties', icon: <Icon size={20} icon={IconType.Home} />},
    objects: [
      {
        href: '/properties/1',
        title: 'Kyjovská 578/13, Prague – Michle',
        description: 'Flat · 2+1 · 52 m²',
      },
      {
        href: '/properties/3',
        title: 'Baarova 2670/13, Prague – Michle',
        description: 'Flat · 2+kk · 48 m²',
      },
    ],
  },
  {
    meta: {label: 'Owners', icon: <Icon size={20} icon={IconType.Groups} />},
    objects: [{href: '/owners/1', title: 'Jiří Daněk', description: 'Owner no. 1'}],
  },
];

const SearchDemo = ({onClose}: SearchContentComponentProps) => (
  <SearchContent searchResults={SEARCH_RESULTS} onClose={onClose} />
);

// A fake auth provider so `BaseAdmin` (which requires auth) lets the stories through, the account
// avatar resolves via `useGetIdentity`, and the account dialogs (the `BaseAdmin` defaults
// `UpdateIdentityDialog` / `ChangePasswordDialog`) can submit against a mocked success. The
// `updateIdentity` / `changePassword` methods belong to `ServiceAuthProvider`, which the dialogs
// consume via `useAuthProvider<ServiceAuthProvider>()`.
const authProvider: AuthProvider & {
  updateIdentity: () => Promise<Response>;
  changePassword: () => Promise<void>;
} = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  getIdentity: () => Promise.resolve({...CURRENT_USER, firstName: 'Martina', lastName: 'Nováková'}),
  updateIdentity: () => Promise.resolve(new Response()),
  changePassword: () => Promise.resolve(),
};

// ----------------------------------------------------------------------------
// Shell — boots the real <BaseAdmin>. A story renders its <Resource> elements as
// children and points `initialEntry` at the route it wants to showcase.
// ----------------------------------------------------------------------------

export type AdminStoryShellProps = {
  /** Router entry the story lands on (e.g. `/properties`, `/properties/1/show`). */
  initialEntry?: string;
  /** Optional RA dashboard component, rendered at `/`. */
  dashboard?: DashboardComponent;
  /** `<Resource>` (and `<CustomRoutes>`) elements. */
  children: ReactNode;
};

export const AdminStoryShell = ({
  initialEntry = '/',
  dashboard,
  children,
}: AdminStoryShellProps) => {
  // One data provider / store per mount → each story starts from clean, isolated data.
  const [dataProvider] = useState(createFakeDataProvider);
  const [store] = useState(() => memoryStore());
  return (
    <TestMemoryRouter initialEntries={[initialEntry]}>
      <BaseAdmin
        dataProvider={dataProvider}
        authProvider={authProvider}
        store={store}
        availableLanguages={LANGUAGES}
        dashboard={dashboard}
        logo={{Component: HabaricoLogo}}
        menu={{items: MENU_ITEMS}}
        search={{Component: SearchDemo}}
        marketing={MARKETING}
        status={STATUS}
        breadcrumbs
        contentMaxWidth={false}
        onLogout={noop}
      >
        {children}
      </BaseAdmin>
    </TestMemoryRouter>
  );
};

// Re-exported for stories that portal view-level actions into the app header.
export {HeaderActionsPortal} from '@design/layouts/shared/HeaderActions';

// Seeds the page breadcrumb trail into the layout's dynamic context from inside a routed view — the
// intended pattern now that breadcrumbs are set by a concrete view (not passed as props). Render it
// inside a story's view; pass a module-level constant so the effect runs once. Renders nothing.
export const SeedBreadcrumbs = ({items}: {items: LayoutBreadcrumb[]}) => {
  const {setBreadcrumbs} = useLayoutDynamicContext();
  useEffect(() => {
    setBreadcrumbs(items);
  }, [items, setBreadcrumbs]);
  return null;
};

// The property detail/edit header band, fed from the RA record. Shared by the `PropertyDetail` and
// `PropertyEdit` stories so both view types show the same `ObjectHero`.
export const PropertyHero = () => {
  const record = useRecordContext<Property>();
  if (!record) return null;
  const statuses: ObjectHeroStatus[] = [
    {label: record.active ? 'Active property' : 'Inactive property'},
    ...(record.complete
      ? [{label: 'Profile complete', color: 'success' as const, icon: IconType.CheckCircle}]
      : []),
  ];
  return (
    <ObjectHero
      image="https://picsum.photos/seed/habarico/200/200"
      category="Property"
      title={record.address}
      attributes={[`Unit ${record.unit_number}`, record.type, record.layout, `${record.area} m²`]}
      statuses={statuses}
    />
  );
};
