import {CSSObject, ThemeOptions} from '@mui/material';
import {varAlpha} from '../../utils';

export const MuiInputBase: NonNullable<ThemeOptions['components']>['MuiInputBase'] = {
  styleOverrides: {
    // Outlined border colour lives on MuiOutlinedInput.notchedOutline (single
    // source of truth); here we only tint the field surface.
    root: ({theme}): CSSObject => ({
      backgroundColor: varAlpha(theme.palette.background.paperChannel, 0.2),
    }),
  },
};
