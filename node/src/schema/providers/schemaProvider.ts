import queryString from 'query-string';
import {HttpError} from 'react-admin';
import {SchemaProvider} from '@schema/providers/types';
import {handleErrorResponse, snakeCaseToCamelCase} from '@schema/utils/api';

const UPLOAD_URL_KEYS = new Set(['initiateUrl', 'endpoint']);

/**
 * Resolve relative upload URLs (`initiateUrl` for s3-multipart, `endpoint` for tus) against the
 * service base URL, in place. Absolute URLs are left unchanged (`new URL(abs, base)` returns abs).
 */
export const resolveRelativeUploadUrls = (obj: any, base: string): void => {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((item) => resolveRelativeUploadUrls(item, base));
    return;
  }
  for (const key of Object.keys(obj)) {
    if (UPLOAD_URL_KEYS.has(key) && typeof obj[key] === 'string') {
      obj[key] = new URL(obj[key], base).toString();
    } else {
      resolveRelativeUploadUrls(obj[key], base);
    }
  }
};

export const getSchemaProvider = (
  getAuthHeaders: () => {[headerName: string]: string}
): SchemaProvider => {
  return {
    getServiceSchema: async (serviceName, serviceUrl, params) => {
      const schemaUrl = serviceUrl + '/schema/';
      const response = await fetch(schemaUrl, {
        headers: {
          ...getAuthHeaders(),
          'Accept-Language': params?.meta?.locale as string,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch schema for service: ${serviceName}`);
      }
      const jsonData = await response.json();
      const data = snakeCaseToCamelCase(jsonData, [
        'defaultFilters',
        'sortForFilters',
        'extraFilters',
        'params',
      ]);
      for (const resource of data) {
        resource.url = serviceUrl + '/' + resource.name + '/';
        resolveRelativeUploadUrls(resource, serviceUrl);
      }
      return data;
    },
    getRecordSchema: async (resourceUrl, actionName, recordId, params) => {
      let schemaUrl = resourceUrl;
      if (recordId) {
        schemaUrl += `${recordId}/`;
      }
      if (actionName) {
        schemaUrl += `${actionName}/`;
      }
      schemaUrl += 'schema/';
      const stringParams = params?.params ? queryString.stringify(params.params) : '';
      const response = await fetch(`${schemaUrl}?${stringParams}`, {
        headers: {
          ...getAuthHeaders(),
          'Accept-Language': params?.meta?.locale as string,
        },
      });
      if (!response.ok) {
        let body;
        try {
          body = await response.json();
        } catch (e) {
          // Response is not JSON (e.g. HTML error page from server)
          console.error(
            `Failed to parse JSON response for schema fetch: ${e instanceof Error ? e.message : e}`
          );
        }
        handleErrorResponse(
          body,
          response.status,
          `Failed to fetch schema for URL: ${resourceUrl}`
        );
      }
      const jsonData = await response.json();
      const data = snakeCaseToCamelCase(jsonData, [
        'defaultFilters',
        'sortForFilters',
        'extraFilters',
        'parameters',
        'defaultValue',
        'data',
        'params',
      ]);
      data.url = resourceUrl;
      resolveRelativeUploadUrls(data, resourceUrl);
      return data;
    },
    listPreferences: async (serviceUrl) => {
      const url = `${serviceUrl.replace(/\/$/, '')}/user-preferences/`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new HttpError(
          `Failed to load user preferences (status ${response.status})`,
          response.status
        );
      }
      const items = (await response.json()) as Array<{key: string; value: unknown}>;
      return Object.fromEntries(items.map((item) => [item.key, item.value]));
    },
    setPreference: async (serviceUrl, key, value) => {
      const url = `${serviceUrl.replace(/\/$/, '')}/user-preferences/${key}/`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(value),
      });
      if (!response.ok) {
        throw new HttpError(
          `Failed to save preference "${key}" (status ${response.status})`,
          response.status
        );
      }
    },
    deletePreference: async (serviceUrl, key) => {
      const url = `${serviceUrl.replace(/\/$/, '')}/user-preferences/${key}/`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new HttpError(
          `Failed to delete preference "${key}" (status ${response.status})`,
          response.status
        );
      }
    },
    deleteAllPreferences: async (serviceUrl) => {
      const url = `${serviceUrl.replace(/\/$/, '')}/user-preferences/`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new HttpError(
          `Failed to delete all user preferences (status ${response.status})`,
          response.status
        );
      }
    },
  };
};
