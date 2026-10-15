import {ThemeOptions} from '@mui/material';

export const MuiTablePagination: NonNullable<ThemeOptions['components']>['MuiTablePagination'] = {
  styleOverrides: {
    root: {
      marginBottom: '6px', // used under the scrollbar component, so we need to add margin bottom to match top margin
      marginRight: '6px', // to match bottom margin
    },
  },
};
