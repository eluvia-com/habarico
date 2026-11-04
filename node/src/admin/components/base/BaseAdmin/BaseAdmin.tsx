import React, {ComponentType, FC, ReactNode, useMemo} from 'react';
import {
  AdminContext,
  AdminUI,
  AuthProvider,
  CustomRoutes,
  DashboardComponent as DashboardComponentType,
  DataProvider,
  Store,
} from 'react-admin';
import {Route, useInRouterContext} from 'react-router-dom';
import {NotFound} from '@admin/components/common/NotFound';
import {Notification} from '@admin/components/common/Notification';
import {AdminConfigProvider} from '@admin/contexts/AdminConfigContext';
import {FormExtensionsProvider} from '@admin/contexts/FormExtensionsContext';
import {UnsavedChangesProvider} from '@admin/contexts/UnsavedChangesContext';
import {useGetI18nProvider} from '@admin/hooks/useGetI18nProvider';
import {useStoreIdentity} from '@admin/hooks/useStoreIdentity';
import {withRaDefaults} from '@admin/theme';
import {
  BreadcrumbsSlot,
  LogoSlot,
  MarketingSlot,
  MenuSlot,
  SearchSlot,
  StatusSlot,
} from '@design/layouts/types';
import {createDarkTheme, createLightTheme} from '@design/theme';
import {findClosestLanguage} from '@foundation/utils/locale';
import {Theme} from '@mui/material';
import {AdminLanguage, IconsMap} from '@typing';
import {
  ChangePasswordDialog,
  type ChangePasswordDialogProps,
} from '../../auth/ChangePasswordDialog';
import {LogoutPage} from '../../auth/LogoutPage';
import {ResetPasswordPage} from '../../auth/ResetPasswordPage';
import {
  UpdateIdentityDialog,
  type UpdateIdentityDialogProps,
} from '../../auth/UpdateIdentityDialog';
import {AdminHashRouter} from '../AdminHashRouter';
import {BaseAdminAuthPage} from './BaseAdminAuthPage';
import {BaseAdminLayout} from './BaseAdminLayout';
import {IdentitySync} from './IdentitySync';
import {useAdminStore} from './useAdminStore';

// ----------------------------------------------------------------------------
// BaseAdmin — the schema-free entry point. The admin-layer analogue of
// `SchemaAdmin`: it boots a plain React Admin `<Admin>` (no schema fetching /
// `DynamicAdminUI`), styled into the design layouts, and wires the auth routes.
// The layout / login page / i18n / config context are extracted into sibling
// modules in this folder; this file is only the public boot + props.
// ----------------------------------------------------------------------------

export type BaseAdminProps = {
  // React Admin
  dataProvider: DataProvider;
  authProvider?: AuthProvider;
  children?: ReactNode;
  // Optional store override. When omitted, `BaseAdmin` builds a per-user store internally via
  // `useAdminStore`; provide one only to inject a custom store (e.g. `memoryStore()` in stories).
  store?: Store;
  basename?: string;
  lightTheme?: object;
  darkTheme?: object;
  dashboard?: DashboardComponentType;
  disableTelemetry?: boolean;
  // i18n
  availableLanguages?: AdminLanguage[];
  defaultLocale?: string;
  // Layout
  logo?: LogoSlot;
  menu: MenuSlot;
  search?: SearchSlot;
  marketing?: MarketingSlot;
  status?: StatusSlot;
  breadcrumbs?: BreadcrumbsSlot;
  contentMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  // Icons
  iconsMap?: IconsMap;
  // Auth & Account
  requireAuth?: boolean;
  onLogout?: () => void;
  // Account dialogs. Each is a full dialog component (not just a form) — the layout injects its
  // `open` / `onClose` — so an override replaces the whole dialog. `false` hides the menu item.
  // (Same shape as `SchemaAdmin`'s `UpdateIdentityComponent` / `ChangePasswordComponent`.)
  UpdateIdentityComponent?: FC<UpdateIdentityDialogProps> | false;
  ChangePasswordComponent?: FC<ChangePasswordDialogProps> | false;
  // Form
  navigationGuard?: boolean;
  draftEnabled?: boolean;
  alwaysEnableSaveButton?: boolean;
  // List
  defaultPerPage?: number;
  // Notifications
  notification?: ComponentType;
  notificationAutoHideDuration?: number;
};

export const BaseAdmin = ({
  dataProvider,
  authProvider,
  children,
  store: storeProp,
  basename,
  lightTheme: lightThemeProp,
  darkTheme: darkThemeProp,
  dashboard,
  disableTelemetry = true,
  availableLanguages = [],
  defaultLocale,
  logo,
  menu,
  search,
  marketing,
  status,
  breadcrumbs,
  contentMaxWidth,
  iconsMap,
  requireAuth = true,
  onLogout,
  UpdateIdentityComponent = UpdateIdentityDialog,
  ChangePasswordComponent = ChangePasswordDialog,
  navigationGuard = false,
  draftEnabled = false,
  alwaysEnableSaveButton = false,
  defaultPerPage = 25,
  notification = Notification,
  notificationAutoHideDuration = 10000,
}: BaseAdminProps) => {
  const resolvedDefaultLocale =
    defaultLocale ??
    findClosestLanguage(navigator.languages[0], availableLanguages)?.locale ??
    'en';

  const i18nProvider = useGetI18nProvider(availableLanguages, resolvedDefaultLocale);

  // The signed-in user the internal store is scoped to: bootstrapped from
  // `authProvider.getIdentity()`, then kept current by `IdentitySync` inside the React Admin
  // context across sign-ins without a reload.
  const [identity, setIdentity] = useStoreIdentity(authProvider);
  const internalStore = useAdminStore(identity);
  const store = storeProp ?? internalStore;
  // Without a router of the application's, `AdminHashRouter` provides it and takes the basename.
  const isInRouter = useInRouterContext();

  // Always run the RA defaults, even over a caller-supplied theme — `lightTheme`/`darkTheme` stay
  // `object` (mirroring RA's own loose `<Admin>` theme prop) rather than `Theme`, since a caller may
  // pass raw `ThemeOptions` rather than a built theme.
  //
  // Memoized on the incoming props, as `SchemaAdminRuntime` does and for the same reason: React
  // Admin's `ThemeProvider` keys its `createTheme()` cache on the theme object's identity, so a
  // fresh one on every render re-creates the MUI theme and re-renders (and re-serializes every `sx`
  // in) the whole admin below it. An application passing its theme inline
  // (`lightTheme={createLightTheme()}`) still defeats this — memoize it at the call site too.
  const lightTheme = useMemo(
    () => withRaDefaults((lightThemeProp ?? createLightTheme()) as Theme),
    [lightThemeProp]
  );
  const darkTheme = useMemo(
    () => withRaDefaults((darkThemeProp ?? createDarkTheme()) as Theme),
    [darkThemeProp]
  );

  return (
    <AdminConfigProvider
      logo={logo}
      menu={menu}
      availableLanguages={availableLanguages}
      search={search}
      marketing={marketing}
      status={status}
      breadcrumbs={breadcrumbs}
      contentMaxWidth={contentMaxWidth}
      onLogout={onLogout}
      updateIdentity={UpdateIdentityComponent ? <UpdateIdentityComponent /> : false}
      changePassword={ChangePasswordComponent ? <ChangePasswordComponent /> : false}
      navigationGuard={navigationGuard}
      draftEnabled={draftEnabled}
      alwaysEnableSaveButton={alwaysEnableSaveButton}
      defaultPerPage={defaultPerPage}
      notificationAutoHideDuration={notificationAutoHideDuration}
      iconsMap={iconsMap}
    >
      <FormExtensionsProvider>
        <UnsavedChangesProvider>
          <AdminHashRouter basename={basename}>
            {/* `<Admin>` split into its context and UI, so `IdentitySync` can run between them. */}
            <AdminContext
              dataProvider={dataProvider}
              authProvider={authProvider}
              store={store}
              basename={isInRouter ? basename : undefined}
              i18nProvider={i18nProvider}
              lightTheme={lightTheme}
              darkTheme={darkTheme}
            >
              <IdentitySync onChange={setIdentity} />
              <AdminUI
                layout={BaseAdminLayout}
                loginPage={BaseAdminAuthPage}
                dashboard={dashboard}
                requireAuth={requireAuth}
                catchAll={NotFound}
                notification={notification}
                disableTelemetry={disableTelemetry}
              >
                {children}
                <CustomRoutes noLayout>
                  <Route
                    path="/reset-password/:token"
                    element={
                      <ResetPasswordPage logo={logo} availableLanguages={availableLanguages} />
                    }
                  />
                  <Route path="/logout" element={<LogoutPage />} />
                </CustomRoutes>
              </AdminUI>
            </AdminContext>
          </AdminHashRouter>
        </UnsavedChangesProvider>
      </FormExtensionsProvider>
    </AdminConfigProvider>
  );
};
