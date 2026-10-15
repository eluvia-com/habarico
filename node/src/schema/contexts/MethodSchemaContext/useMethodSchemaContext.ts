import {createContext, useContext} from 'react';
import {MethodSchema} from '@schema/types';

export const MethodSchemaContext = createContext<MethodSchema | undefined>(undefined);

export const useMethodSchemaContext = () => {
  const methodSchema = useContext(MethodSchemaContext);
  if (!methodSchema) {
    throw new Error('useMethodSchemaContext must be used inside a MethodSchemaProvider');
  }
  return methodSchema;
};
