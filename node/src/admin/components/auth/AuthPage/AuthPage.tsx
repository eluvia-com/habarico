import React, {useState} from 'react';
import {useTranslate} from 'react-admin';
import {NoLogo} from '@design/atoms/NoLogo';
import {LayoutLanguage, LogoSlot} from '@design/layouts/types';
import {Box, Fade, Typography} from '@mui/material';
import {AdminAuthLayout} from '../../layouts/AdminAuthLayout';
import {ForgottenPasswordForm} from '../ForgottenPasswordForm';
import {LoginForm} from '../LoginForm';
import {ForgottenPasswordComponent, LoginComponent, RegisterComponent} from './types';

type FormVariant = 'login' | 'register' | 'forgottenPassword';

export type AuthPageProps = {
  onLoginSuccess?: () => void;
  onLoginError?: (error: Error) => void;
  onRegisterSuccess?: () => void;
  onRegisterError?: (error: Error) => void;
  onForgottenPasswordSuccess?: () => void;
  onForgottenPasswordError?: (error: Error) => void;
  LoginComponent?: LoginComponent;
  ForgottenPasswordComponent?: ForgottenPasswordComponent;
  RegisterComponent?: RegisterComponent;
  /** Logo shown in the auth shell header. Defaults to the "no logo" placeholder. */
  logo?: LogoSlot;
  /** Languages offered by the auth shell's header switcher. */
  availableLanguages?: LayoutLanguage[];
};

export const AuthPage = ({
  onLoginSuccess,
  onLoginError,
  onRegisterSuccess,
  onRegisterError,
  onForgottenPasswordSuccess,
  onForgottenPasswordError,
  LoginComponent = LoginForm,
  ForgottenPasswordComponent = ForgottenPasswordForm,
  RegisterComponent,
  logo = {Component: NoLogo},
  availableLanguages,
}: AuthPageProps) => {
  const t = useTranslate();

  const [formVariant, setFormType] = useState<FormVariant>('login');

  // Only the active screen is mounted; a `key`ed `Fade` replays its enter transition on each
  // switch. Rendering a single screen (rather than three overlapping `Slide`s) keeps the card from
  // resizing/flickering mid-transition, since two differently sized screens never co-exist.
  const renderActiveScreen = () => {
    if (formVariant === 'register' && RegisterComponent) {
      return (
        <RegisterComponent
          onLoginClick={() => setFormType('login')}
          onSuccess={onRegisterSuccess}
          onError={onRegisterError}
        />
      );
    }
    if (formVariant === 'forgottenPassword') {
      return (
        <ForgottenPasswordComponent
          onLoginClick={() => setFormType('login')}
          onSuccess={onForgottenPasswordSuccess}
          onError={onForgottenPasswordError}
        />
      );
    }
    return (
      <LoginComponent
        onRegisterClick={RegisterComponent ? () => setFormType('register') : undefined}
        onForgottenPasswordClick={() => setFormType('forgottenPassword')}
        onSuccess={onLoginSuccess}
        onError={onLoginError}
      />
    );
  };

  return (
    <AdminAuthLayout logo={logo} availableLanguages={availableLanguages}>
      <Fade key={formVariant} in appear timeout={200}>
        <Box>{renderActiveScreen()}</Box>
      </Fade>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{display: 'block', mt: 2, textAlign: 'center'}}
      >
        {t('ra.auth.public_computer_hint')}
      </Typography>
    </AdminAuthLayout>
  );
};
