import React from 'react';
import {useTranslate} from 'react-admin';
import {NotFound} from '@admin/components/common/NotFound';
import {Icon, IconType} from '@design/atoms/Icon';
import {Button, Container, Stack, Typography} from '@mui/material';

function goBack() {
  window.history.go(-1);
}

type ErrorProps = {
  error?: Error | null;
};

export const ErrorPage = ({error}: ErrorProps) => {
  const translate = useTranslate();

  if (error && 'status' in error && error.status === 404) return <NotFound />;

  const message = error?.message || translate('ra.message.error');
  return (
    <Container maxWidth="sm">
      <Stack alignItems="center">
        <Icon icon={IconType.ErrorOutline} size={120} sx={{my: 5}} />

        <Typography variant="h3" mb={2} textAlign="center">
          {translate('ra.page.error')}
        </Typography>

        <Typography color="text.secondary" textAlign="center">
          {message}
        </Typography>

        <Button onClick={goBack} size="large" variant="contained" color="inherit" sx={{mt: 4}}>
          {translate('ra.action.back')}
        </Button>
      </Stack>
    </Container>
  );
};
