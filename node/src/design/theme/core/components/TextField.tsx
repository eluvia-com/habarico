import {ThemeOptions} from '@mui/material';

export const MuiTextField: NonNullable<ThemeOptions['components']>['MuiTextField'] = {
  styleOverrides: {
    root: {
      whiteSpace: 'pre-wrap',
    },
  },
};
