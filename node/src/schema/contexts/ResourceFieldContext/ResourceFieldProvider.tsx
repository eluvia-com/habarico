import React, {ReactNode} from 'react';
import {ResourceFieldProvider as ResourceFieldProviderType} from '@schema/providers/types';
import {ResourceFieldProviderContext} from './useGetField';

type ResourceFieldProviderProps = {
  provider: ResourceFieldProviderType;
  children: ReactNode;
};

export const ResourceFieldProvider = ({provider, children}: ResourceFieldProviderProps) => {
  return (
    <ResourceFieldProviderContext.Provider value={provider}>
      {children}
    </ResourceFieldProviderContext.Provider>
  );
};
