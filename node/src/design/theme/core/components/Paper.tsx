import {CSSObject, ThemeOptions} from '@mui/material';
import {varAlpha} from '../../utils';

export const MuiPaper: NonNullable<ThemeOptions['components']>['MuiPaper'] = {
  defaultProps: {
    elevation: 0,
  },
  styleOverrides: {
    root: ({theme, ownerState}): CSSObject => ({
      backgroundImage: 'none',
      backgroundColor: varAlpha(
        theme.palette.background.paperChannel,
        Number(theme.layout?.paperOpacity)
      ),
      // Rounded surfaces (menus, popovers, dropdowns, cards…) share the `lg` panel
      // radius across the system; `square` Paper stays sharp.
      ...(!ownerState.square && {borderRadius: theme.radius.lg}),
    }),
    outlined: ({theme}): CSSObject => ({
      borderColor: varAlpha(theme.palette.grey['500Channel'], 0.16),
    }),
  },
};
