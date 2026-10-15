import React, {useDeferredValue, useMemo} from 'react';
import {AdminContext, AdminUI, CustomRoutes, Store, UserIdentity} from 'react-admin';
import {Route} from 'react-router-dom';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Everything below comes from the public entry point on purpose: this is the hand-assembled admin
// of `docs/base-components/schema-root-context-provider.md`, kept in step with the page, and it
// fails to compile the moment a piece it needs drops out of the barrel.
import {
  AdminConfigProvider,
  AdminHashRouter,
  AuthPage,
  Loading,
  LocaleProvider,
  LogoutPage,
  NotFound,
  ResetPasswordPage,
  SchemaIdentitySync,
  SchemaLayout,
  SchemaRootContextProvider,
  ServiceAuthProvider,
  createLightTheme,
  defaultBoxProvider,
  defaultButtonProvider,
  defaultFieldProvider,
  defaultInputProvider,
  defaultValidatorProvider,
  defaultViewProvider,
  getDataProviderFactory,
  getSchemaProvider,
  useGetI18nProvider,
  usePerUserStore,
  useResourceElements,
  useSchemaRootContext,
  withRaDefaults,
} from '../../../../index';

// --- The example of the page --------------------------------------------------------------------

const queryClient = new QueryClient();
const serviceConfigMap = {
  eshop: {url: 'https://api.example.com/api/v1/eshop/admin', label: 'E-shop'},
};
const lightTheme = withRaDefaults(createLightTheme());

const ShopAdmin = ({authProvider}: {authProvider: ServiceAuthProvider}) => {
  const {store, userIdentity, setUserIdentity} = usePerUserStore({authProvider});
  const schemaProvider = useMemo(
    () => getSchemaProvider(authProvider.getAuthHeaders),
    [authProvider]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider locale="en">
        <AdminConfigProvider
          menu={{items: []}}
          navigationGuard={false}
          draftEnabled={false}
          defaultPerPage={25}
          notificationAutoHideDuration={10000}
        >
          <SchemaRootContextProvider
            value={{
              serviceConfigMap,
              schemaProvider,
              dataProviderFactory: getDataProviderFactory,
              authProvider,
              defaultFieldProvider,
              defaultInputProvider,
              defaultValidatorProvider,
              defaultBoxProvider,
              defaultButtonProvider,
              defaultViewProvider,
              defaultRowAction: 'click',
              resources: {},
              locale: 'en',
              hasDashboard: false,
              userIdentity,
              setUserIdentity,
            }}
          >
            <ShopAdminUI store={store} />
          </SchemaRootContextProvider>
        </AdminConfigProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
};

const ShopAdminUI = ({store}: {store: Store}) => {
  const {dataProvider, authProvider, isLoaded} = useSchemaRootContext();
  const i18nProvider = useGetI18nProvider();
  const resources = useResourceElements();
  const isRoutesReady = useDeferredValue(isLoaded);

  return (
    <AdminHashRouter>
      <AdminContext
        store={store}
        dataProvider={dataProvider}
        authProvider={authProvider}
        i18nProvider={i18nProvider}
        lightTheme={lightTheme}
        queryClient={queryClient}
      >
        <SchemaIdentitySync />
        <AdminUI
          layout={SchemaLayout}
          loginPage={AuthPage}
          requireAuth
          ready={Loading}
          catchAll={isRoutesReady ? NotFound : Loading}
        >
          {isLoaded && resources}
          <CustomRoutes noLayout>
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/logout" element={<LogoutPage />} />
          </CustomRoutes>
        </AdminUI>
      </AdminContext>
    </AdminHashRouter>
  );
};

// --- Test harness -------------------------------------------------------------------------------

const productSchema = [
  {
    name: 'product',
    pk_field_name: 'id',
    label: 'Products',
    views: [
      {
        name: 'list',
        type: 'list',
        is_detail: false,
        endpoint: {method: 'get', action_name: 'list'},
      },
    ],
    actions: [],
    menu: {
      name: 'product',
      label: 'Products',
      priority: 1,
      type: 'view',
      view: {name: 'list', choices: [], mode: 'redirect', parameters: {}},
    },
  },
];

// Serves the service schema; every other request (the list's own schema and records) stays
// pending, which is enough for the shell and its menu to render.
const fetchMock = vi.fn((input: RequestInfo | URL) =>
  String(input) === 'https://api.example.com/api/v1/eshop/admin/schema/'
    ? Promise.resolve(new Response(JSON.stringify(productSchema)))
    : new Promise<Response>(() => {})
);

// An auth provider over a mutable session, the way `buildServiceAuthProvider` reads its persisted
// auth data: `getIdentity` rejects while signed out.
const buildAuthProvider = (initialUser?: UserIdentity) => {
  let user = initialUser;
  return {
    login: ({username}: {username: string}) => {
      user = {id: username, fullName: username};
      return Promise.resolve();
    },
    logout: () => {
      user = undefined;
      return Promise.resolve();
    },
    checkAuth: () => (user ? Promise.resolve() : Promise.reject()),
    checkError: () => Promise.resolve(),
    getPermissions: () => Promise.resolve(),
    getIdentity: () => (user ? Promise.resolve(user) : Promise.reject(new Error('signed out'))),
    isAuthenticated: () => !!user,
    getAuthHeaders: () => ({}),
  } as unknown as ServiceAuthProvider;
};

describe('SchemaRootContextProvider assembled by hand', () => {
  beforeEach(() => {
    // React Admin routes through the URL hash, which jsdom keeps between tests.
    window.history.replaceState(null, '', '/');
    localStorage.clear();
    queryClient.clear();
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  // The whole admin renders here, so a query can take its time.
  const findMenuItem = () => screen.findByText('Products', {}, {timeout: 10000});

  it('renders the schema-driven shell for a signed-in user', async () => {
    render(<ShopAdmin authProvider={buildAuthProvider({id: 'user-a', fullName: 'User A'})} />);

    expect(await findMenuItem()).toBeDefined();
  }, 20000);

  it('fetches the schemas once the user signs in without a reload', async () => {
    const {container} = render(<ShopAdmin authProvider={buildAuthProvider()} />);

    const username = await waitFor(
      () => {
        const input = container.querySelector<HTMLInputElement>('input[name="username"]');
        if (!input) throw new Error('The login form is not rendered yet');
        return input;
      },
      {timeout: 10000}
    );
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.type(username, 'user-b');
    await userEvent.type(container.querySelector('input[name="password"]')!, 'secret');
    await userEvent.click(container.querySelector('button[type="submit"]')!);

    expect(await findMenuItem()).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/eshop/admin/schema/',
      expect.anything()
    );
  }, 20000);

  it('does not request the schemas again after signing out', async () => {
    const authProvider = buildAuthProvider({id: 'user-a', fullName: 'User A'});
    const {container, rerender} = render(<ShopAdmin authProvider={authProvider} />);
    await findMenuItem();
    const schemaRequests = () =>
      fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/schema/')).length;
    const requestsWhileSignedIn = schemaRequests();

    window.location.hash = '#/logout';
    await waitFor(() => expect(container.querySelector('input[name="username"]')).not.toBeNull(), {
      timeout: 10000,
    });
    // Anything above the admin may re-render it on the login page (a language switch, the app's
    // own auth state).
    rerender(<ShopAdmin authProvider={authProvider} />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(schemaRequests()).toBe(requestsWhileSignedIn);
  }, 20000);
});
