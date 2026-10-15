import {CSSObject, ThemeOptions} from '@mui/material';
import {varAlpha} from '../../utils';

export const MuiTableRow: NonNullable<ThemeOptions['components']>['MuiTableRow'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      '&.color-success': {
        'td,th': {
          '&:not(.column-__row_action_buttons__)': {
            backgroundColor: varAlpha(theme.palette.success.mainChannel, 0.08) + ' !important',
          },
        },
      },
      '&.color-error': {
        'td,th': {
          '&:not(.column-__row_action_buttons__)': {
            backgroundColor: varAlpha(theme.palette.error.mainChannel, 0.08) + ' !important',
          },
        },
      },
      '&.color-warning': {
        'td,th': {
          '&:not(.column-__row_action_buttons__)': {
            backgroundColor: varAlpha(theme.palette.warning.mainChannel, 0.08) + ' !important',
          },
        },
      },
      '&.color-info': {
        'td,th': {
          '&:not(.column-__row_action_buttons__)': {
            backgroundColor: varAlpha(theme.palette.info.mainChannel, 0.08) + ' !important',
          },
        },
      },
      '&.color-primary': {
        'td,th': {
          '&:not(.column-__row_action_buttons__)': {
            backgroundColor: varAlpha(theme.palette.primary.mainChannel, 0.08) + ' !important',
          },
        },
      },
      '&.color-secondary': {
        'td,th': {
          '&:not(.column-__row_action_buttons__)': {
            backgroundColor: varAlpha(theme.palette.secondary.mainChannel, 0.08) + ' !important',
          },
        },
      },
    }),
  },
};
