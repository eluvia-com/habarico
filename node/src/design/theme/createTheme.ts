import {Theme, createTheme as muiCreateTheme} from '@mui/material';
import {IconSet} from '../atoms/Icon';
import {
  ColorsConfig,
  GradientsConfig,
  LayoutConfig,
  components,
  customShadows,
  palette,
  radius,
  shadows,
  typography,
} from './core';
import HABARICO_COLORS from './habarico/colors.json';
import HABARICO_GRADIENTS from './habarico/gradients.json';
import {layout as habaricoLayout} from './habarico/layout';

export type CreateThemeProps = {
  colors?: ColorsConfig;
  gradients?: GradientsConfig;
  layout?: (theme: Theme) => LayoutConfig;
  iconSet?: IconSet;
};

export function createLightTheme({
  colors = HABARICO_COLORS,
  gradients = HABARICO_GRADIENTS,
  layout = habaricoLayout,
  iconSet = 'material',
}: CreateThemeProps = {}): Theme {
  const paletteVal = palette('light', colors, gradients);
  const theme = muiCreateTheme({
    palette: paletteVal,
    shadows: shadows(300),
    shape: {borderRadius: radius.base},
    components,
    typography,
  });
  theme.customShadows = customShadows(300, theme);
  theme.layout = layout(theme);
  theme.radius = radius;
  theme.iconSet = iconSet;
  return theme;
}

export function createDarkTheme({
  colors = HABARICO_COLORS,
  gradients = HABARICO_GRADIENTS,
  layout = habaricoLayout,
  iconSet = 'material',
}: CreateThemeProps = {}): Theme {
  const paletteVal = palette('dark', colors, gradients);
  const theme = muiCreateTheme({
    palette: paletteVal,
    shadows: shadows(900),
    shape: {borderRadius: radius.base},
    components,
    typography,
  });
  theme.customShadows = customShadows(900, theme);
  theme.layout = layout(theme);
  theme.radius = radius;
  theme.iconSet = iconSet;
  return theme;
}
