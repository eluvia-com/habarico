import {PaletteMode, PaletteOptions} from '@mui/material';
import {createPaletteChannel, varAlpha} from '../utils';
import CORE_COLORS from './colors.json';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

declare module '@mui/material/styles' {
  interface Palette {
    stripeRow: string;
  }
  interface PaletteOptions {
    stripeRow?: string;
  }

  interface CommonColors {
    // white
    // black
    whiteChannel: string;
    blackChannel: string;
  }

  interface TypeText {
    // disabled
    disabledChannel: string;
  }

  interface TypeBackground {
    neutral: string;
    // default
    // paper
    neutralChannel: string;
    defaultChannel: string;
    paperChannel: string;
    gradient?: BackgroundGradients;
  }

  interface SimplePaletteColorOptions {
    lighter: string;
    // light
    // main
    // dark
    darker: string;
    lighterChannel: string;
    lightChannel: string;
    mainChannel: string;
    darkChannel: string;
    darkerChannel: string;
  }

  interface PaletteColor {
    lighter: string;
    // light
    // main
    // dark
    darker: string;
    lighterChannel: string;
    lightChannel: string;
    mainChannel: string;
    darkChannel: string;
    darkerChannel: string;
  }

  interface ThemeVars {
    transitions: Theme['transitions'];
  }
}

declare module '@mui/material' {
  interface Color {
    ['50Channel']: string;
    ['100Channel']: string;
    ['200Channel']: string;
    ['300Channel']: string;
    ['400Channel']: string;
    ['500Channel']: string;
    ['600Channel']: string;
    ['700Channel']: string;
    ['800Channel']: string;
    ['900Channel']: string;
  }
}

export const COLOR_TYPES = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

export type ColorType = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type ColorsConfig = Record<string, Record<string, string>>;

/**
 * Page-background gradients, indexed by two dimensions: colour mode
 * (`light` / `dark`) × intensity (`vivid` / `subtle` / `neutral`). Each variant
 * is a stack of CSS gradient layers joined into a single `background` value.
 *
 * - `vivid` — the strong, expressive gradient (Auth & Simple layouts).
 * - `subtle` — the sidebar brand glow (Dashboard left sidebar).
 * - `neutral` — the toned-down gradient behind the Dashboard page.
 *
 * `subtle` and `neutral` bake an opaque base in as their lowest layer (the
 * `default` surface colour, or a near-white gradient for the light sidebar), so
 * they are self-contained and can be applied directly as `background` (no
 * separate base colour needed); `vivid` remains an overlay.
 *
 * Exposed on the palette as `background.gradient.{vivid,subtle,neutral}` with
 * each layer stack flattened to a CSS string — see {@link BackgroundGradients}
 * and {@link palette}.
 */
export type GradientVariants = {
  vivid: string[];
  subtle: string[];
  neutral: string[];
};

/**
 * The gradient variants exposed on `palette.background.gradient` — the same
 * three intensities as {@link GradientVariants}, but with each layer stack
 * flattened into a single ready-to-use CSS `background` string.
 */
export type BackgroundGradients = {
  vivid: string;
  subtle: string;
  neutral: string;
};

export type GradientsConfig = {
  light: GradientVariants;
  dark: GradientVariants;
};

// ----------------------------------------------------------------------
// Values
// ----------------------------------------------------------------------

export const grey = createPaletteChannel(CORE_COLORS.grey);

export const common = createPaletteChannel(CORE_COLORS.common);

export const text = {
  light: createPaletteChannel({
    primary: grey[800],
    secondary: grey[600],
    disabled: grey[500],
  }),
  dark: createPaletteChannel({primary: '#FFFFFF', secondary: grey[500], disabled: grey[600]}),
};

export const action = {
  light: {
    hover: varAlpha(grey['500Channel'], 0.08),
    selected: varAlpha(grey['500Channel'], 0.12),
    focus: varAlpha(grey['500Channel'], 0.2),
    disabled: varAlpha(grey['500Channel'], 0.8),
    disabledBackground: varAlpha(grey['500Channel'], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
    active: grey[600],
  },
  dark: {
    hover: varAlpha(grey['500Channel'], 0.08),
    selected: varAlpha(grey['500Channel'], 0.16),
    focus: varAlpha(grey['500Channel'], 0.24),
    disabled: varAlpha(grey['500Channel'], 0.8),
    disabledBackground: varAlpha(grey['500Channel'], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
    active: grey[500],
  },
};

export function palette(
  mode: PaletteMode,
  colors: ColorsConfig,
  gradients: GradientsConfig
): PaletteOptions {
  const primary = createPaletteChannel(colors.primary);
  const secondary = createPaletteChannel(colors.secondary);
  const info = createPaletteChannel(colors.info);
  const success = createPaletteChannel(colors.success);
  const warning = createPaletteChannel(colors.warning);
  const error = createPaletteChannel(colors.error);

  const background = {
    light: {
      ...createPaletteChannel({
        paper: '#FFFFFF',
        default: grey[100],
        neutral: grey[100],
      }),
      gradient: {
        vivid: gradients.light.vivid.join(', '),
        subtle: gradients.light.subtle.join(', '),
        neutral: gradients.light.neutral.join(', '),
      },
    },
    dark: {
      ...createPaletteChannel({paper: grey[800], default: grey[900], neutral: '#28323D'}),
      gradient: {
        vivid: gradients.dark.vivid.join(', '),
        subtle: gradients.dark.subtle.join(', '),
        neutral: gradients.dark.neutral.join(', '),
      },
    },
  };

  return {
    primary,
    secondary,
    info,
    success,
    warning,
    error,
    grey,
    common,
    divider: varAlpha(grey['500Channel'], mode === 'light' ? 0.3 : 0.4),
    stripeRow: varAlpha(grey['500Channel'], 0.07),
    text: mode === 'light' ? text.light : text.dark,
    background: mode === 'light' ? background.light : background.dark,
    action: mode === 'light' ? action.light : action.dark,
    mode,
  };
}
