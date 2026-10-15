import {createContext, useContext} from 'react';
import {FieldSchema} from '@schema/types';

export const FieldSchemaContext = createContext<FieldSchema | undefined>(undefined);

export const useFieldSchemaContext = () => {
  const context = useContext(FieldSchemaContext);
  if (context === undefined)
    throw new Error('SchemaFieldContext was used outside FieldSchemaProvider');
  return context;
};
