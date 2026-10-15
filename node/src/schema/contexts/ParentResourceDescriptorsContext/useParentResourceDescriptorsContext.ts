import {createContext, useContext} from 'react';
import {ResourceDescriptor} from './types';

export const ParentResourceDescriptorsContext = createContext<ResourceDescriptor[]>([]);

export const useParentResourceDescriptorsContext = () => {
  return useContext(ParentResourceDescriptorsContext);
};
