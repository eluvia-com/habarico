import {describe, expect, it} from 'vitest';
import {createTheme} from '@mui/material';
import {getDensityMediaQuery} from '../densityMediaQuery';

describe('getDensityMediaQuery', () => {
  it('matches a precise, hover-capable pointer regardless of viewport size', () => {
    const theme = createTheme();
    expect(getDensityMediaQuery(theme)).toContain('(hover: hover) and (pointer: fine)');
  });

  it("gates the touch fallback on the theme's sm breakpoint, in both dimensions", () => {
    const theme = createTheme({
      breakpoints: {values: {xs: 0, sm: 700, md: 900, lg: 1200, xl: 1536}},
    });
    expect(getDensityMediaQuery(theme)).toBe(
      '(hover: hover) and (pointer: fine), (min-width: 700px) and (min-height: 700px)'
    );
  });
});
