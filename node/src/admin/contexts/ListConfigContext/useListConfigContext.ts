import {createContext, useContext} from 'react';
import {InputProps, SortPayload} from 'react-admin';

export type ListConfig = {
  preferenceKey: string;
  sort: SortPayload;
  filterDefaultValues: object;
  filters: React.ReactElement<InputProps>[];
  hasInlineFilters?: boolean;
};

export const ListConfigContext = createContext<ListConfig | undefined>(undefined);

export const useListConfigContext = () => {
  const context = useContext(ListConfigContext);
  if (context === undefined)
    throw new Error('ListConfigContext was used outside ListConfigProvider');
  return context;
};
