import React, {ReactNode, useMemo} from 'react';
import {ListConfig, ListConfigContext} from './useListConfigContext';

type ListConfigProviderProps = ListConfig & {children: ReactNode};

export const ListConfigProvider = ({
  children,
  preferenceKey,
  sort,
  filterDefaultValues,
  filters,
  hasInlineFilters = false,
}: ListConfigProviderProps) => {
  // Memoized: rebuilding `config` from the rest-spread props on every render (as before) invalidated
  // the context for every consumer (`DatagridActions`, `SchemaDatagrid`) regardless of whether any of
  // these actually changed.
  const config = useMemo(
    () => ({preferenceKey, sort, filterDefaultValues, filters, hasInlineFilters}),
    [preferenceKey, sort, filterDefaultValues, filters, hasInlineFilters]
  );
  return <ListConfigContext.Provider value={config}>{children}</ListConfigContext.Provider>;
};
