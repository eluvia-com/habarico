import {createContext, useContext} from 'react';
import {RaRecord} from 'react-admin';

export const RootRecordContext = createContext<RaRecord | undefined>(undefined);

export const useRootRecordContext = <RecordType extends RaRecord>() => {
  const record = useContext(RootRecordContext);
  return record as RecordType | undefined;
};
