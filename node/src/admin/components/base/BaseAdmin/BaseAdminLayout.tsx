import React from 'react';
import {CoreLayoutProps} from 'react-admin';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {DashboardContent} from '@design/layouts/dashboard';
import {AdminDashboardLayout} from '../../layouts/AdminDashboardLayout';

/**
 * Thin wrapper passed to `<Admin layout>`: it only maps the BaseAdmin config onto the
 * `AdminDashboardLayout` shell props and wraps the routed view in the base-admin content container
 * (`DashboardContent` — plain React Admin views bring no container of their own, unlike the schema
 * views). The cross-cutting concerns (current identity, locale and the date `LocaleProvider`) are
 * owned by `AdminDashboardLayout` itself.
 */
export const BaseAdminLayout = ({children}: CoreLayoutProps) => {
  const config = useAdminConfig();
  return (
    <AdminDashboardLayout
      logo={config.logo}
      menu={config.menu}
      availableLanguages={config.availableLanguages}
      search={config.search}
      marketing={config.marketing}
      status={config.status}
      breadcrumbs={config.breadcrumbs}
      arrangement={config.arrangement}
      updateIdentity={config.updateIdentity}
      changePassword={config.changePassword}
      onLogout={config.onLogout}
    >
      <DashboardContent maxWidth={config.contentMaxWidth}>{children}</DashboardContent>
    </AdminDashboardLayout>
  );
};
