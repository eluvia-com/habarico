import React from 'react';
import {useTranslate} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {Box, Link} from '@mui/material';

type MfaSelectionStepProps = {
  methods: string[];
  onSelectMethod: (method: string) => void;
  onBack: () => void;
};

// Per-method glyph, so each method reads as its own channel (e-mail vs SMS) rather than sharing one
// icon. Unknown methods fall back to the generic lock.
const METHOD_ICON: Record<string, IconType> = {
  email: IconType.MailLock,
  sms: IconType.PhonelinkLock,
};

export const MfaSelectionStep = ({methods, onSelectMethod, onBack}: MfaSelectionStepProps) => {
  const translate = useTranslate();

  // A uniform list of full-width buttons — `gap` is the right spacing primitive here (unlike the
  // field forms, which use per-field `mb` to match the design blueprint's non-uniform rhythm).
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
      {methods.map((method) => (
        <LoadingButton
          key={method}
          fullWidth
          onClick={() => onSelectMethod(method)}
          size="large"
          variant="outlined"
          startIcon={<Icon icon={METHOD_ICON[method] ?? IconType.LockPerson} />}
        >
          {translate(`ra.auth.mfa_method_${method}`)}
        </LoadingButton>
      ))}
      <Link variant="subtitle2" color="inherit" sx={{mt: 1}} onClick={onBack}>
        {translate('ra.auth.mfa_back')}
      </Link>
    </Box>
  );
};
