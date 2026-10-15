import React, {ReactNode} from 'react';
import {ResourceDescriptor} from './types';
import {ParentResourceDescriptorsContext} from './useParentResourceDescriptorsContext';

type ParentDescriptorsProviderProps = {
  value: ResourceDescriptor[];
  children: ReactNode;
};

export const ParentResourceDescriptorsProvider = ({
  value,
  children,
}: ParentDescriptorsProviderProps) => {
  return (
    <ParentResourceDescriptorsContext.Provider value={value}>
      {children}
    </ParentResourceDescriptorsContext.Provider>
  );
};
