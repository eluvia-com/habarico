import {DENSITY_GRID_GAP} from '../../constants';
import {useSettingsContext} from '../../layouts/contexts/SettingsContext';

/**
 * The gap a `PanelGrid` puts between its cells, rows and columns alike (theme spacing units). It
 * follows the user's density setting by `DENSITY_GRID_GAP`. Exported for layout math that
 * needs the gap ahead of rendering (e.g. `SchemaGridBox`'s label-width alignment).
 */
export const usePanelGridSpacing = (): number => DENSITY_GRID_GAP[useSettingsContext().density];
