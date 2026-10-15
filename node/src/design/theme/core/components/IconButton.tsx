import {ThemeOptions} from '@mui/material';

// An icon button is meant to be a circle, so anchor a 1:1 aspect ratio at the component level:
// even if its glyph renders non-square, the button stays round instead of squashing into an oval
// (the same fix we previously applied ad-hoc in the panel header).
export const MuiIconButton: NonNullable<ThemeOptions['components']>['MuiIconButton'] = {
  styleOverrides: {
    root: {
      aspectRatio: '1 / 1',
      '& svg': {
        display: 'block',
        aspectRatio: '1 / 1',
      },
    },
  },
};
