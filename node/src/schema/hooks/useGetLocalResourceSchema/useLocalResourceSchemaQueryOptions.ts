import {useCallback} from 'react';
import {Identifier, useGetIdentity, useLocaleState} from 'react-admin';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {useGetGlobalResourceSchema} from '../useGetGlobalResourceSchema';
import {localResourceSchemaQuery} from './localResourceSchemaQuery';

export type LocalResourceSchemaAddress = {
  // the `service/resource` key
  resource: string;
  recordId?: Identifier;
  actionName?: string;
  params?: {[key: string]: string | number | boolean};
};

/**
 * Builds the query one resource schema is fetched by — enabled once its resource is known and the
 * user signed in — and tells whether the resource is missing from the loaded service schemas.
 */
export const useLocalResourceSchemaQueryOptions = () => {
  const getGlobalResourceSchema = useGetGlobalResourceSchema();
  const {schemaProvider, isLoaded} = useSchemaRootContext();
  const [locale] = useLocaleState();
  const {identity} = useGetIdentity();
  const identityId = identity?.id;
  const signedIn = !!identity;

  return useCallback(
    (address: LocalResourceSchemaAddress) => {
      const globalResourceSchema = getGlobalResourceSchema(address.resource);
      return {
        query: {
          ...localResourceSchemaQuery({
            ...address,
            schemaProvider,
            url: globalResourceSchema?.url ?? '',
            locale,
            identityId,
          }),
          enabled: !!globalResourceSchema && signedIn,
        },
        // a resource missing from the loaded service schemas never yields a schema
        isUnknown: isLoaded && !globalResourceSchema,
      };
    },
    [getGlobalResourceSchema, schemaProvider, isLoaded, locale, identityId, signedIn]
  );
};
