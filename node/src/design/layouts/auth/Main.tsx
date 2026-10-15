import React from 'react';
import {Box, BoxProps, Breakpoint, useTheme} from '@mui/material';
import {varAlpha} from '../../theme/utils';
import {layoutClasses} from '../classes';

type MainProps = BoxProps & {
  layoutBreakpoint: Breakpoint;
};

export function Main({sx, children, layoutBreakpoint, ...other}: MainProps) {
  const theme = useTheme();
  return (
    <Box
      component="main"
      className={layoutClasses.main}
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        flexDirection: 'column',
        p: theme.spacing(3, 2, 10, 2),
        [theme.breakpoints.up(layoutBreakpoint)]: {
          justifyContent: 'center',
          p: theme.spacing(10, 0, 10, 0),
        },
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          py: 5,
          px: 3,
          width: 1,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: (theme) =>
            varAlpha(theme.palette.background.paperChannel, Number(theme.layout?.paperOpacity)),
          maxWidth: theme.layout?.contentWidthSm,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
