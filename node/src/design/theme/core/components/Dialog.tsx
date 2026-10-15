import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiDialog: NonNullable<ThemeOptions['components']>['MuiDialog'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => ({
      '& .MuiDialog-paper': {
        borderRadius: theme.radius.lg,
        boxShadow: theme.customShadows.dialog,
      },
      '& .MuiDialogTitle-root': {
        padding: theme.spacing(2),
        paddingRight: theme.spacing(6),
        paddingBottom: 0,
      },
      '& .MuiDialogActions-root': {
        padding: theme.spacing(2),
        paddingTop: 0,
      },
      '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
        paddingTop: theme.spacing(4),
      },
      '& .MuiDialogTitle-root +.MuiDialogContent-root': {
        paddingTop: theme.spacing(2),
      },
    }),
  },
};
