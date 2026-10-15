import type {Theme} from '@mui/material/styles';
import {varAlpha} from '../utils';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface CustomShadows {
  z1?: string;
  z4?: string;
  z8?: string;
  z12?: string;
  z16?: string;
  z20?: string;
  z24?: string;
  //
  primary?: string;
  secondary?: string;
  info?: string;
  success?: string;
  warning?: string;
  error?: string;
  //
  card?: string;
  dialog?: string;
  dropdown?: string;
  pinnedColumn?: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: CustomShadows;
  }

  interface ThemeOptions {
    customShadows?: CustomShadows;
  }

  interface ThemeVars {
    customShadows: CustomShadows;
  }
}

// ----------------------------------------------------------------------
// Values
// ----------------------------------------------------------------------

function createShadowColor(colorChannel: string) {
  return `0 8px 16px 0 ${varAlpha(colorChannel, 0.24)}`;
}

export function customShadows(intensity: number, theme: Theme) {
  // @ts-expect-error custom type extension
  const baseColorChannel: string = theme.palette.grey[`${intensity}Channel`];
  return {
    z1: `0 1px 2px 0 ${varAlpha(baseColorChannel, 0.16)}`,
    z4: `0 4px 8px 0 ${varAlpha(baseColorChannel, 0.16)}`,
    z8: `0 8px 16px 0 ${varAlpha(baseColorChannel, 0.16)}`,
    z12: `0 12px 24px -4px ${varAlpha(baseColorChannel, 0.16)}`,
    z16: `0 16px 32px -4px ${varAlpha(baseColorChannel, 0.16)}`,
    z20: `0 20px 40px -4px ${varAlpha(baseColorChannel, 0.16)}`,
    z24: `0 24px 48px 0 ${varAlpha(baseColorChannel, 0.16)}`,
    //
    dialog: `0 0 2px 0 ${varAlpha(baseColorChannel, 0.2)}, 0 12px 24px -4px ${varAlpha(baseColorChannel, 0.12)}`,
    card: `0 0 2px 0 ${varAlpha(baseColorChannel, 0.2)}, 0 12px 24px -4px ${varAlpha(baseColorChannel, 0.12)}`,
    dropdown: theme.shadows[8],
    // dropdown: `0 0 2px 0 ${varAlpha(baseColorChannel, 0.24)}, -20px 20px 40px -4px ${varAlpha(baseColorChannel, 0.24)}`,
    pinnedColumn: `0 0 10px ${varAlpha(baseColorChannel, 0.8)}`,
    //
    primary: createShadowColor(theme.palette.primary.mainChannel),
    secondary: createShadowColor(theme.palette.secondary.mainChannel),
    info: createShadowColor(theme.palette.info.mainChannel),
    success: createShadowColor(theme.palette.success.mainChannel),
    warning: createShadowColor(theme.palette.warning.mainChannel),
    error: createShadowColor(theme.palette.error.mainChannel),
  };
}
