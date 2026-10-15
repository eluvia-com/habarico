// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface RadiusConfig {
  base: number;
  sm: number;
  md: number;
  lg: number;
  pill: number;
}

declare module '@mui/material/styles' {
  interface Theme {
    radius: RadiusConfig;
  }

  interface ThemeOptions {
    radius?: RadiusConfig;
  }

  interface ThemeVars {
    radius: RadiusConfig;
  }
}

// ----------------------------------------------------------------------
// Values
// ----------------------------------------------------------------------

// Border-radius scale per the redesign. `base` (= `md`) mirrors MUI
// `shape.borderRadius`; `lg` is the root Panel radius (12px), `sm` a tighter
// radius (4px), `pill` for fully-rounded chips/avatars.
export const radius: RadiusConfig = {
  base: 6,
  sm: 4,
  md: 6,
  lg: 12,
  pill: 999,
};
