import {CSSObject, ThemeOptions} from '@mui/material';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import {varAlpha} from '../../utils';

// The pickers' counterpart of MuiInputBase: the same field surface tint.
export const MuiPickersInputBase: NonNullable<ThemeOptions['components']>['MuiPickersInputBase'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      backgroundColor: varAlpha(theme.palette.background.paperChannel, 0.2),
    }),
  },
};
