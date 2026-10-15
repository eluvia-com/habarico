import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiTableCell: NonNullable<ThemeOptions['components']>['MuiTableCell'] = {
  styleOverrides: {
    head: ({theme}): CSSObject => ({
      fontSize: theme.typography.pxToRem(14),
      color: theme.palette.text.secondary,
      fontWeight: theme.typography.fontWeightSemiBold,
      backgroundColor: theme.palette.background.default,
    }),
    body: ({theme}): CSSObject => ({
      borderBottom: `1px solid ${theme.palette.divider}`,

      'tr:last-of-type &': {
        borderBottom: 'none',
      },
    }),
  },
};
