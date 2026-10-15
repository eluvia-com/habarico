import React from 'react';
import {Form, TextInput, required, useTranslate} from 'react-admin';
import {CheckboxInput} from '@admin/components/inputs/CheckboxInput';
import {useSubmitForm} from '@admin/hooks/useSubmitForm';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {Box, CircularProgress, Link} from '@mui/material';

export type MfaVerificationFormValues = {
  code: string;
  trust_device: boolean;
};

type MfaVerificationStepProps = {
  onSubmit: (data: MfaVerificationFormValues) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isCodeSending: boolean;
  onResendCode: () => void;
  onBack: () => void;
};

export const MfaVerificationStep = ({
  onSubmit,
  onSuccess,
  onError,
  isCodeSending,
  onResendCode,
  onBack,
}: MfaVerificationStepProps) => {
  const translate = useTranslate();
  const {handleSubmit, isLoading} = useSubmitForm(
    onSubmit,
    onSuccess,
    onError,
    'ra.auth.sucessfully_logged_in',
    'ra.auth.sign_in_error',
    'ra.auth.sign_in_too_many_requests'
  );

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Box display="flex" flexDirection="column" alignItems="flex-end">
        {/* The resend prompt belongs to the code input below — keep them tightly grouped. */}
        <Box display="flex" alignItems="center" gap={0.5} sx={{mb: 0.5}}>
          {isCodeSending && <CircularProgress size={16} color="inherit" />}
          <Link
            variant="body2"
            color="inherit"
            sx={isCodeSending ? {opacity: 0.7, pointerEvents: 'none'} : undefined}
            onClick={onResendCode}
          >
            {translate('ra.auth.mfa_resend_code')}
          </Link>
        </Box>
        <TextInput
          autoFocus
          fullWidth
          margin="none"
          source="code"
          label={translate('ra.auth.mfa_code')}
          disabled={isLoading}
          validate={required()}
          slotProps={{inputLabel: {shrink: true}}}
          size="medium"
          sx={{mb: 0.5}}
        />
        {/* CheckboxInput applies `sx` to its inner label, not the root, so wrap it to left-align. */}
        <Box sx={{alignSelf: 'flex-start', mb: 3}}>
          <CheckboxInput
            source="trust_device"
            label={translate('ra.auth.mfa_trust_device')}
            disabled={isLoading}
            size="small"
            helperText={false}
          />
        </Box>
        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          color="inherit"
          variant="contained"
          loading={isLoading}
          disabled={isCodeSending}
        >
          {translate('ra.auth.mfa_submit_code')}
        </LoadingButton>
        <Link
          variant="subtitle2"
          color="inherit"
          sx={{mt: 1, alignSelf: 'center'}}
          onClick={onBack}
        >
          {translate('ra.auth.mfa_back')}
        </Link>
      </Box>
    </Form>
  );
};
