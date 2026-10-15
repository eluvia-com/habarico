import React, {ReactNode, useMemo} from 'react';
import {Theme, ThemeOptions, ThemeProvider, createTheme, useTheme} from '@mui/material';
import {varAlpha} from '../../theme/utils';
import {useSettingsContext} from '../contexts/SettingsContext';

// `createTheme`'s public overload types the base argument as `ThemeOptions`, so passing an
// already-resolved `Theme` (with the full component-overrides map) forces TS to structurally
// compare that giant type against `ThemeOptions` on every build — several seconds of CPU and a
// large allocation burst during type-check / declaration emit. Retype the merge so both args
// match the params by identity and the deep comparison never runs.
const mergeTheme = createTheme as (base: Theme, options: ThemeOptions) => Theme;

/**
 * When contrast mode is enabled, wraps children in a patched ThemeProvider
 * with stronger dividers, more visible table backgrounds, and subtle card borders.
 */
export const ContrastModeWrapper = ({children}: {children: ReactNode}) => {
  const {contrastMode} = useSettingsContext();
  const baseTheme = useTheme();

  const theme = useMemo(() => {
    if (!contrastMode) return baseTheme;
    const contrastOptions: ThemeOptions = {
      palette: {
        divider: varAlpha(baseTheme.palette.grey['500Channel'], 0.7),
        background: {
          neutral:
            baseTheme.palette.mode === 'light'
              ? baseTheme.palette.grey[400]
              : baseTheme.palette.grey[800],
        },
        ...(baseTheme.palette.mode === 'light' && {
          text: {secondary: baseTheme.palette.grey[800]},
        }),
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              outline: `1px solid ${varAlpha(baseTheme.palette.grey['500Channel'], 0.4)}`,
            },
          },
        },
      },
    };
    return mergeTheme(baseTheme, contrastOptions);
  }, [contrastMode, baseTheme]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
