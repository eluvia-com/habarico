import type {StringMap, TranslationMessages} from 'ra-core';

// react-admin's `TranslationMessages` fully types every `ra.*` key but has no index
// signature on `ra`, so habarico's own translation keys (e.g. `ra.list`, `ra.search`)
// can't be added without a cast. `LocaleMessages` intersects it with `StringMap` on `ra`,
// which keeps every react-admin key required - so completeness stays enforced at compile
// time - while allowing the custom keys. See HAB-555.
export type LocaleMessages = TranslationMessages & {
  ra: StringMap;
};
