import React, {ReactNode} from 'react';
import {FieldSchemaMap} from '@schema/types';
import {FieldSchemaMapContext} from './useFieldSchemaMapContext';

type FieldSchemaMapProviderProps = {
  schemaMap: FieldSchemaMap | undefined;
  children: ReactNode;
};

export const FieldSchemaMapProvider = ({schemaMap, children}: FieldSchemaMapProviderProps) => {
  return (
    <FieldSchemaMapContext.Provider value={schemaMap}>{children}</FieldSchemaMapContext.Provider>
  );
};
