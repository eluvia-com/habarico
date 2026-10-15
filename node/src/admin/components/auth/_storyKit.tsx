// Story-support harness for the admin-layer auth dialog stories. NOT exported from the `@admin`
// barrel and never shipped in the library. `ChangePasswordDialog` / `UpdateIdentityDialog` submit
// through `useAuthProvider<ServiceAuthProvider>()` and `UpdateIdentityDialog` also seeds itself from
// `useGetIdentity()`, so — unlike the lighter `admin/components/dialogs/_storyKit` — this shell adds
// a fake auth provider on top of the usual i18n / theme wiring, mirroring the one
// `admin/pages/_shell.tsx` boots for the same two dialogs.
// `CoreAdminContext` (not `SchemaRootContext`) on purpose: `SchemaRootContext` injects React
// Admin's own `ThemeProvider`, which would override the design theme from the global Storybook
// decorator (`.storybook/preview.ts`).
import React from 'react';
import {AuthProvider, CoreAdminContext, testDataProvider} from 'react-admin';
import {i18nProvider} from '@admin/pages/_i18n';
import {LocaleProvider} from '@design/theme';
import type {Decorator} from '@storybook/react-vite';

// A no-op data provider — the auth forms never fetch through it; `CoreAdminContext` requires one.
const dataProvider = testDataProvider();

const CURRENT_USER = {
  id: 1,
  firstName: 'Martina',
  lastName: 'Nováková',
  fullName: 'Martina Nováková',
  email: 'martina.novakova@example.com',
  avatar: 'https://i.pravatar.cc/300?img=5',
};

// A fake auth provider so `useAuthProvider<ServiceAuthProvider>()` resolves and the forms' submit
// handlers succeed; `getIdentity` also seeds `UpdateIdentityDialog`'s default values.
const authProvider: AuthProvider & {
  updateIdentity: () => Promise<Response>;
  changePassword: () => Promise<void>;
} = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  getIdentity: () => Promise.resolve(CURRENT_USER),
  updateIdentity: () => Promise.resolve(new Response()),
  changePassword: () => Promise.resolve(),
};

/** Shared decorator: boots the minimal i18n + fake-auth context around the auth dialog stories. */
export const withAuthDialogShell: Decorator = (Story) => (
  <CoreAdminContext
    dataProvider={dataProvider}
    authProvider={authProvider}
    i18nProvider={i18nProvider}
  >
    <LocaleProvider>
      <Story />
    </LocaleProvider>
  </CoreAdminContext>
);
