import englishBase from 'ra-language-english';
import {describe, expect, it} from 'vitest';
import {messages} from '@foundation/utils/locale';

// The installed react-admin English package is the reference for the full set of
// `ra.*` translation keys (it tracks the installed react-admin version). Every
// supported locale must define every one of these keys so the UI is fully
// localized and nothing falls back to the raw key / English default at runtime.
// See HAB-555.

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
};

const referenceKeys = flattenKeys(englishBase.ra);

describe('locale completeness', () => {
  it.each(Object.keys(messages))('locale "%s" defines every react-admin ra.* key', (locale) => {
    const localeKeys = new Set(flattenKeys(messages[locale].ra));
    const missing = referenceKeys.filter((key) => !localeKeys.has(key));

    expect(missing, `locale "${locale}" is missing ra keys: ${missing.join(', ')}`).toEqual([]);
  });
});
