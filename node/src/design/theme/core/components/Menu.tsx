import {CSSObject, ThemeOptions} from '@mui/material';

export const MuiMenu: NonNullable<ThemeOptions['components']>['MuiMenu'] = {
  styleOverrides: {
    // Drive the menu surface shadow from the semantic `dropdown` token (shared
    // with Popover) instead of the default Paper elevation, and carry the same
    // subtle glow the sidebar/InspectorPanel use so dropdowns read as panels.
    // The gradient's final layer is opaque (near-white light / paper-dark), so it
    // overrides Paper's flat backgroundColor + `backgroundImage: 'none'`.
    paper: ({theme}): CSSObject => ({
      boxShadow: theme.customShadows.dropdown,
      background: theme.palette.background.gradient?.subtle,
    }),
    // Inset padding so the rounded MenuItem hover/selected background sits
    // inside the menu paper (matches the redesign dropdown, radius 6 items).
    list: ({theme}): CSSObject => ({
      padding: theme.spacing(0.5),
    }),
  },
};
