import {type ReactNode, createContext, useContext} from 'react';
import {
  type ArrangementSlot,
  type BreadcrumbsSlot,
  type LogoSlot,
  type MarketingSlot,
  type MenuSlot,
  type SearchSlot,
  type StatusSlot,
} from '@design/layouts/types';
import {AdminLanguage, IconsMap} from '@typing';

// The shared, schema-agnostic app-shell config carried down to the stable module-level layout /
// login components React Admin renders (they can't take these as props, so they read the context).
// Provided by the admin root (`BaseAdmin`; and, once bridged, `SchemaAdmin`). Extracted out of
// `BaseAdmin/` so it can be the single app-config context both entry points share.
export type AdminConfig = {
  logo?: LogoSlot;
  menu: MenuSlot;
  availableLanguages?: AdminLanguage[];
  search?: SearchSlot;
  marketing?: MarketingSlot;
  status?: StatusSlot;
  breadcrumbs?: BreadcrumbsSlot;
  contentMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  arrangement?: ArrangementSlot;
  columnSelector?: boolean;
  onLogout?: () => void;
  updateIdentity?: ReactNode | false;
  changePassword?: ReactNode | false;
  navigationGuard: boolean;
  draftEnabled: boolean;
  alwaysEnableSaveButton?: boolean;
  defaultPerPage: number;
  notificationAutoHideDuration: number;
  iconsMap?: IconsMap;
};

export const AdminConfigContext = createContext<AdminConfig | null>(null);

export const useAdminConfig = (): AdminConfig => {
  const config = useContext(AdminConfigContext);
  if (!config) {
    throw new Error('AdminConfig context is missing (rendered outside an admin root).');
  }
  return config;
};
