import {useContext} from 'react';
import {PanelGridContext} from './PanelGridContext';
import {ColumnsType} from './types';

// Stable module-level reference: a literal returned inline from the hook would be a fresh object
// on every call with no ancestor provider, invalidating every memo/context keyed on `parentColumns`
// even though the value never actually changes.
export const DEFAULT_PANEL_GRID_COLUMNS: ColumnsType = {
  xs: 12,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 12,
};

export const usePanelGridContext = () => {
  const columns = useContext(PanelGridContext);
  return columns || DEFAULT_PANEL_GRID_COLUMNS;
};
