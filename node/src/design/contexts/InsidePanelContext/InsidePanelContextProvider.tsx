import React, {ReactNode} from 'react';
import {InsidePanelContext} from './InsidePanelContext';

type InsidePanelContextProviderProps = {
  value: boolean;
  children: ReactNode;
};

export const InsidePanelContextProvider = ({value, children}: InsidePanelContextProviderProps) => {
  return <InsidePanelContext.Provider value={value}>{children}</InsidePanelContext.Provider>;
};
