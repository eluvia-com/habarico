import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiPopover: NonNullable<ThemeOptions['components']>['MuiPopover'] = {
  styleOverrides: {
    // Drive the popover surface shadow from the semantic `dropdown` token (shared
    // with Menu) instead of the default Paper elevation, and carry the same subtle
    // glow the sidebar/InspectorPanel use so popovers read as panels. The gradient's
    // final layer is opaque, so it overrides Paper's flat backgroundColor.
    paper: ({theme}): CSSObject => ({
      boxShadow: theme.customShadows.dropdown,
      background: theme.palette.background.gradient?.subtle,
    }),
  },
};
