import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiAutocomplete: NonNullable<ThemeOptions['components']>['MuiAutocomplete'] = {
  defaultProps: {
    size: 'small',
    slotProps: {
      paper: {
        elevation: 1,
      },
    },
  },
  styleOverrides: {
    // The Autocomplete dropdown is a Popper + `.MuiAutocomplete-paper`, so it does NOT pick up the
    // `MuiMenu`/`MuiPopover` paper overrides. Mirror them here so select-like fields share the same
    // dropdown surface: the `dropdown` shadow and the subtle sidebar/InspectorPanel gradient (its
    // final layer is opaque, so it overrides Paper's flat background).
    paper: ({theme}): CSSObject => ({
      boxShadow: theme.customShadows.dropdown,
      background: theme.palette.background.gradient?.subtle,
    }),
    // Inset the listbox and round the options so the hover/selected background sits inside the paper,
    // matching the redesigned menu items (Menu list padding 0.5 + radius-6 items).
    listbox: ({theme}): CSSObject => ({
      padding: theme.spacing(0.5),
      '& .MuiAutocomplete-option': {
        borderRadius: theme.radius.md,
      },
      // 4px gap between options, matching the `MuiMenuItem` sibling spacing so autocomplete
      // dropdowns read the same as Select/Menu popovers instead of being crammed together.
      // (Autocomplete options are plain `li`s, not `MenuItem`s, so they need their own rule.)
      '& .MuiAutocomplete-option + .MuiAutocomplete-option': {
        marginTop: theme.spacing(0.5),
      },
    }),
  },
};
