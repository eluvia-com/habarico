import {createContext, useContext, useMemo} from 'react';
import {useMethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import {FieldSchemaMap} from '@schema/types';

export const FieldSchemaMapContext = createContext<FieldSchemaMap | undefined>(undefined);

export const useFieldSchemaMapContext = () => {
  const methodSchema = useMethodSchemaContext();
  const methodSchemaFields = useMemo(() => {
    return methodSchema.fields.reduce((acc, field) => {
      if (field.name) acc[field.name] = field;
      return acc;
    }, {} as FieldSchemaMap);
  }, [methodSchema.fields]);

  return useContext(FieldSchemaMapContext) || methodSchemaFields;
};
