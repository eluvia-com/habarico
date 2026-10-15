import React, {useState} from 'react';
import {Form, TextInput, required, useAuthProvider, useNotify, useTranslate} from 'react-admin';
import {ServiceAuthProvider} from '@admin/providers/types';
import {extractErrorMessage} from '@admin/utils/api';
import {LabelDivider} from '@design/atoms/LabelDivider';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {Box, Link, Typography} from '@mui/material';

type FormValues = {
  username?: string;
};

export type ForgottenPasswordProps = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onLoginClick?: () => void;
};

export const ForgottenPasswordForm = ({
  onSuccess,
  onError,
  onLoginClick,
}: ForgottenPasswordProps) => {
  const translate = useTranslate();
  const notify = useNotify();
  const authProvider = useAuthProvider<ServiceAuthProvider>();
  if (!authProvider) {
    throw new Error('AuthProvider is not defined');
  }

  // --------------------------------------------------------------------------
  // Handler
  // --------------------------------------------------------------------------

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await authProvider.resetPassword({username: values.username!});
      notify('ra.auth.forgotten_password_success', {type: 'success'});
      onSuccess?.();
    } catch (error) {
      notify(extractErrorMessage(error) ?? 'ra.auth.forgotten_password_error', {
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
  // Handler
  // --------------------------------------------------------------------------

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} sx={{mb: 5}}>
        <Typography variant="h5" textAlign="center">
          {translate('ra.auth.forgotten_password')}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {translate('ra.auth.forgotten_password_instructions')}
        </Typography>
      </Box>

      <Form onSubmit={handleSubmit} noValidate>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <TextInput
            autoFocus
            fullWidth
            margin="none"
            source="username"
            label={translate('ra.auth.email')}
            disabled={loading}
            validate={required()}
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
            {translate('ra.action.submit')}
          </LoadingButton>
        </Box>
      </Form>

      <LabelDivider label={translate('ra.navigation.or')} />

      <Typography variant="body2" color="text.secondary" textAlign="center">
        <Link variant="subtitle2" sx={{ml: 0.5}} onClick={onLoginClick}>
          {translate('ra.auth.sign_in')}
        </Link>
      </Typography>
    </>
  );
};
