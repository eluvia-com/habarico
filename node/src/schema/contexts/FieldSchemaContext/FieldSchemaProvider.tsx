import React, {ReactNode} from 'react';
import {FieldSchema} from '@schema/types';
import {FieldSchemaContext} from './useFieldSchemaContext';

type FieldSchemaProviderProps = {
  schema: FieldSchema;
  children: ReactNode;
};

export const FieldSchemaProvider = ({schema, children}: FieldSchemaProviderProps) => {
  return <FieldSchemaContext.Provider value={schema}>{children}</FieldSchemaContext.Provider>;
};
