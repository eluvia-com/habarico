import {ThemeOptions} from '@mui/material';

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export const MuiButton: NonNullable<ThemeOptions['components']>['MuiButton'] = {
  variants: [
    {
      props: {variant: 'contained', color: 'inherit'},
      style: ({theme}) => ({
        color:
          theme.palette.mode === 'light' ? theme.palette.common.white : theme.palette.grey[800],
        backgroundColor:
          theme.palette.mode === 'light' ? theme.palette.grey[800] : theme.palette.common.white,
        '&:hover': {
          color:
            theme.palette.mode === 'light' ? theme.palette.common.white : theme.palette.grey[800],
          backgroundColor:
            theme.palette.mode === 'light' ? theme.palette.grey[800] : theme.palette.common.white,
        },
      }),
    },
  ],
  defaultProps: {
    disableElevation: true,
    color: 'inherit',
  },
  styleOverrides: {
    sizeLarge: {
      minHeight: 48,
      minWidth: 48,
      paddingLeft: 21,
      paddingRight: 21,
    },
    sizeMedium: {
      minHeight: 36,
      minWidth: 36,
      paddingLeft: 15,
      paddingRight: 15,
    },
    // 28 is not a row height — it is the height of a control that has to sit *inside* a row of read
    // data. Two things already stand there: the line a read `PropertyItem` reserves for a
    // `smallField` row, and MUI's own `small` `IconButton`, which is what a list's row actions
    // render at. Anchoring `small` on it is what makes `size="small"` enough at such a call site.
    // (The row around it is taller: a datagrid cell adds its density padding on top.) Zeroing the
    // vertical padding is the other half: MUI's own `4px` would push the label past the pinned
    // height.
    sizeSmall: {
      minHeight: 28,
      minWidth: 28,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 9,
      paddingRight: 9,
    },
  },
};
