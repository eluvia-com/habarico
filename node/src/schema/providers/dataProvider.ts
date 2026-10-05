import queryString from 'query-string';
import {
  CreateParams,
  DeleteManyParams,
  DeleteParams,
  GetListParams,
  GetManyParams,
  GetManyReferenceParams,
  GetOneParams,
  HttpError,
  UpdateManyParams,
  UpdateParams,
  fetchUtils,
} from 'react-admin';
import {ExportParams, ServiceDataProvider} from '@schema/providers/types';
import {GlobalResourceSchema, RequestMethodType, ServicesSchema} from '@schema/types';
import {
  handleErrorResponse,
  parseContentDispositionFilename,
  serializeListFilter,
  serializeOrderBy,
  snakeCaseToCamelCase,
} from '@schema/utils/api';
import {
  FIELD_DEFAULT,
  FieldSelection,
  mergeFieldSelections,
  serializeFieldSelection,
} from '@schema/utils/fieldSelection';
import {resolveReferences, resourceOfKey, serviceOfKey} from '@schema/utils/resourceReference';
import {ActionParams, DataType, RequestMeta} from '@typing';

const DEFAULT_FIELDS: FieldSelection = {id: FIELD_DEFAULT, meta: FIELD_DEFAULT};

// A record id (React Admin's `Identifier` is `string | number`) is untrusted user input once it
// reaches this path segment: interpolating it raw lets a value with `/`, `?` or `#` change the
// request's route or attach query params the caller never asked for.
const encodeId = (id: string | number): string => encodeURIComponent(String(id));

// Returns `any` deliberately: the result feeds React Admin's generic data-provider
// methods (`GetOneResult<RecordType>` etc.), and a concrete object type is not
// assignable to those generic record parameters.
const parseInputData = (
  data: DataType | undefined,
  service: string,
  resourceSchema?: GlobalResourceSchema
): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // The identifier from `pkFieldName` wins over a raw `id` field in the payload: a record of a
  // resource keyed by something else may still carry its own `id`, and letting that through makes
  // React Admin reject the record ("Fetched record's id attribute must match the requested 'id'").
  // The fallback keeps partial records that do not carry `pkFieldName` at all working.
  const dataWithId = resourceSchema
    ? {
        ...data,
        id: data[resourceSchema.pkFieldName] ?? data.id,
      }
    : data;

  return {
    ...dataWithId,
    ...(data.meta
      ? {
          meta: resolveReferences(
            snakeCaseToCamelCase(data.meta, [
              'defaultFilters',
              'sortForFilters',
              'parameters',
              'data',
              'params',
            ]),
            service
          ),
        }
      : {}),
  };
};

// React Admin types its own `meta` as `any`, so what arrives here is unchecked at runtime even
// though the parameter is typed — hence the explicit string check.
const getLocaleFromMeta = (meta: RequestMeta | undefined): string | undefined => {
  const locale = meta?.locale;
  return typeof locale === 'string' && locale ? locale : undefined;
};

/**
 * Builds the authenticated JSON client every provider method calls: sets the auth headers on each
 * request and forwards the per-request locale as `Accept-Language`.
 *
 * Exported because a package that extends the data provider — `habarico-enterprise` adds the
 * endpoints only the paid backends serve — must reach its endpoints exactly the way the built-in
 * methods reach theirs. Rebuilding this in the extension would put the auth header logic in two
 * places and let them drift apart silently.
 */
export const createHttpClient =
  (getAuthHeaders: () => {[headerName: string]: string}) =>
  (url: string, options: fetchUtils.Options = {}, meta?: RequestMeta) => {
    const headers = (options.headers || new Headers()) as Headers;
    Object.entries(getAuthHeaders()).forEach(([headerName, value]) => {
      headers.set(headerName, value);
    });
    const locale = getLocaleFromMeta(meta);
    if (locale) {
      headers.set('Accept-Language', locale);
    }
    return fetchUtils.fetchJson(url, {...options, headers: headers});
  };

/**
 * Resolves a React Admin resource name (`"service/resource"`) to its schema. Exported for the same
 * reason as `createHttpClient`: an extension's own methods need the resource URL the built-in ones
 * use.
 */
export const getSchemaFromResource = (resource: string, servicesSchema: ServicesSchema) => {
  const serviceName = serviceOfKey(resource);
  const resourceName = resourceOfKey(resource);
  const serviceSchema = servicesSchema[serviceName];
  if (!serviceSchema) throw new Error(`Service "${serviceName}" not found`);
  const resourceSchema = serviceSchema.filter((s) => s.name == resourceName)[0];
  if (!resourceSchema)
    throw new Error(`Resource "${resourceName}" not found in service "${serviceName}"`);
  return resourceSchema;
};

/**
 * Builds the `ServiceDataProvider` for a resolved `servicesSchema`. `SchemaAdmin` calls this
 * directly (as `dataProviderFactory(servicesSchema, authProvider.getAuthHeaders)`), so pass the
 * function itself — `dataProviderFactory={getDataProviderFactory}` — rather than pre-binding
 * `getAuthHeaders` yourself.
 */
export const getDataProviderFactory = (
  servicesSchema: ServicesSchema,
  getAuthHeaders: () => {[headerName: string]: string}
): ServiceDataProvider => {
  // The locale arrives per request as `params.meta.locale`. Views thread it through React Admin's
  // queryOptions/mutationOptions, which serves two purposes at once: React Admin puts `meta` into
  // the query key, so data refetches on a language change, and it forwards it here, where it
  // becomes Accept-Language. Both are needed — per-record `meta` (repr, tags, schema.actions) is
  // localized by the backend, not by the i18n provider. A request that carries no locale gets no
  // header and falls back to the backend default.
  //
  // A view that both reads and mutates a record must pass the SAME meta to queryOptions and
  // mutationOptions: React Admin writes the mutation result to [resource, 'getOne', {id, meta}]
  // with an exact key match, so a mismatch lands the write on a key nothing reads.

  const getFieldSelectionFromParams = (
    schema: GlobalResourceSchema,
    params: GetListParams | GetOneParams
  ) => {
    const fieldsParam = params.meta?.fields as FieldSelection | undefined;
    const merged = fieldsParam ? mergeFieldSelections(fieldsParam, DEFAULT_FIELDS) : undefined;
    return merged
      ? Object.fromEntries(
          Object.entries(merged).map(([key, value]) => [
            key === 'id' ? schema.pkFieldName : key,
            value,
          ])
        )
      : undefined;
  };

  const httpClient = createHttpClient(getAuthHeaders);

  const dataProvider: ServiceDataProvider = {
    getList: async (resource: string, params: GetListParams) => {
      const schema = getSchemaFromResource(resource, servicesSchema);
      const {page = 1, perPage = 20} = params.pagination || {};
      const fieldSelection = getFieldSelectionFromParams(schema, params);

      const filterString = serializeListFilter(params.filter);

      const query: {
        order_by: string;
        offset: number;
        limit: number;
        filter?: string;
        fields?: string;
      } = {
        order_by: serializeOrderBy(schema, params.sort),
        offset: (page - 1) * perPage,
        limit: perPage,
      };

      if (filterString) {
        query.filter = filterString;
      }

      if (fieldSelection) {
        query.fields = serializeFieldSelection(fieldSelection);
      }

      try {
        const {json} = await httpClient(
          `${schema.url}?${queryString.stringify(query)}`,
          {},
          params.meta
        );
        return {
          data: json.objects.map((record: object) =>
            parseInputData(record, serviceOfKey(resource), schema)
          ),
          total: json.meta.total_count,
        };
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status);
        }
        throw e;
      }
    },

    getOne: async (resource: string, params: GetOneParams) => {
      const schema = getSchemaFromResource(resource, servicesSchema);
      const fieldSelection = getFieldSelectionFromParams(schema, params);

      const query: {
        fields?: string;
      } = params.meta?.query ? params.meta.query : {};
      if (fieldSelection) {
        query.fields = serializeFieldSelection(fieldSelection);
      }
      const {json} = await httpClient(
        `${schema.url}${encodeId(params.id)}/${queryString.stringify(query)}`,
        {},
        params.meta
      );
      return {data: parseInputData(json, serviceOfKey(resource), schema)};
    },

    getMany: async (resource: string, params: GetManyParams) => {
      const schema = getSchemaFromResource(resource, servicesSchema);
      const fieldSelection = getFieldSelectionFromParams(schema, params);

      const query: {
        filter: string;
        limit: number;
        fields?: string;
      } = {
        filter: `${schema.pkFieldName}__in=${JSON.stringify(params.ids)}`,
        limit: params.ids.length,
      };
      if (fieldSelection) {
        query.fields = serializeFieldSelection(fieldSelection);
      }
      try {
        const {json} = await httpClient(
          `${schema.url}?${queryString.stringify(query)}`,
          {},
          params.meta
        );
        return {
          data: json.objects.map((record: object) =>
            parseInputData(record, serviceOfKey(resource), schema)
          ),
          total: json.meta.total_count,
        };
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status);
        }
        throw e;
      }
    },

    getManyReference: async (resource: string, params: GetManyReferenceParams) => {
      const {id, target, filter, ...rest} = params;

      return dataProvider.getList(resource, {
        ...rest,
        filter: {...filter, [target]: id},
      });
    },

    create: async (resource: string, params: CreateParams) => {
      try {
        const query = params.meta?.query ? `?${queryString.stringify(params.meta.query)}` : '';
        const schema = getSchemaFromResource(resource, servicesSchema);
        const {json} = await httpClient(
          `${schema.url}${query}`,
          {
            method: 'POST',
            body: JSON.stringify(params.data),
          },
          params.meta
        );

        return {data: parseInputData(json, serviceOfKey(resource), schema)};
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status, 'ra.message.invalid_form');
        }
        throw e;
      }
    },

    update: async (resource: string, params: UpdateParams) => {
      try {
        const query = params.meta?.query ? `?${queryString.stringify(params.meta.query)}` : '';
        const schema = getSchemaFromResource(resource, servicesSchema);
        const {json} = await httpClient(
          `${schema.url}${encodeId(params.id)}/${query}`,
          {
            method: 'PUT',
            body: JSON.stringify(params.data),
          },
          params.meta
        );
        return {data: parseInputData(json, serviceOfKey(resource), schema)};
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status, 'ra.message.invalid_form');
        }
        throw e;
      }
    },

    updateMany: async (resource: string, params: UpdateManyParams) => {
      const schema = getSchemaFromResource(resource, servicesSchema);
      const query = {
        filter: JSON.stringify({id: params.ids}),
      };
      try {
        const {json} = await httpClient(
          `${schema.url}?${JSON.stringify(query)}`,
          {
            method: 'PUT',
            body: JSON.stringify(params.data),
          },
          params.meta
        );
        return {data: parseInputData(json, serviceOfKey(resource), schema)};
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status);
        }
        throw e;
      }
    },

    delete: async (resource: string, params: DeleteParams) => {
      try {
        const query = params.meta?.query ? `?${queryString.stringify(params.meta.query)}` : '';
        const schema = getSchemaFromResource(resource, servicesSchema);
        const {json} = await httpClient(
          `${schema.url}${encodeId(params.id)}/${query}`,
          {
            method: 'DELETE',
          },
          params.meta
        );
        return {data: json};
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status);
        }
        throw e;
      }
    },

    deleteMany: async (resource: string, params: DeleteManyParams) => {
      const schema = getSchemaFromResource(resource, servicesSchema);
      const query = {
        filter: JSON.stringify({id: params.ids}),
      };
      try {
        const {json} = await httpClient(
          `${schema.url}?${JSON.stringify(query)}`,
          {
            method: 'DELETE',
          },
          params.meta
        );
        return {data: json};
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status);
        }
        throw e;
      }
    },

    callAction: async (
      resource: string,
      method: RequestMethodType,
      path?: string,
      params?: ActionParams
    ) => {
      const schema = getSchemaFromResource(resource, servicesSchema);
      try {
        let url = schema.url;
        if (params && params.id) {
          url = `${url}${encodeId(params.id)}/`;
        }
        if (path) {
          url = new URL(path, new URL(url)).toString();
        }
        const {json} = await httpClient(
          url,
          {
            method: method.toUpperCase(),
            body: params?.data && JSON.stringify(params?.data),
          },
          params?.meta
        );
        return {
          data: path ? parseInputData(json, serviceOfKey(resource)) : json,
        };
      } catch (e) {
        if (e instanceof HttpError) {
          handleErrorResponse(e.body, e.status);
        }
        throw e;
      }
    },

    // Raw fetch instead of fetchUtils.fetchJson: the response body is a binary file
    // (CSV now, XLSX later), not JSON
    export: async (resource: string, params: ExportParams) => {
      const schema = getSchemaFromResource(resource, servicesSchema);

      const query: {
        format: string;
        order_by: string;
        fields?: string;
        ids?: string;
        filter?: string;
      } = {
        format: params.format,
        order_by: serializeOrderBy(schema, params.sort),
      };
      if (params.fields && params.fields.length > 0) {
        query.fields = params.fields.join(',');
      }
      if (params.ids && params.ids.length > 0) {
        query.ids = params.ids.join(',');
      }
      const filterString = params.filter ? serializeListFilter(params.filter) : undefined;
      if (filterString) {
        query.filter = filterString;
      }

      const headers = new Headers();
      Object.entries(getAuthHeaders()).forEach(([headerName, value]) => {
        headers.set(headerName, value);
      });

      const response = await fetch(`${schema.url}export/?${queryString.stringify(query)}`, {
        headers,
      });

      if (!response.ok) {
        let body: DataType | undefined;
        try {
          body = await response.json();
        } catch {
          body = undefined;
        }
        handleErrorResponse(body, response.status);
      }

      // 202 Accepted — export exceeds the sync threshold and runs in the background
      if (response.status === 202) {
        return {status: response.status};
      }

      return {
        status: response.status,
        blob: await response.blob(),
        filename: parseContentDispositionFilename(response.headers.get('Content-Disposition')),
      };
    },
  };
  return dataProvider;
};
