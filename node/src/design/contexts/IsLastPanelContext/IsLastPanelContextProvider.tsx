import React, {ReactNode} from 'react';
import {IsLastPanelContext} from './IsLastPanelContext';

type IsLastPanelContextProviderProps = {
  value: boolean;
  children: ReactNode;
};

export const IsLastPanelContextProvider = ({value, children}: IsLastPanelContextProviderProps) => {
  return <IsLastPanelContext.Provider value={value}>{children}</IsLastPanelContext.Provider>;
};
