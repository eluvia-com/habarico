import React, {ReactNode, useMemo} from 'react';
import {NotFound} from '@admin/components/common/NotFound';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {MethodSchema, ViewSchema} from '@schema/types';
import {ViewSchemaContext} from './useViewSchemaContext';

type SchemaViewProviderProps = {
  name: string;
  children: ReactNode;
  methodSchema?: MethodSchema;
  viewSchema?: ViewSchema;
};

export const ViewSchemaProvider = ({
  name,
  children,
  methodSchema,
  viewSchema,
}: SchemaViewProviderProps) => {
  const {getViewSchemaByName, getMethodSchema, resource, recordId, actionName} =
    useLocalResourceSchemaContext();
  const contextViewSchema = viewSchema || getViewSchemaByName(name);
  const contextMethodSchema = contextViewSchema
    ? methodSchema || getMethodSchema(contextViewSchema.endpoint.method)
    : undefined;

  const contextValue = useMemo(
    () =>
      contextViewSchema && contextMethodSchema
        ? {
            methodSchema: contextMethodSchema,
            viewSchema: contextViewSchema,
            resource,
            recordId,
            actionName,
          }
        : null,
    [contextMethodSchema, contextViewSchema, resource, recordId, actionName]
  );

  if (!contextViewSchema || !contextMethodSchema || !contextValue) return <NotFound />;

  return <ViewSchemaContext.Provider value={contextValue}>{children}</ViewSchemaContext.Provider>;
};
