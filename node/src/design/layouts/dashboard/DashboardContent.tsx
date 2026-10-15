import React from 'react';
import {Breakpoint, Container, ContainerProps, useTheme} from '@mui/material';
import {layoutClasses} from '../classes';
import {useSettingsContext} from '../contexts/SettingsContext';

export type DashboardContentProps = ContainerProps & {
  disablePadding?: boolean;
};

export function DashboardContent({
  sx,
  children,
  disablePadding,
  maxWidth = 'xl',
  ...other
}: DashboardContentProps) {
  const {pageWidth} = useSettingsContext();
  const effectiveMaxWidth =
    pageWidth === 'centered' && (maxWidth === false || maxWidth === undefined) ? 'xl' : maxWidth;
  const theme = useTheme();
  const layoutBreakpoint: Breakpoint = 'lg';

  return (
    <Container
      className={layoutClasses.content}
      maxWidth={effectiveMaxWidth}
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        pt: theme.layout?.contentPt,
        pb: theme.layout?.contentPb,
        [theme.breakpoints.up(layoutBreakpoint)]: {
          px: theme.layout?.contentPx,
        },
        ...(disablePadding && {
          p: {xs: 0, sm: 0, md: 0, lg: 0, xl: 0},
        }),
        ...sx,
      }}
      {...other}
    >
      {children}
    </Container>
  );
}
