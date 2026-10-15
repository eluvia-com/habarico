import {UserIdentity} from 'react-admin';
import {SchemaProvider} from '@schema/providers/types';
import {ServicesSchema} from '@schema/types';
import {useQueries} from '@tanstack/react-query';
import {ServiceConfigMap} from '@typing';

// `isAuthenticated` (the auth provider's) is read on every render: once the auth provider has dropped
// the token, a render that still holds the last identity — React Admin clears the query cache on
// logout — must not refetch the schemas without it.
export function useGetServiceSchemas(
  serviceConfigMap: ServiceConfigMap,
  schemaProvider: SchemaProvider,
  locale: string,
  identity?: UserIdentity,
  isAuthenticated?: () => boolean
) {
  const serviceConfigMapEntries = Object.entries(serviceConfigMap);
  const isSignedIn = !!identity && (isAuthenticated?.() ?? true);

  const schemaQueries = useQueries({
    queries: serviceConfigMapEntries
      .filter(() => isSignedIn)
      .map(([key, config]) => {
        return {
          queryKey: ['serviceSchema', key, locale, identity?.id],
          queryFn: async () => {
            return await schemaProvider.getServiceSchema(key, config.url, {meta: {locale}});
          },
        };
      }),
  });

  const isLoading = schemaQueries.some((query) => query.isLoading);
  const isError = schemaQueries.some((query) => query.isError);
  const isLoaded = !isLoading && !isError && isSignedIn;

  const refetch = () => {
    schemaQueries.forEach((query) => query.refetch());
  };

  const servicesSchema: ServicesSchema = {};

  serviceConfigMapEntries.forEach(([key, _config], index) => {
    const query = schemaQueries[index];
    if (query && query.data) {
      servicesSchema[key] = query.data;
    }
  });

  return {isLoading, isLoaded, isError, servicesSchema, refetch};
}
