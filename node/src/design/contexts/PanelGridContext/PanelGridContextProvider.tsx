import React, {ReactNode} from 'react';
import {PanelGridContext} from './PanelGridContext';
import {ColumnsType} from './types';

type PanelGridContextProviderProps = {
  value?: ColumnsType;
  children: ReactNode;
};

export const PanelGridContextProvider = ({value, children}: PanelGridContextProviderProps) => {
  return <PanelGridContext.Provider value={value}>{children}</PanelGridContext.Provider>;
};
