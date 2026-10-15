import React, {useCallback, useEffect, useState} from 'react';
import {
  HttpError,
  removeDoubleSlashes,
  useAuthProvider,
  useBasename,
  useGetIdentity,
  useLogin,
  useNotify,
  useTranslate,
} from 'react-admin';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {MfaRequiredError} from '@admin/providers/buildServiceAuthProvider';
import {ServiceAuthProvider} from '@admin/providers/types';
import {LabelDivider} from '@design/atoms/LabelDivider';
import {Box, Link, Typography} from '@mui/material';
import {LoginCredentialsStep, LoginFormValues} from './LoginCredentialsStep';
import {LoginSsoMethodButton} from './LoginSsoMethodButton';
import {MfaSelectionStep} from './MfaSelectionStep';
import {MfaVerificationFormValues, MfaVerificationStep} from './MfaVerificationStep';
import {LocationState, LoginStep} from './types';

const STEP_TITLE_KEY: Record<LoginStep, string> = {
  login: 'ra.auth.sign_in',
  mfaSelection: 'ra.auth.mfa_select_method',
  mfaVerification: 'ra.auth.mfa_verify',
};

export type LoginFormProps = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onRegisterClick?: () => void;
  onForgottenPasswordClick?: () => void;
};

export const LoginForm = ({
  onSuccess,
  onError,
  onForgottenPasswordClick,
  onRegisterClick,
}: LoginFormProps) => {
  // --------------------------------------------------------------------------
  // Hooks
  // --------------------------------------------------------------------------

  const translate = useTranslate();
  const login = useLogin();
  const location = useLocation();
  const navigate = useNavigate();
  const basename = useBasename();
  const [searchParams] = useSearchParams();
  const {refetch} = useGetIdentity();
  const notify = useNotify();
  const authProvider = useAuthProvider<ServiceAuthProvider>();
  const ssoLoginMethods = authProvider?.getSsoLoginMethods?.() ?? [];

  const [step, setStep] = useState<LoginStep>('login');
  const [selectedMfaMethod, setSelectedMfaMethod] = useState<string | null>(null);
  const [mfaMethods, setMfaMethods] = useState<string[]>([]);
  const [isCodeSending, setIsCodeSending] = useState(false);

  const state = location.state as LocationState | null | undefined;
  const nextPath = state?.nextPathname ?? (basename || '/');
  const token = searchParams.get('token');

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleBack = () => {
    if (step === 'mfaVerification' && mfaMethods.length > 1) {
      setSelectedMfaMethod(null);
      setStep('mfaSelection');
    } else {
      setSelectedMfaMethod(null);
      setMfaMethods([]);
      setStep('login');
    }
  };

  const sendCode = useCallback(
    async (method: string, showSuccessNotification = false) => {
      if (!authProvider) return;
      setIsCodeSending(true);
      try {
        await authProvider.requestMfaChallenge({method});
        if (showSuccessNotification) {
          notify('ra.auth.mfa_code_resent', {type: 'success'});
        }
      } catch (error) {
        const key =
          error instanceof HttpError && error.status === 429
            ? 'ra.auth.mfa_resend_too_many_requests'
            : 'ra.auth.mfa_send_error';
        notify(key, {type: 'error'});
      } finally {
        setIsCodeSending(false);
      }
    },
    [authProvider, notify]
  );

  const handleResendCode = () => {
    if (selectedMfaMethod) sendCode(selectedMfaMethod, true);
  };

  const handleSelectMfaMethod = (method: string) => {
    setSelectedMfaMethod(method);
    setStep('mfaVerification');
    void sendCode(method);
  };

  const submitLogin = async (data: LoginFormValues) => {
    if (!authProvider) throw Error('Auth provider is not defined');
    try {
      await authProvider.login(data);
      notify('ra.auth.sucessfully_logged_in', {type: 'success'});
      navigate(nextPath, {replace: true});
    } catch (error) {
      if (!(error instanceof MfaRequiredError)) throw error;

      if (error.methods.length === 0) {
        notify('ra.auth.mfa_no_methods', {type: 'error'});
      } else if (error.methods.length === 1) {
        notify('ra.auth.mfa_required', {type: 'info'});
        setMfaMethods(error.methods);
        setSelectedMfaMethod(error.methods[0]);
        setStep('mfaVerification');
        void sendCode(error.methods[0]);
      } else {
        notify('ra.auth.mfa_required', {type: 'info'});
        setMfaMethods(error.methods);
        setStep('mfaSelection');
      }
    }
  };

  const submitMfaVerification = async (data: MfaVerificationFormValues) => {
    if (!authProvider) throw Error('Auth provider is not defined');
    if (!selectedMfaMethod) return;
    const {code, trust_device} = data;
    await authProvider.verifyMfa({method: selectedMfaMethod, code, trust_device});
    navigate(nextPath, {replace: true});
  };

  const handleLoginSsoMethodSuccess = () => {
    notify('ra.auth.sucessfully_logged_in', {type: 'success'});
    navigate(nextPath, {replace: true});
    onSuccess?.();
  };

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Handles token-based impersonation login and redirects already-authenticated users.
  useEffect(() => {
    if (authProvider === undefined) return;

    if (token) {
      const loginWithToken = async () => {
        try {
          await login({token}, nextPath);
          const user = await authProvider.getIdentity?.();
          notify('ra.auth.impersonate_success', {
            type: 'success',
            messageArgs: {name: user?.fullName},
          });
          refetch();
        } catch {
          notify('ra.auth.impersonate_error', {type: 'error'});
          navigate(removeDoubleSlashes(`${basename}/login`), {replace: true});
        }
      };
      loginWithToken();
    } else {
      authProvider
        .checkAuth({})
        .then(() => navigate(nextPath, {replace: true}))
        .catch(() => {});
    }
  }, [authProvider, nextPath, navigate, basename, token, login, notify, refetch]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} sx={{mb: 5}}>
        <Typography variant="h5" textAlign="center">
          {translate(STEP_TITLE_KEY[step])}
        </Typography>
        {onRegisterClick && step === 'login' && (
          <Typography variant="body2" textAlign="center" color="text.secondary">
            {translate('ra.auth.do_not_have_account')}
            <Link variant="subtitle2" sx={{ml: 0.5}} onClick={onRegisterClick}>
              {translate('ra.auth.register')}
            </Link>
          </Typography>
        )}
      </Box>

      {step === 'login' && (
        <>
          <LoginCredentialsStep
            onSubmit={submitLogin}
            onSuccess={onSuccess}
            onError={onError}
            onForgottenPasswordClick={onForgottenPasswordClick}
          />
          {ssoLoginMethods.length > 0 && (
            <>
              <LabelDivider label={translate('ra.navigation.or')} />
              <Box display="flex" justifyContent="center" gap={1}>
                {ssoLoginMethods.map((method) => (
                  <LoginSsoMethodButton
                    key={method.id}
                    method={method}
                    onSuccess={handleLoginSsoMethodSuccess}
                  />
                ))}
              </Box>
            </>
          )}
        </>
      )}

      {step === 'mfaSelection' && (
        <MfaSelectionStep
          methods={mfaMethods}
          onSelectMethod={handleSelectMfaMethod}
          onBack={handleBack}
        />
      )}

      {step === 'mfaVerification' && (
        <MfaVerificationStep
          onSubmit={submitMfaVerification}
          onSuccess={onSuccess}
          onError={onError}
          isCodeSending={isCodeSending}
          onResendCode={handleResendCode}
          onBack={handleBack}
        />
      )}
    </>
  );
};
