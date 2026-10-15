import React, {ReactNode} from 'react';
import {ResourceInputProvider as ResourceInputProviderType} from '@schema/providers/types';
import {ResourceInputProviderContext} from './useGetInput';

type ResourceInputProviderProps = {
  provider: ResourceInputProviderType;
  children: ReactNode;
};

export const ResourceInputProvider = ({provider, children}: ResourceInputProviderProps) => {
  return (
    <ResourceInputProviderContext.Provider value={provider}>
      {children}
    </ResourceInputProviderContext.Provider>
  );
};
