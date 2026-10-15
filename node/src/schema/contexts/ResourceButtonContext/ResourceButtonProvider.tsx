import React, {ReactNode} from 'react';
import {ResourceButtonProvider as ResourceButtonProviderType} from '@schema/providers/types';
import {ResourceButtonProviderContext} from './useGetButton';

type ResourceButtonProviderProps = {
  provider: ResourceButtonProviderType;
  children: ReactNode;
};

export const ResourceButtonProvider = ({provider, children}: ResourceButtonProviderProps) => {
  return (
    <ResourceButtonProviderContext.Provider value={provider}>
      {children}
    </ResourceButtonProviderContext.Provider>
  );
};
