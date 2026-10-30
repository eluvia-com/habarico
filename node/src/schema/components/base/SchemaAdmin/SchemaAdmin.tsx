import React, {
  FC,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  AdminContext,
  CustomRoutes,
  DashboardComponent as DashboardComponentType,
  LayoutComponent as LayoutComponentType,
  LoginComponent as LoginComponentType,
  Store,
} from 'react-admin';
import {Route, useInRouterContext} from 'react-router-dom';
import {AuthPage} from '@admin/components/auth/AuthPage';
import {
  ChangePasswordDialog,
  type ChangePasswordDialogProps,
} from '@admin/components/auth/ChangePasswordDialog';
import {LogoutPage} from '@admin/components/auth/LogoutPage';
import {ResetPasswordPage} from '@admin/components/auth/ResetPasswordPage';
import {
  UpdateIdentityDialog,
  type UpdateIdentityDialogProps,
} from '@admin/components/auth/UpdateIdentityDialog';
import {AdminHashRouter} from '@admin/components/base/AdminHashRouter';
import {Loading} from '@admin/components/common/Loading';
import {NotFound} from '@admin/components/common/NotFound';
import {Notification} from '@admin/components/common/Notification';
import {AdminConfigProvider, useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {FormExtensionsProvider} from '@admin/contexts/FormExtensionsContext';
import {UnsavedChangesProvider} from '@admin/contexts/UnsavedChangesContext';
import {useGetI18nProvider} from '@admin/hooks/useGetI18nProvider';
import {useStoreIdentity} from '@admin/hooks/useStoreIdentity';
import {ServiceAuthProvider} from '@admin/providers/types';
import {withRaDefaults} from '@admin/theme';
import {
  ArrangementSlot,
  LogoComponentType,
  MarketingSlot,
  MenuSlot,
  SearchComponentType,
  StatusSlot,
} from '@design/layouts/types';
import {LocaleProvider, createDarkTheme, createLightTheme} from '@design/theme';
import {findClosestLanguage} from '@foundation/utils/locale';
import {Theme} from '@mui/material';
import {SchemaRootContextProvider} from '@schema/contexts/SchemaRootContext';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {getDataProviderFactory} from '@schema/providers/dataProvider';
import {defaultBoxProvider} from '@schema/providers/defaultBoxProvider';
import {defaultButtonProvider} from '@schema/providers/defaultButtonProvider';
import {defaultFieldProvider} from '@schema/providers/defaultFieldProvider';
import {defaultInputProvider} from '@schema/providers/defaultInputProvider';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import {defaultViewProvider} from '@schema/providers/defaultViewProvider';
import {getSchemaProvider} from '@schema/providers/schemaProvider';
import {
  AdminBoxProvider,
  AdminButtonProvider,
  AdminFieldProvider,
  AdminInputProvider,
  AdminValidatorProvider,
  SchemaProvider,
  ServiceDataProvider,
} from '@schema/providers/types';
import {ServicesSchema} from '@schema/types';
import {QueryClient, QueryClientProvider, useQueryClient} from '@tanstack/react-query';
import {AdminLanguage, IconsMap, ServiceConfigMap} from '@typing';
import {DynamicAdminUI} from './DynamicAdminUI';
import {SchemaLayout} from './SchemaLayout';
import {SchemaLayoutBinding, SchemaLayoutBindingContext} from './SchemaLayoutBindingContext';
import {SchemaLayoutWithSlots} from './SchemaLayoutWithSlots';
import {ExtraMenuItem} from './types';
import {useSchemaAdminStore} from './useSchemaAdminStore';
import {separateAdminChildren} from './utils';

const queryClient = new QueryClient();

// The schema layer generates its menu inside `<Admin>` (via `useSchemaMenu`, which needs the
// resource definitions), so the resolved menu cannot live in this config assembled outside
// `<Admin>`. `SchemaLayout` computes `menu.items` itself, so this slot stays unused on the schema
// path — `AdminConfig.menu` is only required for the admin-layer `BaseAdmin` entry point.
const UNUSED_MENU: MenuSlot = {items: []};

// ----------------------------------------------------------------------------
// Runtime — the schema path's React Admin `<Admin>` boot. The analogue of the inline `<Admin>` in
// `BaseAdmin`, but split into its own component because it *consumes* `SchemaRootContext` (dataProvider /
// authProvider resolved by `SchemaRootContextProvider`, which `SchemaAdmin` renders above it) — a
// component can't read a context it provides in the same render. The `store` and the store-seeded
// `defaultLocale` are built above `<Admin>` (in `SchemaAdmin`) and passed in as props.
// ----------------------------------------------------------------------------

type SchemaAdminRuntimeProps = {
  children: ReactNode;
  store: Store;
  // Store-seeded locale, used only to align the i18n provider's default with the RA store on first
  // paint; inside `<Admin>` the locale is owned by the store (`useLocaleState` / `useAdminSettings`).
  defaultLocale: string;
  LayoutComponent?: LayoutComponentType;
  authPage?: LoginComponentType;
  dashboard?: DashboardComponentType;
  // Renders the global search overlay's contents. Left undefined the shell offers no search, even
  // when the backend advertises it — the results come from an endpoint the library does not serve,
  // so the application supplies the component that queries it.
  search?: SearchComponentType;
  resetPasswordPage?: ReactElement;
  basename?: string;
  theme?: object;
  lightTheme?: object;
  darkTheme?: object;
  // Custom top-level menu items merged into the schema-generated menu. Bound into the layout here
  // through `SchemaLayoutBindingContext` rather than carried in `AdminConfigContext` (see below).
  extraMenuItems?: ExtraMenuItem[];
};

const SchemaAdminRuntime = ({
  children,
  store,
  defaultLocale,
  LayoutComponent = SchemaLayout,
  authPage,
  resetPasswordPage,
  dashboard,
  basename,
  lightTheme: lightThemeProp,
  darkTheme: darkThemeProp,
  extraMenuItems,
  search,
}: SchemaAdminRuntimeProps) => {
  const {dataProvider, authProvider} = useSchemaRootContext();
  const {logo, availableLanguages} = useAdminConfig();

  // Always run the RA defaults, even over a caller-supplied theme — `lightTheme`/`darkTheme` stay
  // `object` (mirroring RA's own loose `<Admin>` theme prop) rather than `Theme`, since a caller may
  // pass raw `ThemeOptions` rather than a built theme.
  //
  // Memoized on the incoming props: React Admin's `ThemeProvider` keys its `createTheme()` cache on
  // the theme object's identity, so a fresh one on every render of this component re-creates the MUI
  // theme and re-renders (and re-serializes every `sx` in) the whole admin below it. An application
  // passing its theme inline (`lightTheme={createLightTheme()}`) still defeats this — memoize it at
  // the call site too.
  const lightTheme = useMemo(
    () => withRaDefaults((lightThemeProp ?? createLightTheme()) as Theme),
    [lightThemeProp]
  );
  const darkTheme = useMemo(
    () => withRaDefaults((darkThemeProp ?? createDarkTheme()) as Theme),
    [darkThemeProp]
  );

  // `extraMenuItems` and `search` are schema-layer concerns (the first feeds `useSchemaMenu` inside
  // `SchemaLayout`, the second the search overlay), so they are threaded into the layout as props
  // instead of being carried in the shared `AdminConfigContext` — which is assembled outside
  // `<Admin>` and shared with `BaseAdmin`.
  //
  // They reach the layout through `SchemaLayoutBindingContext`, never through the identity of the
  // component passed to `layout` below: React Admin renders that prop as an element of its type, so
  // a component rebuilt whenever a slot's reference changes remounts the whole admin — open forms
  // and their unsaved values with it. `SchemaLayoutWithSlots` is therefore a module-level constant,
  // and the application may pass either slot inline.
  const layoutBinding = useMemo<SchemaLayoutBinding>(
    () => ({LayoutComponent, extraMenuItems, search}),
    [LayoutComponent, extraMenuItems, search]
  );

  // The auth pages take their shell config as props; feed them the logo from `AdminConfigContext`.
  const effectiveAuthPage = authPage ?? (
    <AuthPage logo={logo} availableLanguages={availableLanguages} />
  );
  const effectiveResetPasswordPage = resetPasswordPage ?? (
    <ResetPasswordPage logo={logo} availableLanguages={availableLanguages} />
  );

  // Init translation provider — its default locale is the store-seeded one, so RA's `useLocaleState`
  // (defaulted from the i18n provider) agrees with the store on the first paint.
  const i18nProvider = useGetI18nProvider(availableLanguages, defaultLocale);

  const queryClient = useQueryClient();
  // Without a router of the application's, `AdminHashRouter` provides it and takes the basename.
  const isInRouter = useInRouterContext();

  return (
    <SchemaLayoutBindingContext.Provider value={layoutBinding}>
      <UnsavedChangesProvider>
        <AdminHashRouter basename={basename}>
          <AdminContext
            basename={isInRouter ? basename : undefined}
            i18nProvider={i18nProvider}
            dataProvider={dataProvider}
            authProvider={authProvider}
            lightTheme={lightTheme}
            darkTheme={darkTheme}
            store={store}
            queryClient={queryClient}
          >
            <DynamicAdminUI
              catchAll={NotFound}
              layout={SchemaLayoutWithSlots}
              loginPage={effectiveAuthPage}
              requireAuth={true}
              ready={Loading}
              notification={Notification}
              dashboard={dashboard}
              disableTelemetry
            >
              {children}
              <CustomRoutes noLayout>
                <Route path="/reset-password/:token" element={effectiveResetPasswordPage} />
                <Route path="/logout" element={<LogoutPage />} />
              </CustomRoutes>
            </DynamicAdminUI>
          </AdminContext>
        </AdminHashRouter>
      </UnsavedChangesProvider>
    </SchemaLayoutBindingContext.Provider>
  );
};

export type SchemaAdminProps = Omit<
  SchemaAdminRuntimeProps,
  'dashboard' | 'store' | 'defaultLocale'
> & {
  // React Admin & schema
  dashboard?: SchemaAdminRuntimeProps['dashboard'];
  serviceConfigMap: Readonly<ServiceConfigMap>;
  // Builds the data provider once the schemas are known — the library calls it as
  // `dataProviderFactory(servicesSchema, authProvider.getAuthHeaders)`, so pass the function
  // itself rather than pre-binding. Defaults to the built-in `getDataProviderFactory`, which
  // speaks the Habarico REST contract; supply your own only for a backend that does not.
  dataProviderFactory?: (
    servicesSchema: ServicesSchema,
    getAuthHeaders: () => Record<string, string>
  ) => ServiceDataProvider;
  authProvider: ServiceAuthProvider;
  // Builds the schema provider — the library calls it as
  // `schemaProviderFactory(authProvider.getAuthHeaders)`, so pass the function itself rather than
  // pre-binding. Defaults to the built-in `getSchemaProvider`. A package extending the library
  // supplies its own: `habarico-enterprise` returns the built-in one plus the aggregate schema
  // endpoint only a paid backend serves.
  schemaProviderFactory?: (getAuthHeaders: () => Record<string, string>) => SchemaProvider;
  // Store keys mirrored to the backend `user-preferences` endpoint. Defaults to
  // `PREFERENCES_WHITELIST`; spread it to add keys of your own rather than restating the list.
  preferencesWhitelist?: string[];
  fieldProvider?: AdminFieldProvider;
  inputProvider?: AdminInputProvider;
  validatorProvider?: AdminValidatorProvider;
  boxProvider?: AdminBoxProvider;
  buttonProvider?: AdminButtonProvider;
  clearStoreOnLogout?: boolean;

  // i18n
  availableLanguages?: AdminLanguage[];

  // Layout
  LogoComponent?: LogoComponentType;
  marketingFooter?: MarketingSlot;
  statusFooter?: StatusSlot;
  arrangement?: ArrangementSlot;
  contentMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  extraMenuItems?: ExtraMenuItem[];

  // Icons
  iconsMap?: IconsMap;

  // Auth & Account
  UpdateIdentityComponent?: FC<UpdateIdentityDialogProps> | false;
  ChangePasswordComponent?: FC<ChangePasswordDialogProps> | false;

  // Form
  navigationGuard?: boolean;
  draftEnabled?: boolean;
  alwaysEnableSaveButton?: boolean;

  // List
  defaultPerPage?: number;
  defaultRowAction?: 'click' | 'double-click' | 'none';
  rowTooltip?: boolean;
  columnSelector?: boolean;

  // Notifications
  notificationAutoHideDuration?: number;
};

export const SchemaAdmin = ({
  children,
  dashboard,
  serviceConfigMap,
  dataProviderFactory = getDataProviderFactory,
  authProvider,
  schemaProviderFactory = getSchemaProvider,
  preferencesWhitelist,
  fieldProvider,
  inputProvider,
  validatorProvider,
  boxProvider,
  buttonProvider,
  clearStoreOnLogout,
  availableLanguages = [],
  LogoComponent,
  marketingFooter,
  statusFooter,
  arrangement,
  contentMaxWidth = 'xl',
  extraMenuItems,
  iconsMap,
  UpdateIdentityComponent = UpdateIdentityDialog,
  ChangePasswordComponent = ChangePasswordDialog,
  defaultPerPage = 25,
  defaultRowAction,
  rowTooltip = true,
  columnSelector,
  navigationGuard = false,
  draftEnabled = false,
  alwaysEnableSaveButton = false,
  notificationAutoHideDuration = 10000,
  ...rest
}: SchemaAdminProps) => {
  const {resources, otherElements} = separateAdminChildren(children);

  // Built once from the auth provider's headers and shared by the preferences store below and the
  // schema context — both run above `<Admin>`, so there is nowhere lower to build it.
  const schemaProvider = useMemo(
    () => schemaProviderFactory(authProvider.getAuthHeaders),
    [schemaProviderFactory, authProvider]
  );

  // The signed-in user, which scopes both the per-user store and the schema fetch. Held here, above
  // `<Admin>`: bootstrapped from `authProvider.getIdentity()`, then kept current by `DynamicAdminUI`
  // (through `setUserIdentity` in `SchemaRootContext`) across sign-ins without a reload.
  const [userIdentity, setUserIdentity] = useStoreIdentity(authProvider);

  // The RA store is built here — above `<Admin>` and above `SchemaRootContextProvider` — so the persisted
  // locale can seed the very first schema fetch (which runs in `SchemaRootContextProvider`, outside
  // `<Admin>` where `useLocaleState` is unavailable).
  const store = useSchemaAdminStore({
    identity: userIdentity,
    schemaProvider,
    serviceConfigMap,
    clearStoreOnLogout,
    preferencesWhitelist,
  });

  // Locale — single source of truth is the RA store (persisted under the `locale` key, which the
  // per-user store also mirrors globally so it is readable before identity resolves). `useSync-
  // ExternalStore` seeds the schema-fetch / i18n locale from the store (no browser-default →
  // persisted blink) and re-reads it whenever the store changes (identity resolves → per-user store)
  // or the persisted locale changes (language switch inside `<Admin>` writes it) — so a switch
  // refetches the schemas.
  const browserDefaultLocale =
    findClosestLanguage(navigator.languages[0], availableLanguages)?.locale || 'cs-CZ';
  const locale = useSyncExternalStore(
    useCallback((onStoreChange) => store.subscribe('locale', onStoreChange), [store]),
    () => store.getItem<string>('locale', browserDefaultLocale) ?? browserDefaultLocale
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider locale={locale}>
        <AdminConfigProvider
          logo={LogoComponent ? {Component: LogoComponent} : undefined}
          menu={UNUSED_MENU}
          availableLanguages={availableLanguages}
          marketing={marketingFooter}
          status={statusFooter}
          contentMaxWidth={contentMaxWidth}
          arrangement={arrangement}
          columnSelector={columnSelector || false}
          updateIdentity={UpdateIdentityComponent ? <UpdateIdentityComponent /> : false}
          changePassword={ChangePasswordComponent ? <ChangePasswordComponent /> : false}
          navigationGuard={navigationGuard}
          draftEnabled={draftEnabled}
          alwaysEnableSaveButton={alwaysEnableSaveButton}
          defaultPerPage={defaultPerPage}
          notificationAutoHideDuration={notificationAutoHideDuration}
          iconsMap={iconsMap}
        >
          <SchemaRootContextProvider
            value={{
              serviceConfigMap,
              schemaProvider,
              dataProviderFactory,
              authProvider,
              fieldProvider,
              defaultFieldProvider,
              inputProvider,
              defaultInputProvider,
              validatorProvider,
              defaultValidatorProvider,
              boxProvider,
              defaultBoxProvider,
              buttonProvider,
              defaultButtonProvider,
              defaultViewProvider,
              resources,
              defaultRowAction: defaultRowAction || 'click',
              rowTooltip,
              locale,
              hasDashboard: dashboard !== undefined,
              userIdentity,
              setUserIdentity,
            }}
          >
            <FormExtensionsProvider>
              <SchemaAdminRuntime
                store={store}
                defaultLocale={locale}
                dashboard={dashboard}
                extraMenuItems={extraMenuItems}
                {...rest}
              >
                {otherElements}
              </SchemaAdminRuntime>
            </FormExtensionsProvider>
          </SchemaRootContextProvider>
        </AdminConfigProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
};
