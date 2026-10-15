import {createContext, useContext} from 'react';
import {ActionSchema} from '@schema/types';

export const ActionSchemaContext = createContext<ActionSchema | undefined>(undefined);

export const useActionSchemaContext = () => {
  const context = useContext(ActionSchemaContext);
  if (context === undefined)
    throw new Error('ActionSchemaContext was used outside ActionSchemaProvider');
  return context;
};
