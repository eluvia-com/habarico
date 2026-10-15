import {CSSObject, ThemeOptions} from '@mui/material';

// A bottom divider is part of the card header by default. It lives in the theme (not a
// bespoke component), so a plain `<CardHeader />` already shows it. To render a borderless
// header, opt out at the call site with `sx={{borderBottom: 'none'}}` (there is deliberately
// no `divider` prop: a custom boolean prop would leak to the root `<div>` and make React log
// a "non-boolean attribute" warning — that cannot be filtered from a theme override).
export const MuiCardHeader: NonNullable<ThemeOptions['components']>['MuiCardHeader'] = {
  defaultProps: {
    slotProps: {
      title: {variant: 'h6'},
      subheader: {variant: 'body2'},
    },
  },
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      padding: theme.spacing(2, 2, 2),
      borderBottom: `1px dashed ${(theme.vars || theme).palette.divider}`,
    }),
  },
};
