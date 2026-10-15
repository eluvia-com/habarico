import {useMemo, useState} from 'react';
import {SETTINGS_DEFAULTS} from './SettingsContext';
import {SettingsContextState} from './types';

/**
 * Local-state settings for Storybook / isolated rendering — every setting is wired to
 * component state (no admin persistence layer), so the mode toggle, page width, density,
 * etc. are all live. The initial locale matches a mock language so the popover shows.
 */
export function useMockSettings(): SettingsContextState {
  const [colorMode, setColorMode] = useState(SETTINGS_DEFAULTS.colorMode);
  const [locale, setLocale] = useState<string | null>('en-GB');
  const [pageWidth, setPageWidth] = useState(SETTINGS_DEFAULTS.pageWidth);
  const [contrastMode, setContrastMode] = useState(SETTINGS_DEFAULTS.contrastMode);
  const [stripedRows, setStripedRows] = useState(SETTINGS_DEFAULTS.stripedRows);
  const [density, setDensity] = useState(SETTINGS_DEFAULTS.density);

  return useMemo(
    () => ({
      colorMode,
      setColorMode,
      locale,
      setLocale,
      pageWidth,
      setPageWidth,
      contrastMode,
      setContrastMode,
      stripedRows,
      setStripedRows,
      density,
      setDensity,
      densitySupported: SETTINGS_DEFAULTS.densitySupported,
      resetSettings: () => {
        setColorMode(SETTINGS_DEFAULTS.colorMode);
        setPageWidth(SETTINGS_DEFAULTS.pageWidth);
        setContrastMode(SETTINGS_DEFAULTS.contrastMode);
        setStripedRows(SETTINGS_DEFAULTS.stripedRows);
        setDensity(SETTINGS_DEFAULTS.density);
      },
    }),
    [colorMode, locale, pageWidth, contrastMode, stripedRows, density]
  );
}
