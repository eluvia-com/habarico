// Story-support harness for the admin-layer FIELD stories (HAB-685). NOT exported from the `@admin`
// barrel and never shipped in the library. The read-side counterpart of `admin/inputs/_storyKit`,
// deliberately lighter: a field only *reads* the ambient record, so there is no `Form` / `useInput` /
// data fetching. It still boots `CoreAdminContext` (i18n + store) and `LocaleProvider` so the React
// Admin read hooks resolve — `useTranslate` (`BooleanField`), `useLocaleState` (`Date` / `TimeField`)
// — plus a minimal `AdminConfig` (via `StoryAdminConfigProvider`) carrying the `ChoicesField` icon
// registry that `useIcons` reads. `CoreAdminContext` (not
// `SchemaRootContext`) on purpose: `SchemaRootContext` injects React Admin's own `ThemeProvider`, which would
// override the design theme supplied by the global Storybook decorator (`.storybook/preview.ts`).
import React, {ReactNode} from 'react';
import {CoreAdminContext, Labeled, RecordContextProvider, testDataProvider} from 'react-admin';
import {LocaleProvider} from '@design/theme';
import {Card} from '@mui/material';
import type {Decorator} from '@storybook/react-vite';
import {IconsMap} from '@typing';
import {i18nProvider} from '../../pages/_i18n';
import {StoryAdminConfigProvider} from '../../pages/_storyConfig';

// A no-op data provider — display fields never fetch. Created once, shared across stories.
const dataProvider = testDataProvider();

/**
 * Shared field-story decorator: boots the minimal read-side context (record + i18n + locale + icons)
 * around a single field, bounded in a fixed-width `Card`. Seeds the ambient record from
 * `parameters.record` (so `useRecordContext` resolves) and the icon registry from `parameters.icons`.
 * Also wraps the field in React Admin's own `<Labeled>` — the same wrapper `SimpleShowLayout` and the
 * schema layer (`SchemaFieldContent`, `SchemaReferenceField`, ...) use to turn a field's `label` prop
 * into a visible heading. Without it every field story's `label` Control would be a real prop with no
 * visible effect: none of these components render their own label, only their value.
 *
 * A caller-set `emptyText` arg has the same problem: the demoed record always carries a real value,
 * so typing into the `emptyText` Control (`EmailField`, `ImageField`, `TextField`, `UrlField`) never
 * shows anything either. Whenever `args.emptyText` is a non-empty string, this blanks the demoed
 * `args.source` field on the record so the fallback text actually renders. Stories with no
 * `emptyText` control (`args.emptyText` always `undefined`) are unaffected.
 */
export const withFieldShell: Decorator = (Story, {parameters, args}) => {
  const {source, emptyText} = args as {source?: string; emptyText?: string};
  const baseRecord = parameters.record as Record<string, unknown> | undefined;
  const record = emptyText && source && baseRecord ? {...baseRecord, [source]: null} : baseRecord;

  return (
    <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
      <LocaleProvider>
        <StoryAdminConfigProvider iconsMap={parameters.icons as IconsMap}>
          <Card variant="elevation" sx={{width: 420, p: 4, m: 2}}>
            <RecordContextProvider value={record}>
              <Labeled label={(args as {label?: ReactNode | false}).label} fullWidth>
                <Story />
              </Labeled>
            </RecordContextProvider>
          </Card>
        </StoryAdminConfigProvider>
      </LocaleProvider>
    </CoreAdminContext>
  );
};
