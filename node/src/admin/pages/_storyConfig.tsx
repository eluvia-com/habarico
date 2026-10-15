// Story-support harness (HAB-668). NOT exported from the `@admin` barrel and never shipped.
// Since `iconsMap` now lives in `AdminConfig` (read via `useIcons`), the isolated field / input
// story kits — which render a single field/input on `CoreAdminContext`, without an admin root and
// thus without `AdminConfigProvider` — need a lightweight way to seed the icon registry. This
// provides the minimal `AdminConfig` those stories require, carrying just the icons.
import React, {ReactNode} from 'react';
import {AdminConfig, AdminConfigContext} from '@admin/contexts/AdminConfigContext';
import {IconsMap} from '@typing';

const BASE_CONFIG: Omit<AdminConfig, 'iconsMap'> = {
  menu: {items: []},
  navigationGuard: false,
  draftEnabled: false,
  defaultPerPage: 25,
  notificationAutoHideDuration: 10000,
};

export const StoryAdminConfigProvider = ({
  iconsMap,
  children,
}: {
  iconsMap?: IconsMap;
  children: ReactNode;
}) => (
  <AdminConfigContext.Provider value={{...BASE_CONFIG, iconsMap}}>
    {children}
  </AdminConfigContext.Provider>
);
