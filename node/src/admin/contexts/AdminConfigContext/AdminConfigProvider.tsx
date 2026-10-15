import React, {ReactNode, useMemo} from 'react';
import {AdminConfig, AdminConfigContext} from './AdminConfigContext';

export type AdminConfigProviderProps = AdminConfig & {children: ReactNode};

// Builds and memoizes the app-shell config value from its fields, then provides it. Owning the memo
// here keeps the config assembly out of the admin roots — they just forward their props.
export const AdminConfigProvider = ({
  children,
  logo,
  menu,
  availableLanguages,
  search,
  marketing,
  status,
  breadcrumbs,
  contentMaxWidth,
  arrangement,
  columnSelector,
  onLogout,
  updateIdentity,
  changePassword,
  navigationGuard,
  draftEnabled,
  alwaysEnableSaveButton,
  defaultPerPage,
  notificationAutoHideDuration,
  iconsMap,
}: AdminConfigProviderProps) => {
  const value = useMemo<AdminConfig>(
    () => ({
      logo,
      menu,
      availableLanguages,
      search,
      marketing,
      status,
      breadcrumbs,
      contentMaxWidth,
      arrangement,
      columnSelector,
      onLogout,
      updateIdentity,
      changePassword,
      navigationGuard,
      draftEnabled,
      alwaysEnableSaveButton,
      defaultPerPage,
      notificationAutoHideDuration,
      iconsMap,
    }),
    [
      logo,
      menu,
      availableLanguages,
      search,
      marketing,
      status,
      breadcrumbs,
      contentMaxWidth,
      arrangement,
      columnSelector,
      onLogout,
      updateIdentity,
      changePassword,
      navigationGuard,
      draftEnabled,
      alwaysEnableSaveButton,
      defaultPerPage,
      notificationAutoHideDuration,
      iconsMap,
    ]
  );

  return <AdminConfigContext.Provider value={value}>{children}</AdminConfigContext.Provider>;
};
