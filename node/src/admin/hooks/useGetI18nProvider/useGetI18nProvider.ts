import {merge} from 'lodash-es';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import {useMemo} from 'react';
import type {I18nProvider} from 'react-admin';
import {messages} from '@foundation/utils/locale';
import {AdminLanguage, DataType} from '@typing';

/**
 * Builds the polyglot i18n provider from the bundled message dictionaries merged with any
 * per-language overrides. The default locale is passed in (seeded from the RA store — the single
 * source of truth for locale) rather than read from a context, so the i18n provider and the store
 * agree on the very first paint. Shared by `SchemaAdmin` and `BaseAdmin`.
 */
export const useGetI18nProvider = (
  languages?: AdminLanguage[],
  defaultLocale = 'en'
): I18nProvider =>
  useMemo(() => {
    if (!languages || languages.length === 0)
      return polyglotI18nProvider((locale) => messages[locale], defaultLocale, {
        allowMissing: true,
      });

    const polyglotMessages: DataType = {};
    languages.forEach((lang) => {
      polyglotMessages[lang.locale] = merge(
        {},
        messages[lang.locale.split('-')[0].toLowerCase()] || {},
        lang.messages || {}
      );
    });

    return polyglotI18nProvider((locale) => polyglotMessages[locale], defaultLocale, {
      allowMissing: true,
    });
  }, [languages, defaultLocale]);
