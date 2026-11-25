import React from 'react';
import {CoreAdminContext, I18nProvider, memoryStore} from 'react-admin';
import {beforeAll, describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {fireEvent, render, screen} from '@testing-library/react';
import {AuthPage} from '../AuthPage';
import {ForgottenPasswordComponent, LoginComponent, LoginNoticeSlot} from '../types';

// jsdom ships no matchMedia; the auth shell's settings bridge queries the colour scheme and density.
beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({
      media: query,
      matches: false,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
});

const TRANSLATIONS: Record<string, string> = {
  'ra.auth.public_computer_hint': 'Use a private window on a shared computer.',
};

const i18nProvider = {
  translate: (key: string) => TRANSLATIONS[key] ?? key,
  changeLocale: () => Promise.resolve(),
  getLocale: () => 'en',
} as unknown as I18nProvider;

// Stand-ins for the real forms: the notice depends only on which screen `AuthPage` shows.
const StubLoginForm: LoginComponent = ({onForgottenPasswordClick}) => (
  <button type="button" onClick={onForgottenPasswordClick}>
    Forgot password?
  </button>
);

const StubForgottenPasswordForm: ForgottenPasswordComponent = ({onLoginClick}) => (
  <button type="button" onClick={onLoginClick}>
    Back to sign in
  </button>
);

const TermsNotice = () => (
  <>
    By signing in you agree to the <a href="https://example.com/terms">terms of service</a>.
  </>
);

const renderAuthPage = (loginNotice?: LoginNoticeSlot) =>
  render(
    <CoreAdminContext i18nProvider={i18nProvider} store={memoryStore()}>
      <ThemeProvider theme={createLightTheme()}>
        <AuthPage
          LoginComponent={StubLoginForm}
          ForgottenPasswordComponent={StubForgottenPasswordForm}
          loginNotice={loginNotice}
        />
      </ThemeProvider>
    </CoreAdminContext>
  );

describe('AuthPage — loginNotice', () => {
  it('renders the notice under the login form, above the public-computer hint', () => {
    renderAuthPage({Component: TermsNotice});

    const link = screen.getByRole('link', {name: 'terms of service'});
    const hint = screen.getByText('Use a private window on a shared computer.');
    expect(link).toHaveAttribute('href', 'https://example.com/terms');
    expect(link.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hides the notice on the forgotten-password form and shows it again back on login', () => {
    renderAuthPage({Component: TermsNotice});

    fireEvent.click(screen.getByRole('button', {name: 'Forgot password?'}));
    expect(screen.queryByRole('link', {name: 'terms of service'})).not.toBeInTheDocument();
    expect(screen.getByText('Use a private window on a shared computer.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Back to sign in'}));
    expect(screen.getByRole('link', {name: 'terms of service'})).toBeInTheDocument();
  });

  it('renders only the public-computer hint without a notice', () => {
    renderAuthPage();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Use a private window on a shared computer.')).toBeInTheDocument();
  });
});
