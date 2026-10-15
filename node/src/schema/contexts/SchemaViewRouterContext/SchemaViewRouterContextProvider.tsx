import React, {ReactNode} from 'react';
import {SchemaViewRouterContextProps} from './types';
import {SchemaViewRouterContext} from './useSchemaViewRouterContext';

type ViewDataProviderProps = {
  context: SchemaViewRouterContextProps;
  children: ReactNode;
};

export const SchemaViewRouterContextProvider = ({context, children}: ViewDataProviderProps) => {
  return (
    <SchemaViewRouterContext.Provider value={context}>{children}</SchemaViewRouterContext.Provider>
  );
};
