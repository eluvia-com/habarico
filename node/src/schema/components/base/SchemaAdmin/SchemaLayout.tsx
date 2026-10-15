import React from 'react';
import {CoreLayoutProps, useGetIdentity, useTranslate} from 'react-admin';
import {Loading} from '@admin/components/common/Loading';
import {AdminDashboardLayout} from '@admin/components/layouts/AdminDashboardLayout';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {NoLogo} from '@design/atoms/NoLogo';
import {DashboardContent} from '@design/layouts/dashboard';
import {PortalBreadcrumbsOutlet} from '@design/layouts/shared/PortalBreadcrumbs';
import type {SearchComponentType} from '@design/layouts/types';
import {Alert} from '@mui/material';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext';
import {ExtraMenuItem} from './types';
import {useHasGlobalSearch} from './useHasGlobalSearch';
import {useSchemaMenu} from './useSchemaMenu';

export type SchemaLayoutProps = CoreLayoutProps & {
  // Custom top-level items merged into the schema-generated menu. Threaded in from `SchemaAdmin`
  // through the `layout` closure (see `SchemaAdminRuntime`), NOT the shared `AdminConfigContext`: it is a
  // schema-layer concern that feeds `useSchemaMenu`, which must run here — inside `<Admin>`, where
  // the resource definitions exist and the admin-shell config has already been assembled.
  extraMenuItems?: ExtraMenuItem[];
  // Renders the global search overlay's contents. Threaded in the same way and for the same reason:
  // it is a schema-layer concern, and the library ships no such component — the results come from an
  // endpoint the free schema does not describe, so the application supplies one.
  search?: SearchComponentType;
};

/**
 * The schema layer's app shell — a thin adapter over the admin-layer `AdminDashboardLayout`. It
 * feeds the shell the schema-derived pieces (the schema menu, global search, breadcrumbs) and the
 * app-level config from `AdminConfigContext` (logo, languages, marketing / status footers, the
 * update-identity / change-password nodes), while `AdminDashboardLayout` owns the settings / i18n
 * and the account menu / auth dialogs. The schema menu is generated here (not carried in the config)
 * and merged with `extraMenuItems` passed in as a prop.
 */
export const SchemaLayout = ({children, extraMenuItems, search}: SchemaLayoutProps) => {
  const translate = useTranslate();
  const {identity} = useGetIdentity();

  const {
    logo,
    availableLanguages,
    marketing,
    status,
    updateIdentity,
    changePassword,
    arrangement,
    contentMaxWidth,
  } = useAdminConfig();

  const {isLoaded} = useSchemaRootContext();
  // Both halves are required: a backend that advertises search, and a component that can render
  // results. Without either, the shell offers no search at all — not even the toggle or the
  // keyboard shortcut, because a shortcut that opens onto nothing is worse than no shortcut.
  const hasGlobalSearch = useHasGlobalSearch();
  const menuItems = useSchemaMenu(extraMenuItems);

  return (
    <AdminDashboardLayout
      logo={logo ?? {Component: NoLogo}}
      menu={{items: menuItems}}
      availableLanguages={availableLanguages}
      marketing={marketing}
      status={status}
      search={hasGlobalSearch && search ? {Component: search} : undefined}
      breadcrumbs={{Component: PortalBreadcrumbsOutlet}}
      arrangement={arrangement}
      updateIdentity={updateIdentity}
      changePassword={changePassword}
    >
      {identity?.originalUser && (
        <DashboardContent maxWidth={contentMaxWidth} sx={{minWidth: 320, flex: '0 0 auto', pb: 0}}>
          <Alert severity="warning" variant="filled">
            {translate('ra.auth.impersonate', {name: identity?.originalUser?.fullName})}
          </Alert>
        </DashboardContent>
      )}
      {isLoaded ? children : <Loading />}
    </AdminDashboardLayout>
  );
};
