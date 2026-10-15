import {useGetIdentity, useLocaleState} from 'react-admin';
import {useResourceContextOrUndefined} from '@admin/contexts/ResourceContext';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {LocalResourceSchema, RequestMethodType} from '@schema/types';
import {useQuery} from '@tanstack/react-query';
import {useGetGlobalResourceSchema} from '../useGetGlobalResourceSchema';

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
  const resource = useResourceContextOrUndefined(rest.resource);
  const [locale] = useLocaleState();
  const globalResourceSchema = useGetGlobalResourceSchema()(resource ?? '');

  const {schemaProvider, isLoaded} = useSchemaRootContext();
  const {identity} = useGetIdentity();

  const paramsKey = JSON.stringify(params ?? {});

  const url = globalResourceSchema?.url || '';

  const {
    data: fetchedSchema,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: [
      'resourceSchema',
      url,
      resource,
      recordId,
      paramsKey,
      locale,
      identity?.id,
      actionName,
    ],
    queryFn: async () =>
      await schemaProvider.getRecordSchema(url, actionName, recordId, {
        params: params,
        meta: {locale},
      }),
    enabled: enabled && !!globalResourceSchema && !schema && !!identity,
    retry: false,
  });

  const resourceSchema = fetchedSchema || schema;

  // once the service schemas are loaded, a resource that resolves to no global schema (missing /
  // unknown resource, or none resolvable from context) with no schema prop supplied can never
  // yield a schema: surface it as an error instead of silently returning an empty one. Gated on
  // isLoaded so a valid resource doesn't flash an error while servicesSchema is still loading.
  const cannotResolveSchema = isLoaded && !globalResourceSchema && !schema;
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
    error: resolveError ?? error,
    isError: cannotResolveSchema || isError,
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
