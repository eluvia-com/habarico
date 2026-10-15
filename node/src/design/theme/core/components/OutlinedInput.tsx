import {CSSObject, ThemeOptions, outlinedInputClasses} from '@mui/material';

export const MuiOutlinedInput: NonNullable<ThemeOptions['components']>['MuiOutlinedInput'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      // Keep the disabled fieldset border the same as the resting one
      // (MUI otherwise swaps it for action.disabledBackground).
      [`&.${outlinedInputClasses.disabled} .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: theme.palette.divider,
      },
    }),
    input: {
      boxSize: 'content-box',
    },
    notchedOutline: ({theme}): CSSObject => ({
      borderColor: theme.palette.divider,
    }),
  },
};
