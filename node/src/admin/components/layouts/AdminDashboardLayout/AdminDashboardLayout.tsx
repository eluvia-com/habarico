import React, {
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useMemo,
  useState,
} from 'react';
import {useGetIdentity, useTranslate} from 'react-admin';
import {useBasenameNavigate} from '@admin/hooks/useBasenameNavigate';
import {Icon, IconType} from '@design/atoms/Icon';
import {LayoutProvider} from '@design/layouts/contexts/LayoutProvider';
import {DashboardLayout} from '@design/layouts/dashboard';
import {
  ArrangementSlot,
  BreadcrumbsSlot,
  LayoutAccountMenuItem,
  LayoutLanguage,
  LogoSlot,
  MarketingSlot,
  MenuSlot,
  SearchSlot,
  StatusSlot,
} from '@design/layouts/types';
import {LocaleProvider} from '@design/theme';
import {CssBaseline} from '@mui/material';
import {AdminSettingsStyles, useAdminSettings} from '../../settings';

export type AdminDashboardLayoutProps = {
  /** The routed React Admin view (React Admin passes it as the layout's `children`). */
  children: ReactNode;
  logo?: LogoSlot;
  menu: MenuSlot;
  /**
   * Languages offered by the header switcher. When set (and ≥ 2), the `LanguagePopover` is shown;
   * selecting one flips the react-admin locale (via the settings bridge) and re-translates the shell.
   */
  availableLanguages?: LayoutLanguage[];
  search?: SearchSlot;
  /** Breadcrumbs feature slot — `true` for the default trail, or `{Component}` for a custom one. */
  breadcrumbs?: BreadcrumbsSlot;
  marketing?: MarketingSlot;
  status?: StatusSlot;
  /**
   * Page-arrangement slot (page-width `full` / `centered`). The Layout section is always shown in the
   * settings panel; pass a slot to also surface the toggle in the header (`{header: true}`), set a
   * tooltip or override labels. This layer merges its own translated labels in.
   */
  arrangement?: ArrangementSlot;
  /** The "update identity" account dialog node; when set, the account item is shown. */
  updateIdentity?: ReactNode | false;
  /** The "change password" account dialog node; when set, the account item is shown. */
  changePassword?: ReactNode | false;
  /** Logout action for the account menu. Defaults to navigating to `/logout`. */
  onLogout?: () => void;
};

// Injects the layout-owned `open` state and `onClose` handler into an account dialog node (the
// default dialogs — or a caller's override — accept `open` / `onClose` and close themselves on a
// successful submit). Non-element nodes are returned untouched.
const withDialogControls = (node: ReactNode, open: boolean, onClose: () => void): ReactNode => {
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<{open?: boolean; onClose?: () => void}>;
  return cloneElement(element, {open, onClose});
};

/**
 * The admin-layer app shell: React Admin restyled into the design `DashboardLayout`. It owns the
 * cross-cutting admin chrome so consumers (the story harness, or the schema layer's `SchemaLayout`)
 * only feed it presentational slots:
 *
 * - **settings + i18n** — from `useAdminSettings` (the react-admin ⇄ SettingsContext bridge, which
 *   also owns the current locale); the settings-panel labels are translated via `useTranslate`, and
 *   the header language switcher flips the react-admin locale and re-translates the shell;
 * - **account menu + auth dialogs** — it builds the account menu (update identity / change password
 *   / logout), owns each dialog's open state, and renders the dialog nodes passed via
 *   `updateIdentity` / `changePassword` (self-contained dialogs), injecting `open` / `onClose`;
 * - **current user + date locale** — it reads the signed-in identity (`useGetIdentity`) for the
 *   account header, and wraps its content in the design `LocaleProvider` keyed on the react-admin
 *   locale so date inputs follow the header language switch. Callers only feed presentational slots.
 *
 * React Admin's `layout` prop expects a `ComponentType<CoreLayoutProps>`; because this component
 * takes shell configuration as props, wrap it in a small closure at the call site that forwards
 * `children` and supplies the slots.
 */
export const AdminDashboardLayout = ({
  children,
  logo,
  menu,
  availableLanguages,
  search,
  breadcrumbs,
  marketing,
  status,
  arrangement,
  updateIdentity,
  changePassword,
  onLogout,
}: AdminDashboardLayoutProps) => {
  const translate = useTranslate();
  const navigate = useBasenameNavigate();
  const settings = useAdminSettings(availableLanguages);
  const {identity} = useGetIdentity();

  // --------------------------------------------------------------------------
  // Account menu
  // --------------------------------------------------------------------------

  const [isUpdateIdentityOpen, setIsUpdateIdentityOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const hasUpdateIdentity = updateIdentity !== undefined && updateIdentity !== false;
  const hasChangePassword = changePassword !== undefined && changePassword !== false;

  // Account menu — update identity / change password (each opens its dialog) + logout.
  const accountMenuItems: LayoutAccountMenuItem[] = useMemo(() => {
    const items: LayoutAccountMenuItem[] = [];
    if (hasUpdateIdentity) {
      items.push({
        title: translate('ra.auth.update_identity'),
        onClick: () => setIsUpdateIdentityOpen(true),
        icon: <Icon width={22} icon={IconType.Badge} />,
      });
    }
    if (hasChangePassword) {
      items.push({
        title: translate('ra.auth.change_password'),
        onClick: () => setIsChangePasswordOpen(true),
        icon: <Icon width={22} icon={IconType.Security} />,
      });
    }
    items.push({
      title: translate('ra.auth.logout'),
      onClick: onLogout ?? (() => navigate('/logout')),
      tag: 'logout',
    });
    return items;
  }, [translate, navigate, onLogout, hasUpdateIdentity, hasChangePassword]);

  // --------------------------------------------------------------------------
  // Labels
  // --------------------------------------------------------------------------

  const settingsLabels = useMemo(
    () => ({
      title: translate('ra.settings.title'),
      subtitle: translate('ra.settings.subtitle'),
      reset: translate('ra.settings.reset'),
    }),
    [translate]
  );
  const appearanceLabels = useMemo(
    () => ({
      section: translate('ra.settings.appearance'),
      colorMode: translate('ra.settings.color_mode'),
      light: translate('ra.settings.light'),
      dark: translate('ra.settings.dark'),
      contrastMode: translate('ra.settings.contrast_mode'),
    }),
    [translate]
  );
  const arrangementLabels = useMemo(
    () => ({
      section: translate('ra.settings.layout'),
      pageWidth: translate('ra.settings.page_width'),
      pageWidthFull: translate('ra.settings.page_width_full'),
      pageWidthCentered: translate('ra.settings.page_width_centered'),
    }),
    [translate]
  );
  const tableLabels = useMemo(
    () => ({
      section: translate('ra.settings.table'),
      stripedRows: translate('ra.settings.striped_rows'),
      density: translate('ra.settings.density'),
      densityCompact: translate('ra.settings.density_compact'),
      densityNormal: translate('ra.settings.density_normal'),
      densityComfortable: translate('ra.settings.density_comfortable'),
    }),
    [translate]
  );

  // The Layout section is always available in the settings panel (so `arrangement` is always passed);
  // the app-config slot can add header / tooltip / label overrides on top. Our translated labels are
  // the base, with any caller-provided label overriding per key.
  const arrangementConfig = arrangement === true ? {} : (arrangement ?? {});
  const arrangementSlot = {
    ...arrangementConfig,
    labels: {...arrangementLabels, ...arrangementConfig.labels},
  };

  return (
    <>
      <CssBaseline />
      <AdminSettingsStyles />
      <LayoutProvider settings={settings} currentUser={identity ?? null}>
        <DashboardLayout
          logo={logo}
          menu={menu}
          account={{menuItems: accountMenuItems}}
          language={availableLanguages ? {availableLanguages} : undefined}
          search={search}
          breadcrumbs={breadcrumbs}
          marketing={marketing}
          status={status}
          notifications
          appearance={{labels: appearanceLabels}}
          arrangement={arrangementSlot}
          table={{labels: tableLabels}}
          settings={{labels: settingsLabels}}
        >
          <LocaleProvider locale={settings.locale ?? undefined}>{children}</LocaleProvider>
        </DashboardLayout>
      </LayoutProvider>

      {hasUpdateIdentity &&
        withDialogControls(updateIdentity, isUpdateIdentityOpen, () =>
          setIsUpdateIdentityOpen(false)
        )}
      {hasChangePassword &&
        withDialogControls(changePassword, isChangePasswordOpen, () =>
          setIsChangePasswordOpen(false)
        )}
    </>
  );
};
