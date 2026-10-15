// Story-support harness for the admin-layer dialog stories. NOT exported from the `@admin` barrel
// and never shipped in the library. These dialogs only read `useTranslate`, so the shell is the
// lightest one in the layer: `CoreAdminContext` (i18n) + `LocaleProvider`, no router, no auth, no
// form. `CoreAdminContext` (not `SchemaRootContext`) on purpose: `SchemaRootContext` injects React
// Admin's own `ThemeProvider`, which would override the design theme supplied by the global
// Storybook decorator (`.storybook/preview.ts`).
import React from 'react';
import {CoreAdminContext, testDataProvider} from 'react-admin';
import {i18nProvider} from '@admin/pages/_i18n';
import {LocaleProvider} from '@design/theme';
import type {Decorator} from '@storybook/react-vite';

// A no-op data provider — these dialogs never fetch; `CoreAdminContext` requires one.
const dataProvider = testDataProvider();

/** Shared decorator: boots the minimal i18n context around the confirmation-dialog stories. */
export const withDialogShell: Decorator = (Story) => (
  <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
    <LocaleProvider>
      <Story />
    </LocaleProvider>
  </CoreAdminContext>
);
