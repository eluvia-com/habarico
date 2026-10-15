import {CSSObject, ThemeOptions} from '@mui/material';
import {varAlpha} from '../../utils';

export const MuiBackdrop: NonNullable<ThemeOptions['components']>['MuiBackdrop'] = {
  styleOverrides: {
    root: ({theme}): CSSObject => {
      // Radial gradient anchored to the right edge (center 100% 50%), fading across
      // the whole page to the left edge: 10% black in light mode, 10% white in dark.
      const channel =
        theme.palette.mode === 'light'
          ? theme.palette.common.blackChannel
          : theme.palette.common.whiteChannel;
      return {
        // 10% primary tint as the base, with the black/white radial gradient layered on top.
        backgroundColor: varAlpha(theme.palette.primary.darkerChannel, 0.2),
        backgroundImage: `radial-gradient(100% 100% at 100% 50%, ${varAlpha(
          channel,
          0.2
        )} 0%, ${varAlpha(channel, 0)} 100%)`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      };
    },
    invisible: {
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
  },
};
