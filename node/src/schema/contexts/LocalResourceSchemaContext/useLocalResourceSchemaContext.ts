import {createContext, useContext} from 'react';
import {RequestMethodType} from '@schema/types';
import {serviceOfKey} from '@schema/utils/resourceReference';
import {LocalResourceSchemaContextType} from './types';

export const LocalResourceSchemaContext = createContext<LocalResourceSchemaContextType | undefined>(
  undefined
);

export const useLocalResourceSchemaContext = () => {
  const context = useContext(LocalResourceSchemaContext);

  if (context === undefined)
    throw new Error('LocalResourceSchemaContext was used outside LocalResourceSchemaProvider');

  const {schema, resource, recordId, params, actionName} = context;

  const getViewSchema = (name?: string) => {
    if (!name) return;
    return schema.views?.find((view) => view.name === name);
  };

  const getViewSchemaByName = (name: string) => {
    return schema.views?.find((view) => view.name === name);
  };

  const getMethodSchema = (method?: RequestMethodType) => {
    if (!method) return;
    return schema.endpoints[method];
  };
  const serviceName = resource ? serviceOfKey(resource) : '';
  return {
    serviceName,
    resource,
    recordId,
    actionName,
    params,
    schema,
    actions: schema.actions,
    getViewSchema,
    getViewSchemaByName,
    getMethodSchema,
  };
};
