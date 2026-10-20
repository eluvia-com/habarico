import React from 'react';
import {Admin, type AuthProvider, Resource, TestMemoryRouter, memoryStore} from 'react-admin';
import {AuthPage} from '@admin';
import {RegisterForm} from '@admin/components/auth/RegisterForm';
import {MfaRequiredError} from '@admin/providers/buildServiceAuthProvider';
import type {LoginSsoMethod} from '@admin/providers/types';
import {withRaDefaults} from '@admin/theme';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {SocialIcon, SocialIconType} from '@design/atoms/SocialIcon';
import {createDarkTheme, createLightTheme} from '@design/theme';
import type {Theme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {createFakeDataProvider} from './_data';
import {LANGUAGES, i18nProvider} from './_i18n';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

// A registered SSO method so `LoginForm` renders an alternative-login button below the credentials
// form (mirroring how a real app plugs in an OAuth hook). `useLogin` is inert here — the button is
// for showcasing the layout, not a working OAuth round-trip.
const googleLoginMethod: LoginSsoMethod = {
  id: 'google',
  label: 'ra.auth.sign_in_with_google',
  icon: <SocialIcon icon={SocialIconType.Google} />,
  useLogin: () => ({isCallback: false, loading: false, login: () => {}}),
};

/**
 * Fake service auth provider wiring up every `AuthPage` path so the single story below is a live
 * playground for all of them:
 * - `checkAuth` rejects so `requireAuth` sends React Admin to the login route (how `AuthPage`
 *   reaches the screen in the real app);
 * - `getSsoLoginMethods` offers a Google button under the credentials form;
 * - `login` rejects with a two-method `MfaRequiredError` — exactly what `buildServiceAuthProvider`
 *   does on an MFA challenge — so submitting the credentials opens the MFA method-selection step,
 *   and picking one advances to verification;
 * - `requestMfaChallenge` / `verifyMfa` resolve so the MFA steps run through;
 * - `resetPassword` resolves so the forgotten-password submit succeeds.
 * Registration is reached via the header link (the `RegisterComponent` below).
 */
const authProvider: AuthProvider & {
  resetPassword: () => Promise<void>;
  requestMfaChallenge: () => Promise<void>;
  verifyMfa: () => Promise<Response>;
  getSsoLoginMethods: () => LoginSsoMethod[];
} = {
  login: () => Promise.reject(new MfaRequiredError({methods: ['email', 'sms']})),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.reject(new Error('unauthenticated')),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  resetPassword: () => Promise.resolve(),
  requestMfaChallenge: () => Promise.resolve(),
  verifyMfa: () => Promise.resolve(new Response()),
  getSsoLoginMethods: () => [googleLoginMethod],
};

// The real `AuthPage` rendered as React Admin's login page, with registration enabled.
const AuthPageScreen = () => (
  <AuthPage
    logo={{Component: HabaricoLogo}}
    availableLanguages={LANGUAGES}
    RegisterComponent={RegisterForm}
  />
);

const AuthPageDemo = () => (
  <TestMemoryRouter initialEntries={['/login']}>
    <Admin
      dataProvider={createFakeDataProvider()}
      authProvider={authProvider}
      store={memoryStore()}
      i18nProvider={i18nProvider}
      lightTheme={withRaDefaults(createLightTheme() as Theme)}
      darkTheme={withRaDefaults(createDarkTheme() as Theme)}
      loginPage={AuthPageScreen}
      requireAuth
      disableTelemetry
    >
      <Resource name="properties" />
    </Admin>
  </TestMemoryRouter>
);

const meta: Meta<typeof AuthPageDemo> = {
  title: 'admin/pages/AuthPage',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof AuthPageDemo>;

/**
 * The admin-layer **auth screen** — the real `AuthPage` rendered through `AdminAuthLayout` as React
 * Admin's `loginPage`, with every path live from this one story:
 * - **login** with a **Google** SSO button under the credentials form;
 * - **forgotten password** via the link (submit succeeds against the mocked `resetPassword`);
 * - **registration** via the header link;
 * - **MFA** — submitting the credentials raises a two-method challenge, so the **method-selection**
 *   step lists e-mail + SMS and picking one opens the **verification** step.
 * The header language switcher and colour-mode toggle are wired through the settings bridge.
 */
// `render` returns the local `AuthPageDemo` helper (the full `Admin`/router/provider scaffold this
// story needs to boot) — "Show code" would otherwise show that helper's tag, so this overrides it
// with the real usage: `AuthPage` wired up as `Admin`'s `loginPage`.
const PLAYGROUND_SOURCE = `<Admin loginPage={AuthPageScreen} requireAuth>
  <Resource name="properties" />
</Admin>

// AuthPageScreen:
<AuthPage
  logo={{Component: HabaricoLogo}}
  availableLanguages={LANGUAGES}
  RegisterComponent={RegisterForm}
/>`;

export const Default: Story = {
  parameters: {docs: {source: {code: PLAYGROUND_SOURCE}}},
  // `_args` keeps `render` non-zero-arity, matching the story standard even though this story
  // never reads args.
  render: (_args) => <AuthPageDemo />,
};
