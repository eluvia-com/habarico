export type ColorMode = 'light' | 'dark';
// Unified with the `DataTable` (`DataTableDensity`) and MUI `DataGrid` (`GridDensity`) density
// values, so a settings density can be passed straight to either table without translation.
export type Density = 'compact' | 'standard' | 'comfortable';

/**
 * The densities the app knows, for the checks a type cannot do on its own: a setting read back
 * from persistence can hold anything the app ever wrote there — a store written before 6.7.0 still
 * holds `normal`, the middle value until it was renamed to `standard`.
 *
 * Keep in step with the union above. The annotation rejects a value that is not a density, and
 * `useAdminSettings.test.tsx` walks this list through the hook.
 */
export const DENSITIES: readonly Density[] = ['compact', 'standard', 'comfortable'];
export type PageWidth = 'full' | 'centered';

/**
 * User-chosen presentation settings, set either in the app bar (e.g. the mode
 * toggle) or the settings panel. Mirror of what the user configured — as opposed to
 * `LayoutDynamicContext`, which feeds dynamic external state *into* the layout.
 * The context is purely presentational; the concrete value (persistence, colour-mode
 * bridge) is supplied by the consuming admin layer.
 */
export type SettingsContextState = {
  colorMode: ColorMode;
  setColorMode: (v: ColorMode) => void;
  locale: string | null;
  setLocale: (v: string) => void;
  pageWidth: PageWidth;
  setPageWidth: (v: PageWidth) => void;
  contrastMode: boolean;
  setContrastMode: (v: boolean) => void;
  stripedRows: boolean;
  setStripedRows: (v: boolean) => void;
  density: Density;
  setDensity: (v: Density) => void;
  /** Whether the current device supports density beyond `compact`. */
  densitySupported: boolean;
  resetSettings: () => void;
};
