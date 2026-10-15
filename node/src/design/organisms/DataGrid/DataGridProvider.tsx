import React, {useMemo} from 'react';
import {useGridApiRef} from '@mui/x-data-grid';
import {type DataGridApiRef, DataGridContext} from './DataGridContext';

export type DataGridProviderProps = {
  /**
   * An existing grid API ref to share. When omitted, the provider creates one — pass it (or
   * let `DataGrid` pick it up from context) so a separate `DataGridToolbar` can drive the grid.
   */
  apiRef?: DataGridApiRef;
  children: React.ReactNode;
};

/**
 * Shares one MUI X grid API between a `DataGrid` and a separately-composed `DataGridToolbar`,
 * so the toolbar's column/sort/sizing actions target the grid without them being nested. Wrap
 * both (in any layout) in a provider; the `DataGrid` reuses this apiRef instead of its own.
 */
export const DataGridProvider = ({apiRef, children}: DataGridProviderProps) => {
  const localApiRef = useGridApiRef();
  const resolvedApiRef = apiRef ?? localApiRef;
  // Memoized: a fresh `{apiRef}` object on every render would invalidate the context for
  // `DataGridToolbar` regardless of whether the ref itself actually changed.
  const value = useMemo(() => ({apiRef: resolvedApiRef}), [resolvedApiRef]);
  return <DataGridContext.Provider value={value}>{children}</DataGridContext.Provider>;
};
