import React from 'react';
import {Form, PasswordInput, TextInput, required, useTranslate} from 'react-admin';
import {useSubmitForm} from '@admin/hooks/useSubmitForm';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {Box, Link} from '@mui/material';

export type LoginFormValues = {
  username?: string;
  password?: string;
};

type LoginCredentialsStepProps = {
  onSubmit: (data: LoginFormValues) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onForgottenPasswordClick?: () => void;
};

export const LoginCredentialsStep = ({
  onSubmit,
  onSuccess,
  onError,
  onForgottenPasswordClick,
}: LoginCredentialsStepProps) => {
  const {handleSubmit, isLoading} = useSubmitForm(
    onSubmit,
    onSuccess,
    onError,
    null,
    'ra.auth.sign_in_error',
    'ra.auth.sign_in_too_many_requests'
  );
  const translate = useTranslate();

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Box display="flex" flexDirection="column" alignItems="flex-end">
        <TextInput
          autoFocus
          fullWidth
          margin="none"
          source="username"
          label={translate('ra.auth.email')}
          disabled={isLoading}
          validate={required()}
          slotProps={{inputLabel: {shrink: true}}}
          size="medium"
          sx={{mb: 2}}
        />
        <Link variant="body2" color="inherit" sx={{mb: 0.5}} onClick={onForgottenPasswordClick}>
          {translate('ra.auth.forgotten_password_button')}
        </Link>
        <PasswordInput
          fullWidth
          margin="none"
          source="password"
          label={translate('ra.auth.password')}
          disabled={isLoading}
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
          loading={isLoading}
        >
          {translate('ra.auth.sign_in')}
        </LoadingButton>
      </Box>
    </Form>
  );
};
