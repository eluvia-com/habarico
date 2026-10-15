import React, {useState} from 'react';
import {Form, PasswordInput, required, useAuthProvider, useNotify, useTranslate} from 'react-admin';
import {useParams} from 'react-router-dom';
import {useBasenameNavigate} from '@admin/hooks/useBasenameNavigate';
import {ServiceAuthProvider} from '@admin/providers/types';
import {extractErrorMessage} from '@admin/utils/api';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {NoLogo} from '@design/atoms/NoLogo';
import {LayoutLanguage, LogoSlot} from '@design/layouts/types';
import {Box, Typography} from '@mui/material';
import {AdminAuthLayout} from '../../layouts/AdminAuthLayout';

type FormValues = {
  password?: string;
};

export type ResetPasswordPageProps = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Logo shown in the auth shell header. Defaults to the "no logo" placeholder. */
  logo?: LogoSlot;
  /** Languages offered by the auth shell's header switcher. */
  availableLanguages?: LayoutLanguage[];
};

export const ResetPasswordPage = ({
  onSuccess,
  onError,
  logo = {Component: NoLogo},
  availableLanguages,
}: ResetPasswordPageProps) => {
  const translate = useTranslate();
  const navigate = useBasenameNavigate();
  const notify = useNotify();
  const authProvider = useAuthProvider<ServiceAuthProvider>();
  const {token} = useParams();

  if (!authProvider) {
    throw new Error('AuthProvider is not defined');
  }

  // --------------------------------------------------------------------------
  // Handler
  // --------------------------------------------------------------------------

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formValues: FormValues) => {
    setLoading(true);
    try {
      await authProvider.setPassword({token: token || '', password: formValues.password!});
      notify('ra.auth.reset_password_success', {type: 'success'});
      navigate('/');
      onSuccess?.();
    } catch (error) {
      notify(extractErrorMessage(error) ?? 'ra.auth.reset_password_error', {
        type: 'error',
        messageArgs: {
          _: extractErrorMessage(error),
        },
      });
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <AdminAuthLayout logo={logo} availableLanguages={availableLanguages}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} sx={{mb: 5}}>
        <Typography variant="h5" textAlign="center">
          {translate('ra.auth.reset_password')}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {translate('ra.auth.reset_password_instructions')}
        </Typography>
      </Box>

      <Form onSubmit={handleSubmit} noValidate>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <PasswordInput
            source="password"
            label={translate('ra.auth.password')}
            disabled={loading}
            validate={required()}
            fullWidth
            margin="none"
            autoComplete={'off'}
            slotProps={{inputLabel: {shrink: true}}}
            size="medium"
            sx={{mb: 3}}
          />

          <PasswordInput
            source="passwordAgain"
            label={translate('ra.auth.password_again')}
            disabled={loading}
            validate={(value, allValues) =>
              value !== (allValues as FormValues).password
                ? translate('ra.auth.password_mismatch')
                : undefined
            }
            fullWidth
            margin="none"
            autoComplete={'off'}
            slotProps={{inputLabel: {shrink: true}}}
            size="medium"
            sx={{mb: 4}}
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            color="inherit"
            variant="contained"
            loading={loading}
          >
            {translate('ra.action.save')}
          </LoadingButton>
        </Box>
      </Form>
    </AdminAuthLayout>
  );
};
