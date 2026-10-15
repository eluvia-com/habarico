import React, {ReactNode} from 'react';
import {MethodSchema} from '@schema/types';
import {MethodSchemaContext} from './useMethodSchemaContext';

type SchemaMethodProviderProps = {
  schema: MethodSchema;
  children: ReactNode;
};

export const MethodSchemaProvider = ({schema, children}: SchemaMethodProviderProps) => {
  return <MethodSchemaContext.Provider value={schema}>{children}</MethodSchemaContext.Provider>;
};
