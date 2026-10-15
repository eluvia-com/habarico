import {ThemeOptions} from '@mui/material';

export const MuiDivider: NonNullable<ThemeOptions['components']>['MuiDivider'] = {
  styleOverrides: {
    root: {
      borderStyle: 'dashed',
    },
  },
};
