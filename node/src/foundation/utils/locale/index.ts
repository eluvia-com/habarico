import {AdminLanguage} from '@typing';
import {csMessages} from './cs';
import {deMessages} from './de';
import {enMessages} from './en';
import {esMessages} from './es';
import {frMessages} from './fr';
import {itMessages} from './it';
import {jaMessages} from './ja';
import {nlMessages} from './nl';
import {plMessages} from './pl';
import {ptMessages} from './pt';
import {roMessages} from './ro';
import {skMessages} from './sk';
import {LocaleMessages} from './types';
import {ukMessages} from './uk';

export const messages: {[locale: string]: LocaleMessages} = {
  en: enMessages,
  cs: csMessages,
  de: deMessages,
  sk: skMessages,
  es: esMessages,
  fr: frMessages,
  it: itMessages,
  pl: plMessages,
  uk: ukMessages,
  nl: nlMessages,
  pt: ptMessages,
  ro: roMessages,
  ja: jaMessages,
};

export const findClosestLanguage = (userLocale: string, languages?: AdminLanguage[]) => {
  // Get closest locale from supported locales

  // Normalize to lowercase for comparison
  const normalizedUser = userLocale.toLowerCase();

  if (!languages) {
    return;
  }

  // 1. Exact match
  const exact = languages.find((language) => language.locale.toLowerCase() === normalizedUser);
  if (exact) return exact;

  // 2. Match base language (e.g., 'en' in 'en-US')
  const userBase = normalizedUser.split('-')[0];
  const baseMatch = languages.find((language) =>
    language.locale.toLowerCase().startsWith(userBase)
  );

  if (baseMatch) return baseMatch;

  // 3. Fallback
  return languages[0];
};

type LocaleSeparators = {
  decimalSeparator: string;
  thousandRegExp: RegExp;
  decimalRegExp: RegExp;
};

// A locale's separators never change within a session, but deriving them costs two
// `Intl.NumberFormat` constructions (each loads locale data) plus two regex compilations — and
// `parseLocaleNumber` runs on every render and every keystroke of every `NumberInput`. Cached per
// locale; the handful of locales a session ever sees keeps this map tiny. Sharing the compiled `/g`
// regex across calls is safe: `String.prototype.replace` resets a global regex's `lastIndex`.
const separatorsCache = new Map<string, LocaleSeparators>();

const getLocaleSeparators = (locale: string): LocaleSeparators => {
  const cached = separatorsCache.get(locale);
  if (cached) return cached;

  const thousandSeparator = Intl.NumberFormat(locale)
    .format(11111)
    .replace(/\p{Number}/gu, '');
  const decimalSeparator = Intl.NumberFormat(locale)
    .format(1.1)
    .replace(/\p{Number}/gu, '');
  const separators: LocaleSeparators = {
    decimalSeparator,
    thousandRegExp: new RegExp('\\' + thousandSeparator, 'g'),
    decimalRegExp: new RegExp('\\' + decimalSeparator),
  };
  separatorsCache.set(locale, separators);
  return separators;
};

export const parseLocaleNumber = (value: string | number | bigint, locale: string) => {
  // Parse localized number with Intl.NumberFormat
  const {decimalSeparator, thousandRegExp, decimalRegExp} = getLocaleSeparators(locale);

  const normalizedStringValue = value
    .toString()
    .replace(thousandRegExp, '')
    .replace(decimalRegExp, '.');

  const decimalPlaces = normalizedStringValue.split('.')[1]?.length || 0;

  const endsWithDecimalSeparator =
    (normalizedStringValue.match(/\./g) || []).length === 1 && normalizedStringValue.endsWith('.');
  const parsedNumber = parseFloat(normalizedStringValue);
  const parsedString = parsedNumber.toFixed(decimalPlaces);

  return {
    number: parsedNumber,
    string: parsedString,
    lastDecimalSeparator: endsWithDecimalSeparator ? decimalSeparator : undefined,
    decimalPlaces: decimalPlaces,
    isNan: isNaN(Number(parsedString)),
  };
};
