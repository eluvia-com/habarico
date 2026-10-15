import {IconSet} from '../../atoms/Icon';

declare module '@mui/material/styles' {
  interface Theme {
    iconSet: IconSet;
  }

  interface ThemeVars {
    iconSet: IconSet;
  }
}
