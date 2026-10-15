import React, {ReactNode} from 'react';
import {ViewPresentationContext} from './ViewPresentationContext';
import {ViewPresentationState} from './types';

type ViewPresentationProviderProps = {
  value: ViewPresentationState;
  children: ReactNode;
};

export const ViewPresentationProvider = ({value, children}: ViewPresentationProviderProps) => {
  return (
    <ViewPresentationContext.Provider value={value}>{children}</ViewPresentationContext.Provider>
  );
};
