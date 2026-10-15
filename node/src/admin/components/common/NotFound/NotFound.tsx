import React from 'react';
import {useTranslate} from 'react-admin';
import {NotFoundV2Illustration} from '@assets/illustrations';
import {Button, Container, Stack, Typography} from '@mui/material';

function goBack() {
  window.history.go(-1);
}

export const NotFound = () => {
  const translate = useTranslate();
  return (
    <Container maxWidth="sm">
      <Stack alignItems="center">
        <Typography variant="h3" mb={2} textAlign="center">
          {translate('ra.page.not_found')}
        </Typography>

        <Typography color="text.secondary" textAlign="center">
          {translate('ra.message.not_found')}
        </Typography>

        <NotFoundV2Illustration width={400} />

        <Button onClick={goBack} size="large" variant="contained" color="inherit">
          {translate('ra.action.back')}
        </Button>
      </Stack>
    </Container>
  );
};
