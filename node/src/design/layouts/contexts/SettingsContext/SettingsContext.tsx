import {createContext} from 'react';
import {SettingsContextState} from './types';

export const SETTINGS_DEFAULTS: SettingsContextState = {
  colorMode: 'light',
  setColorMode: () => {},
  locale: null,
  setLocale: () => {},
  pageWidth: 'full',
  setPageWidth: () => {},
  contrastMode: false,
  setContrastMode: () => {},
  stripedRows: false,
  setStripedRows: () => {},
  density: 'standard',
  setDensity: () => {},
  densitySupported: true,
  resetSettings: () => {},
};

export const SettingsContext = createContext<SettingsContextState>(SETTINGS_DEFAULTS);
