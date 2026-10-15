import {ThemeOptions, tabScrollButtonClasses} from '@mui/material';

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

// A scrollable tab strip greys a scroll button out when its direction can't scroll, instead of
// hiding it. With `scrollButtons="auto"` MUI mounts *both* arrows as soon as the strip overflows,
// but drops the one whose direction can't currently scroll to `opacity: 0` — so at each scroll
// extreme you see a lone arrow and the second only fades in once you start scrolling, which reads as
// arrows popping in and out. Greying the disabled arrow (MUI's standard disabled opacity) instead
// keeps the pair on screen together for the whole time the strip overflows: only their enabled state
// changes as you scroll. A strip whose tabs fit still shows no arrows at all — `auto` mounts them
// only once there is an overflow to scroll. This themes the scroll button through its `MuiTabs`
// slot: MUI v7 has no `MuiTabScrollButton` entry in the theme `Components` map, and the slot styles
// the very same element.
//
// Targets the `scrollButtons` slot, which is the `TabScrollButton` element that carries the
// `Mui-disabled` class.
export const MuiTabs: NonNullable<ThemeOptions['components']>['MuiTabs'] = {
  styleOverrides: {
    scrollButtons: ({theme}) => ({
      [`&.${tabScrollButtonClasses.disabled}`]: {
        opacity: theme.palette.action.disabledOpacity,
      },
    }),
  },
};
