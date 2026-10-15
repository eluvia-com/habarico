import React from 'react';
import {Box, CircularProgress} from '@mui/material';

export const SearchLoading = () => {
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
      <CircularProgress />
    </Box>
  );
};
