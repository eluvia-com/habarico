import React from 'react';
import {
  Admin,
  type AuthProvider,
  CustomRoutes,
  Resource,
  TestMemoryRouter,
  memoryStore,
} from 'react-admin';
import {Route} from 'react-router-dom';
import {ResetPasswordPage} from '@admin';
import {withRaDefaults} from '@admin/theme';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {createDarkTheme, createLightTheme} from '@design/theme';
import type {Theme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {createFakeDataProvider} from './_data';
import {LANGUAGES, i18nProvider} from './_i18n';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

// Fake service auth provider: `setPassword` resolves so the reset submit succeeds against a mocked
// backend. The page is a public (`noLayout`) route, so `checkAuth` never blocks it.
const authProvider: AuthProvider & {
  setPassword: () => Promise<Response>;
} = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  setPassword: () => Promise.resolve(new Response()),
};

// The page reads its token from the `/reset-password/:token` route param, so the router lands there.
const ResetPasswordDemo = () => (
  <TestMemoryRouter initialEntries={['/reset-password/demo-token']}>
    <Admin
      dataProvider={createFakeDataProvider()}
      authProvider={authProvider}
      store={memoryStore()}
      i18nProvider={i18nProvider}
      lightTheme={withRaDefaults(createLightTheme() as Theme)}
      darkTheme={withRaDefaults(createDarkTheme() as Theme)}
      disableTelemetry
    >
      <CustomRoutes noLayout>
        <Route
          path="/reset-password/:token"
          element={
            <ResetPasswordPage logo={{Component: HabaricoLogo}} availableLanguages={LANGUAGES} />
          }
        />
      </CustomRoutes>
      <Resource name="properties" />
    </Admin>
  </TestMemoryRouter>
);

const meta: Meta<typeof ResetPasswordDemo> = {
  title: 'admin/pages/ResetPasswordPage',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof ResetPasswordDemo>;

/**
 * The admin-layer **reset-password screen** — the real `ResetPasswordPage` (new password + confirm)
 * rendered through `AdminAuthLayout` at the `/reset-password/:token` route, with the header language
 * switcher and colour-mode toggle wired through the settings bridge.
 */
export const Default: Story = {
  render: () => <ResetPasswordDemo />,
};
