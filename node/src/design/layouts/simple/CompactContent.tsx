import React from 'react';
import {Box, BoxProps, Breakpoint, useTheme} from '@mui/material';
import {layoutClasses} from '../classes';

export function CompactContent({
  sx,
  layoutBreakpoint,
  children,
  ...other
}: BoxProps & {layoutBreakpoint: Breakpoint}) {
  const theme = useTheme();

  return (
    <Box
      className={layoutClasses.content}
      sx={{
        width: 1,
        mx: 'auto',
        display: 'flex',
        flex: '1 1 auto',
        textAlign: 'center',
        flexDirection: 'column',
        p: theme.spacing(3, 2, 10, 2),
        maxWidth: theme.layout?.contentWidthMd,
        [theme.breakpoints.up(layoutBreakpoint)]: {
          justifyContent: 'center',
          p: theme.spacing(10, 0, 10, 0),
        },
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}
