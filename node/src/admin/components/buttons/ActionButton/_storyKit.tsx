// Story-support harness for the admin-layer ActionButton stories (HAB-685). NOT exported from the
// `@admin` barrel and never shipped. Lighter than the field/input kits: an action button only needs
// i18n (`useTranslate` for its label/confirm strings) and a router (react-router `Link` for `to` and
// the design `useMenu`/dialog surfaces), so it boots `CoreAdminContext` (i18n + store) inside a
// `MemoryRouter`. `CoreAdminContext` (not `SchemaRootContext`) on purpose: `SchemaRootContext` injects React
// Admin's own `ThemeProvider`, which would override the design theme from the global Storybook
// decorator (`.storybook/preview.ts`).
import React from 'react';
import {CoreAdminContext, testDataProvider} from 'react-admin';
import {MemoryRouter} from 'react-router-dom';
import {i18nProvider} from '@admin/pages/_i18n';
import {LocaleProvider} from '@design/theme';
import {Stack} from '@mui/material';
import type {Decorator} from '@storybook/react-vite';

// A no-op data provider — action buttons in the stories never fetch. Created once, shared.
const dataProvider = testDataProvider();

/** Shared decorator: boots the minimal i18n + router context around the action-button stories. */
export const withActionButtonShell: Decorator = (Story) => (
  <MemoryRouter>
    <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
      <LocaleProvider>
        <Stack direction={'row'} spacing={2} alignItems={'center'} sx={{p: 4}}>
          <Story />
        </Stack>
      </LocaleProvider>
    </CoreAdminContext>
  </MemoryRouter>
);
