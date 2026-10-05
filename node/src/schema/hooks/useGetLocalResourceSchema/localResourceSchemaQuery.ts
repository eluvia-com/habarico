import {Identifier} from 'react-admin';
import {SchemaProvider} from '@schema/providers/types';
import {resolveReferences, serviceOfKey} from '@schema/utils/resourceReference';

export type LocalResourceSchemaQueryProps = {
  schemaProvider: SchemaProvider;
  url: string;
  // the `service/resource` key the schema belongs to
  resource: string;
  recordId?: Identifier;
  actionName?: string;
  params?: {[key: string]: string | number | boolean};
  locale: string;
  identityId?: Identifier;
};

/** The query one resource schema is fetched by, shared so every reader of it hits one cache entry. */
export const localResourceSchemaQuery = ({
  schemaProvider,
  url,
  resource,
  recordId,
  actionName,
  params,
  locale,
  identityId,
}: LocalResourceSchemaQueryProps) => ({
  // `params` goes in as the object, not stringified: React Query hashes a key by sorting the keys of
  // every plain object in it, so the same query reaches one cache entry whatever order its params
  // arrive in. Pre-stringifying would hide the object from that and split the entry per order.
  queryKey: [
    'resourceSchema',
    url,
    resource,
    recordId,
    params ?? {},
    locale,
    identityId,
    actionName,
  ],
  queryFn: async () => {
    const schema = await schemaProvider.getRecordSchema(url, actionName, recordId, {
      params,
      meta: {locale},
    });
    return resolveReferences(schema, serviceOfKey(resource));
  },
  retry: false,
});
