import React from 'react';
import {useTranslate} from 'react-admin';
import {LabelDivider} from '@design/atoms/LabelDivider';
import {Link, Typography} from '@mui/material';

export type RegisterFormProps = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onLoginClick?: () => void;
};

export const RegisterForm = ({onLoginClick}: RegisterFormProps) => {
  const translate = useTranslate();
  return (
    <>
      <LabelDivider label={translate('ra.navigation.or')} />

      <Typography variant="body2" color="text.secondary" textAlign="center">
        <Link variant="subtitle2" sx={{ml: 0.5}} onClick={onLoginClick}>
          {translate('ra.auth.sign_in')}
        </Link>
      </Typography>
    </>
  );
};
