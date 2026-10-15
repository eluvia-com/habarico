import React, {ReactNode} from 'react';
import {ResourceBoxProvider as ResourceBoxProviderType} from '@schema/providers/types';
import {ResourceBoxProviderContext} from './useGetBox';

type ResourceBoxProviderProps = {
  provider: ResourceBoxProviderType;
  children: ReactNode;
};

export const ResourceBoxProvider = ({provider, children}: ResourceBoxProviderProps) => {
  return (
    <ResourceBoxProviderContext.Provider value={provider}>
      {children}
    </ResourceBoxProviderContext.Provider>
  );
};
