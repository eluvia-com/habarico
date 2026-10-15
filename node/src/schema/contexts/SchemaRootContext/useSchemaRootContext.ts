import {createContext, useContext} from 'react';
import {SchemaRootContextState} from './types';

export const SchemaRootContext = createContext<SchemaRootContextState | undefined>(undefined);

export const useSchemaRootContext = () => {
  const context = useContext(SchemaRootContext);
  if (context === undefined)
    throw new Error('SchemaRootContext was used outside SchemaRootContextProvider');
  return context;
};
