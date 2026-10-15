import React from 'react';
import {Icon, IconType} from '@design/atoms/Icon';
import {Box, Typography} from '@mui/material';

export type NotFoundProps = {
  title?: string;
};

export const SearchNotFound = ({title = 'Not found'}: NotFoundProps) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={4}
      textAlign="center"
      color="text.secondary"
    >
      <Icon icon={IconType.SearchOff} size={64} sx={{mb: 2}} />
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};
