export type LayoutConfig = Record<string, number | string>;

declare module '@mui/material/styles' {
  interface Theme {
    layout: LayoutConfig;
  }

  interface ThemeVars {
    layout: LayoutConfig;
  }
}
