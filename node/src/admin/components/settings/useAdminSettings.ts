import {useEffect, useMemo} from 'react';
import {useLocaleState, useTheme as useRaTheme, useStore} from 'react-admin';
import {
  ColorMode,
  DENSITIES,
  Density,
  PageWidth,
  SETTINGS_DEFAULTS,
  SettingsContextState,
} from '@design/layouts/contexts/SettingsContext';
import {LayoutLanguage} from '@design/layouts/types';
import {useMediaQuery, useTheme} from '@mui/material';
import {getDensityMediaQuery} from './densityMediaQuery';

const P = 'preferences.layout.app';

/**
 * Bridges the presentational settings context to react-admin: colour mode comes
 * from the RA theme store, the remaining settings persist under `preferences.layout.app.*`,
 * and density / striped-rows are applied as `document.body` classes (read by
 * `AdminSettingsStyles`). Returns the value to feed into `SettingsProvider` / `LayoutProvider`.
 *
 * Owns the app locale: when `availableLanguages` is given and the current RA locale is not among
 * them, it resets to the first available language — so any shell that renders the language
 * switcher gets a valid locale without re-implementing the check.
 */
export const useAdminSettings = (availableLanguages?: LayoutLanguage[]): SettingsContextState => {
  // --------------------------------------------------------------------------
  // Color mode
  // --------------------------------------------------------------------------

  const [mode, setMode] = useRaTheme();
  const colorMode: ColorMode = mode === 'dark' ? 'dark' : 'light';
  const setColorMode = (v: ColorMode) => setMode(v);

  // --------------------------------------------------------------------------
  // Contrast mode
  // --------------------------------------------------------------------------

  const [contrastMode, setContrastMode] = useStore<boolean>(
    `${P}.contrastMode`,
    SETTINGS_DEFAULTS.contrastMode
  );

  // --------------------------------------------------------------------------
  // Page width
  // --------------------------------------------------------------------------

  const [pageWidth, setPageWidth] = useStore<PageWidth>(
    `${P}.pageWidth`,
    SETTINGS_DEFAULTS.pageWidth
  );

  // --------------------------------------------------------------------------
  // Languages & locale
  // --------------------------------------------------------------------------

  const [locale, setLocale] = useLocaleState();

  useEffect(() => {
    if (!availableLanguages || availableLanguages.length === 0) return;
    if (!availableLanguages.some((lang) => lang.locale === locale)) {
      setLocale(availableLanguages[0].locale);
    }
  }, [availableLanguages, locale, setLocale]);

  // --------------------------------------------------------------------------
  // Density
  // --------------------------------------------------------------------------

  // Phones never get a density above compact — desktop/tablet toggle freely.
  const theme = useTheme();
  const densitySupported = useMediaQuery(getDensityMediaQuery(theme));

  const [storedDensity, setDensity] = useStore<Density>(`${P}.density`, SETTINGS_DEFAULTS.density);
  // A persisted value is not necessarily a density any more: `normal` was renamed to `standard`
  // in 6.7.0 and still sits in the store of any browser that set it before, where nothing
  // overwrites it - the backend omits the key it deleted, and an app that does not sync
  // preferences never reads from a backend at all. Applied as-is it would add an unknown
  // `density-*` body class and leave the picker with nothing selected, so fall back to the
  // default instead. The stored value is left alone; the next explicit choice overwrites it.
  const density = DENSITIES.includes(storedDensity) ? storedDensity : SETTINGS_DEFAULTS.density;

  useEffect(() => {
    // The stored preference is left untouched on an unsupported device — it just stops being
    // applied (and the picker hides, in `SettingsPanel`) until the device supports it again.
    const appliedDensity: Density = densitySupported ? density : 'compact';
    document.body.classList.remove('density-standard', 'density-comfortable');
    if (appliedDensity !== 'compact') document.body.classList.add(`density-${appliedDensity}`);
    return () => document.body.classList.remove('density-standard', 'density-comfortable');
  }, [density, densitySupported]);

  // --------------------------------------------------------------------------
  // Striped rows
  // --------------------------------------------------------------------------

  const [stripedRows, setStripedRows] = useStore<boolean>(
    `${P}.stripedRows`,
    SETTINGS_DEFAULTS.stripedRows
  );

  useEffect(() => {
    document.body.classList.toggle('hab-striped', stripedRows);
    return () => document.body.classList.remove('hab-striped');
  }, [stripedRows]);

  return useMemo(
    () => ({
      colorMode,
      setColorMode,
      locale: locale ?? null,
      setLocale,
      pageWidth,
      setPageWidth,
      contrastMode,
      setContrastMode,
      stripedRows,
      setStripedRows,
      density,
      setDensity,
      densitySupported,
      resetSettings: () => {
        setColorMode(SETTINGS_DEFAULTS.colorMode);
        setPageWidth(SETTINGS_DEFAULTS.pageWidth);
        setContrastMode(SETTINGS_DEFAULTS.contrastMode);
        setStripedRows(SETTINGS_DEFAULTS.stripedRows);
        setDensity(SETTINGS_DEFAULTS.density);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorMode, locale, pageWidth, contrastMode, stripedRows, density, densitySupported]
  );
};
