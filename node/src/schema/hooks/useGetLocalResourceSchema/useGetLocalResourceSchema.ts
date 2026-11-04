import {useMemo} from 'react';
import {useResourceContext as useRaResourceContext} from 'react-admin';
import {LocalResourceSchema, RequestMethodType} from '@schema/types';
import {
  hasUnresolvedReferences,
  resolveReferences,
  serviceOfKey,
} from '@schema/utils/resourceReference';
import {useQuery} from '@tanstack/react-query';
import {useLocalResourceSchemaQueryOptions} from './useLocalResourceSchemaQueryOptions';

type GetLocalResourceSchemaProps = {
  schema?: LocalResourceSchema;
  resource?: string;
  actionName?: string;
  recordId?: string | number;
  params?: {[key: string]: string | number | boolean};
  /**
   * Whether to fetch at all. Defaults to `true`; pass `false` to hold the request back while the
   * caller is not on screen (a box in a hidden tab), and flip it to `true` when it becomes visible.
   * The query keeps its key either way, so a schema already in the cache is returned immediately.
   */
  enabled?: boolean;
};

export const useGetLocalResourceSchema = ({
  schema,
  recordId,
  params,
  actionName,
  enabled = true,
  ...rest
}: GetLocalResourceSchemaProps) => {
  // tolerate a missing resource / ResourceContext (e.g. dashboard widgets): the query is
  // gated on globalResourceSchema, so without a resource it simply stays disabled
  const resource = useRaResourceContext(rest);
  const service = resource && serviceOfKey(resource);
  const {query, isUnknown} = useLocalResourceSchemaQueryOptions()({
    resource: resource ?? '',
    recordId,
    actionName,
    params,
  });

  const {
    data: fetchedSchema,
    isLoading,
    error,
    isError,
  } = useQuery({...query, enabled: enabled && query.enabled && !schema});

  // a schema handed in is resolved against the resource's service like a fetched one; without a
  // service to resolve against, its references must already name theirs
  const givenSchema = useMemo(
    () => (schema && service ? resolveReferences(schema, service) : schema),
    [schema, service]
  );
  const unresolvedSchemaError =
    givenSchema && !service && hasUnresolvedReferences(givenSchema)
      ? new Error(
          'useGetLocalResourceSchema was given a schema whose references lack a service and no resource to take it from'
        )
      : undefined;

  const resourceSchema = fetchedSchema || givenSchema;

  // an unknown resource (or none resolvable from context) with no schema handed in can never yield
  // one: surface it as an error instead of silently returning an empty schema
  const cannotResolveSchema = isUnknown && !schema;
  const resolveError = cannotResolveSchema
    ? new Error(
        'useGetLocalResourceSchema could not resolve a schema: no matching resource was found and no schema was provided'
      )
    : undefined;

  const getViewSchema = (name: string) => {
    return resourceSchema?.views?.find((view) => view.name === name);
  };

  const getMethodSchema = (method: RequestMethodType) => {
    return resourceSchema?.endpoints[method];
  };

  const getFieldSchema = (method: RequestMethodType, fieldName: string) => {
    return resourceSchema?.endpoints[method].fields.find((field) => field.name === fieldName);
  };

  const hasListView = fetchedSchema?.views?.some((v) => v.name === 'list') ?? false;
  const hasCreateView = fetchedSchema?.views?.some((v) => v.name === 'create') ?? false;
  const hasEditView = fetchedSchema?.views?.some((v) => v.name === 'edit') ?? false;
  const hasShowView = fetchedSchema?.views?.some((v) => v.name === 'show') ?? false;

  const hasListAction =
    fetchedSchema?.actions?.some((a) => a.type === 'view' && a.name === 'list') ?? false;
  const hasCreateAction =
    fetchedSchema?.actions?.some((a) => a.type === 'view' && a.name === 'create') ?? false;
  const hasEditAction =
    fetchedSchema?.actions?.some((a) => a.type === 'view' && a.name === 'edit') ?? false;
  const hasShowAction =
    fetchedSchema?.actions?.some((a) => a.type === 'view' && a.name === 'show') ?? false;

  const hasDeleteAction = fetchedSchema?.actions?.some((a) => a.name === 'delete') ?? false;
  const hasGetEndpoint = fetchedSchema?.endpoints?.get !== undefined;
  const hasPostEndpoint = fetchedSchema?.endpoints?.post !== undefined;
  const hasPutEndpoint = fetchedSchema?.endpoints?.put !== undefined;
  const hasPatchEndpoint = fetchedSchema?.endpoints?.patch !== undefined;
  const hasDeleteEndpoint = fetchedSchema?.endpoints?.delete !== undefined;

  return {
    isLoading,
    error: resolveError ?? unresolvedSchemaError ?? error,
    isError: cannotResolveSchema || !!unresolvedSchemaError || isError,
    schema: resourceSchema,
    getMethodSchema,
    getViewSchema,
    getFieldSchema,
    hasListView,
    hasCreateView,
    hasEditView,
    hasShowView,
    hasListAction,
    hasCreateAction,
    hasEditAction,
    hasShowAction,
    hasDeleteAction,
    hasGetEndpoint,
    hasPostEndpoint,
    hasPutEndpoint,
    hasPatchEndpoint,
    hasDeleteEndpoint,
  };
};
