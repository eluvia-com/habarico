import {FC, ReactNode} from 'react';
import {BoxProps} from '@mui/material';

// ----------------------------------------------------------------------------
// Different labels used mainly in the settings panel
// ----------------------------------------------------------------------------

export type SettingsLabels = {
  title: string;
  subtitle?: string;
  reset: string;
};

export type AppearanceLabels = {
  section: string;
  colorMode: string;
  light: string;
  dark: string;
  contrastMode: string;
};

export type ArrangementLabels = {
  section: string;
  pageWidth: string;
  pageWidthFull: string;
  pageWidthCentered: string;
};

export type TableLabels = {
  section: string;
  stripedRows: string;
  density: string;
  densityCompact: string;
  densityNormal: string;
  densityComfortable: string;
};

export type StatusLabels = {
  version: string;
  environment: string;
};

export type NotificationsLabels = {
  title: string;
  unread: string; // rendered as the subtitle, e.g. "3 unread"
  new: string;
  beforeThat: string;
  viewAll: string;
};

// ----------------------------------------------------------------------------
// Interface of the components which can be overridden by the app shell slots.
// ----------------------------------------------------------------------------

export type LogoComponentProps = BoxProps & {
  inverted?: boolean;
  monochromatic?: boolean;
  icon?: boolean;
  color?: string;
  background?: string;
  href?: string;
  disableLink?: boolean;
};

export type LogoComponentType = FC<LogoComponentProps>;

export type MenuComponentProps = {
  items: LayoutMenuItem[];
  collapsed?: boolean;
  onItemClick?: (item: LayoutMenuItem) => void;
};

export type MenuComponentType = FC<MenuComponentProps>;

export type SearchContentComponentProps = {
  open: boolean;
  onClose: () => void;
};

export type SearchComponentType = FC<SearchContentComponentProps>;

export type BreadcrumbsComponentProps = {
  icon?: ReactNode;
  items?: LayoutBreadcrumb[];
};

export type BreadcrumbsComponentType = FC<BreadcrumbsComponentProps>;

export type HelpComponentType = FC;

export type SettingsComponentProps = {
  open: boolean;
  onClose: () => void;
  labels?: Partial<SettingsLabels>;
  appearance?: AppearanceSlot;
  arrangement?: ArrangementSlot;
  table?: TableSlot;
};

export type SettingsComponentType = FC<SettingsComponentProps>;

// ----------------------------------------------------------------------------
// Feature slots — presence enables the feature; the object carries its config.
// ----------------------------------------------------------------------------

// Slots with required config.

export type LogoSlot = {Component: LogoComponentType};

export type MenuSlot = {items: LayoutMenuItem[]; Component?: MenuComponentType};

export type AccountSlot = {menuItems: LayoutAccountMenuItem[]};

export type WorkspacesSlot = {items: LayoutWorkspace[]};

export type LanguageSlot = {availableLanguages: LayoutLanguage[]};

// Slots whose config is all-optional: pass `true` (or omit the object) to enable
// with defaults — e.g. `<DashboardLayout appearance />` instead of `appearance={{}}`.

export type AppearanceSlot =
  true | {labels?: Partial<AppearanceLabels>; tooltip?: string; header?: boolean};

export type ArrangementSlot =
  true | {labels?: Partial<ArrangementLabels>; tooltip?: string; header?: boolean};

export type TableSlot = true | {labels?: Partial<TableLabels>};

export type NotificationsSlot =
  true | {tooltip?: string; labels?: Partial<NotificationsLabels>; onViewAll?: () => void};

export type SearchSlot = true | {Component?: SearchComponentType; tooltip?: string};

export type BreadcrumbsSlot = true | {Component?: BreadcrumbsComponentType; icon?: ReactNode};

export type SettingsSlot =
  true | {Component?: SettingsComponentType; labels?: Partial<SettingsLabels>; tooltip?: string};
export type HelpSlot = true | {label?: string; Component?: HelpComponentType};

export type MarketingSlot = {
  logo?: LogoComponentType;
  label?: ReactNode;
  href?: string;
};

export type StatusSlot = {
  version?: string;
  environment?: LayoutEnvironment;
  labels?: Partial<StatusLabels>;
};

// ----------------------------------------------------------------------------
// Atoms
// ----------------------------------------------------------------------------

type Identity = string | number;

export type LayoutUser = {
  id: Identity;
  fullName?: string;
  avatar?: string; // URL of the avatar image
  email?: string;
};

export type LayoutWorkspace = {
  id: Identity;
  title: string;
  logo: string; // URL of the logo image
  info?: ReactNode;
};

export type LayoutNotification = {
  id: Identity;
  type: string;
  title: string;
  isUnread: boolean;
  description: string;
  avatar?: string; // URL of the avatar image
  postedAt?: string;
};

export type LayoutLanguage = {
  title: string;
  locale: string;
};

export type LayoutBreadcrumb = {
  title: string;
  path?: string;
};

export type LayoutMenuItem = {
  title: ReactNode;
  href: string;
  // Path the current location is matched against to decide whether the item is
  // active/expanded; defaults to `href`. Needed when the link target sits deeper than
  // the section the item stands for — e.g. an item linking to a record's show view,
  // whose edit view lives one level up at the record base path.
  activePath?: string;
  icon: ReactNode;
  isActive?: (item: LayoutMenuItem) => boolean; // just a default value, do not use in runtime
  isExpanded?: (item: LayoutMenuItem) => boolean; // just a default value, do not use in runtime
  info?: ReactNode;
  items?: LayoutMenuItem[];
};

export type LayoutAccountMenuItemTag = 'logout';

export type LayoutAccountMenuItem = {
  title: string;
  path?: string;
  onClick?: (item: LayoutAccountMenuItem) => void;
  icon?: ReactNode;
  info?: ReactNode;
  tag?: LayoutAccountMenuItemTag;
};

export type LayoutSearchObjectHighlight = {
  value: string;
  label: string;
};

export type LayoutSearchObjectResult = {
  href: string;
  title: string;
  description?: string;
  highlights?: LayoutSearchObjectHighlight[];
};

export type LayoutSearchResultMeta = {
  label: string;
  icon?: ReactNode;
};

export type LayoutSearchResult = {
  meta: LayoutSearchResultMeta;
  objects: LayoutSearchObjectResult[];
};

export const LAYOUT_ENVIRONMENTS = ['dev', 'test', 'staging', 'uat', 'prod'] as const;
export type LayoutEnvironment = (typeof LAYOUT_ENVIRONMENTS)[number];
