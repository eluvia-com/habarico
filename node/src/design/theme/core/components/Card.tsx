import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiCard: NonNullable<ThemeOptions['components']>['MuiCard'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      zIndex: 0,
      position: 'relative',
      boxShadow: theme.customShadows.card,
      borderRadius: theme.radius.lg,
    }),
  },
};
