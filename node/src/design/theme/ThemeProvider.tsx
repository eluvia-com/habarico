import React, {ReactNode} from 'react';
import {CssBaseline, ThemeProvider as MuiThemeProvider} from '@mui/material';
import {createLightTheme} from './createTheme';

const theme = createLightTheme();

export type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({children}: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
