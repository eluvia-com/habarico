import polyglotI18nProvider from 'ra-i18n-polyglot';
import type {LayoutLanguage} from '@design/layouts/types';
import {csMessages} from '@foundation/utils/locale/cs';
import {enMessages} from '@foundation/utils/locale/en';

/**
 * Shared i18n setup for the admin-layer story harness. `language-COUNTRY` locales (matching the
 * design mock / production convention): react-admin uses the full locale, the i18n dictionaries key
 * on the base language (`en` / `cs`), and the header `LanguagePopover` derives the flag from the
 * region subtag (`en-GB` → `GB`, `cs-CZ` → `CZ`).
 */
export const LANGUAGES: LayoutLanguage[] = [
  {title: 'English', locale: 'en-GB'},
  {title: 'Čeština', locale: 'cs-CZ'},
];

// The layer's own i18n dictionaries, wired as the react-admin i18n provider so the translated shell
// labels — and the language switch — resolve. Keyed by base language, so the region-tagged locales
// resolve via `locale.split('-')[0]`. Only the two locales the harness offers are loaded directly
// (importing the full `@foundation/utils/locale` barrel would also pull the `ja` dictionary, whose
// CJS language pack breaks Storybook's rolldown build).
const HARNESS_MESSAGES: Record<string, typeof enMessages> = {en: enMessages, cs: csMessages};

export const i18nProvider = polyglotI18nProvider(
  (locale: string) => HARNESS_MESSAGES[locale.split('-')[0]] ?? enMessages,
  'en-GB',
  {allowMissing: true}
);
