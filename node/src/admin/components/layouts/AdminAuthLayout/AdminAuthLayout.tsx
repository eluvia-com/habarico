import React, {ReactNode} from 'react';
import {AuthLayout} from '@design/layouts/auth';
import {SettingsProvider} from '@design/layouts/contexts/SettingsContext';
import {
  type AppearanceSlot,
  type HelpSlot,
  type LayoutLanguage,
  type LogoSlot,
} from '@design/layouts/types';
import {LocaleProvider} from '@design/theme';
import {useAdminSettings} from '../../settings';

export type AdminAuthLayoutProps = {
  /** The auth screen content (login / reset form, etc.). */
  children: ReactNode;
  logo?: LogoSlot;
  /**
   * Languages offered by the header switcher. When set (and ≥ 2), the `LanguagePopover` is shown;
   * selecting one flips the react-admin locale (via the settings bridge) and re-translates the page.
   */
  availableLanguages?: LayoutLanguage[];
  /** Colour-mode toggle in the header. Enabled by default. */
  appearance?: AppearanceSlot;
  help?: HelpSlot;
};

/**
 * The admin-layer auth shell: React Admin restyled into the design `AuthLayout`. It is the
 * counterpart of `AdminDashboardLayout` for unauthenticated pages (login, reset password) — it
 * provides the presentational settings context (`SettingsProvider`) from the react-admin settings
 * bridge (`useAdminSettings`), so the header language switcher and colour-mode toggle are wired:
 * switching a language flips the react-admin locale and re-translates the page.
 *
 * Auth shells only consume the settings context, so this uses `SettingsProvider` directly rather
 * than the full `LayoutProvider` (which also carries the dynamic breadcrumbs / current-user /
 * notifications state the dashboard needs but an auth page does not).
 *
 * Like `AdminDashboardLayout`, it wraps its content in the design `LocaleProvider` keyed on the
 * react-admin locale so any date inputs on an auth page follow the header language switch — auth
 * pages render outside `AdminDashboardLayout`, so they need their own date-locale provider.
 */
export const AdminAuthLayout = ({
  children,
  logo,
  availableLanguages,
  appearance = true,
  help,
}: AdminAuthLayoutProps) => {
  const settings = useAdminSettings(availableLanguages);
  return (
    <SettingsProvider value={settings}>
      <AuthLayout
        logo={logo}
        language={availableLanguages ? {availableLanguages} : undefined}
        appearance={appearance}
        help={help}
      >
        <LocaleProvider locale={settings.locale ?? undefined}>{children}</LocaleProvider>
      </AuthLayout>
    </SettingsProvider>
  );
};
