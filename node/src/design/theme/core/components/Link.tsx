import {ThemeOptions} from '@mui/material';

export const MuiLink: NonNullable<ThemeOptions['components']>['MuiLink'] = {
  defaultProps: {underline: 'hover'},
  styleOverrides: {
    root: {
      cursor: 'pointer',
    },
  },
};
