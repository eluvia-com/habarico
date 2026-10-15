import {createContext, useContext} from 'react';
import {useGridApiRef} from '@mui/x-data-grid';

/** The MUI X grid API handle shared between a `DataGrid` and its `DataGridToolbar`. */
export type DataGridApiRef = ReturnType<typeof useGridApiRef>;

export type DataGridContextValue = {
  apiRef: DataGridApiRef;
};

export const DataGridContext = createContext<DataGridContextValue | null>(null);

/**
 * Read the shared grid API. Throws when used outside a `DataGridProvider` so a stray
 * `DataGridToolbar` (which has nothing to drive without it) fails loudly.
 */
export const useDataGridContext = (): DataGridContextValue => {
  const context = useContext(DataGridContext);
  if (!context) {
    throw new Error('DataGridToolbar must be rendered inside a <DataGridProvider>.');
  }
  return context;
};

/**
 * Read the shared grid API if there is one, or `null`. Lets `DataGrid` reuse a provider's
 * apiRef when present (so an external toolbar can drive it) yet still work standalone.
 */
export const useOptionalDataGridApi = (): DataGridApiRef | null => {
  const context = useContext(DataGridContext);
  return context?.apiRef ?? null;
};
