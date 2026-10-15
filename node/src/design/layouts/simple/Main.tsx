import React from 'react';
import {Box, BoxProps} from '@mui/material';
import {layoutClasses} from '../classes';

export function Main({children, sx, ...other}: BoxProps) {
  return (
    <Box
      component="main"
      className={layoutClasses.main}
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}
