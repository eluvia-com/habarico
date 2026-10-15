import React, {ReactNode} from 'react';
import {RaRecord} from 'react-admin';
import {RootRecordContext} from './useRootRecordContext';

type BoxContextProviderProps = {
  value?: RaRecord;
  children: ReactNode;
};

export const RootRecordContextProvider = ({value, children}: BoxContextProviderProps) => {
  return <RootRecordContext.Provider value={value}>{children}</RootRecordContext.Provider>;
};
