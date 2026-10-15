import React, {ReactNode} from 'react';
import {ActionSchema} from '@schema/types';
import {ActionSchemaContext} from './useActionSchemaContext';

type ActionSchemaProviderProps = {
  schema: ActionSchema;
  children: ReactNode;
};

export const ActionSchemaProvider = ({schema, children}: ActionSchemaProviderProps) => {
  return <ActionSchemaContext.Provider value={schema}>{children}</ActionSchemaContext.Provider>;
};
