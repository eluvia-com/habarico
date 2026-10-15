import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiFormControlLabel: NonNullable<ThemeOptions['components']>['MuiFormControlLabel'] = {
  styleOverrides: {
    label: ({theme}): CSSObject => ({
      ...theme.typography.body2,
    }),
  },
};
