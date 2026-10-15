import React, {ReactNode} from 'react';
import {ParentBoxContext} from './ParentBoxContext';
import {ParentBoxContextType} from './types';

type ParentBoxProviderProps = {
  value: ParentBoxContextType;
  children: ReactNode;
};

export const ParentBoxProvider = ({value, children}: ParentBoxProviderProps) => {
  return <ParentBoxContext.Provider value={value}>{children}</ParentBoxContext.Provider>;
};
