import React, {ReactNode, useMemo} from 'react';
import {Loading} from 'react-admin';
import {ErrorPage} from '@admin/components/common/ErrorPage';
import {LocalResourceSchemaContextType} from '@schema/contexts/LocalResourceSchemaContext/types';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {LocalResourceSchema} from '@schema/types';
import {IGNORED_PARAMS} from '@schema/utils/api';
import {DataType} from '@typing';
import {LocalResourceSchemaContext} from './useLocalResourceSchemaContext';

type LocalResourceSchemaProviderProps = {
  children: ReactNode;
  resource: string;
  actionName?: string;
  recordId?: string | number;
  params?: DataType;
  schema?: LocalResourceSchema;
};

export const LocalResourceSchemaProvider = ({
  children,
  resource,
  actionName,
  recordId,
  schema,
  ...rest
}: LocalResourceSchemaProviderProps) => {
  const {data} = useSchemaViewRouterContext();

  const defaultParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(data || {}).filter(([key]) => !IGNORED_PARAMS.includes(key))
      ),
    [data]
  );
  const params = rest.params ?? defaultParams;

  const {
    isLoading,
    isError,
    error,
    schema: resourceSchema,
  } = useGetLocalResourceSchema({
    schema,
    resource,
    actionName,
    recordId,
    params,
  });

  const contextValue = useMemo(
    () => ({schema: resourceSchema, resource, actionName, recordId, params}),
    [resourceSchema, resource, actionName, recordId, params]
  );

  if (isLoading) return <Loading />;

  if (isError || !resourceSchema) {
    return <ErrorPage error={error} />;
  }

  return (
    <LocalResourceSchemaContext.Provider value={contextValue as LocalResourceSchemaContextType}>
      {children}
    </LocalResourceSchemaContext.Provider>
  );
};
