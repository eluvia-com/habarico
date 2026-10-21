import {CSSObject, ThemeOptions} from '@mui/material';
import {pickersOutlinedInputClasses} from '@mui/x-date-pickers/PickersTextField';
import type {} from '@mui/x-date-pickers/themeAugmentation';

// MUI X pickers render their own outlined input; it mirrors MuiOutlinedInput so both share one border color.
export const MuiPickersOutlinedInput: NonNullable<
  ThemeOptions['components']
>['MuiPickersOutlinedInput'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      [`&.${pickersOutlinedInputClasses.disabled} .${pickersOutlinedInputClasses.notchedOutline}`]:
        {
          borderColor: theme.palette.divider,
        },
    }),
    notchedOutline: ({theme}): CSSObject => ({
      borderColor: theme.palette.divider,
    }),
  },
};
