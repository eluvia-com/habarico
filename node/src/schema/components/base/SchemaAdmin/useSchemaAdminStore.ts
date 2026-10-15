import {useMemo} from 'react';
import {Store, UserIdentity} from 'react-admin';
import {useScopedStore} from '@admin/hooks/usePerUserStore';
import {SchemaProvider} from '@schema/providers/types';
import {
  PREFERENCES_WHITELIST,
  buildPreferencesApi,
  resolvePreferencesServiceUrl,
} from '@schema/utils/preferencesStore';
import {ServiceConfigMap} from '@typing';

type UseSchemaAdminStoreOptions = {
  identity: UserIdentity | undefined;
  schemaProvider: SchemaProvider;
  serviceConfigMap: ServiceConfigMap;
  clearStoreOnLogout?: boolean;
  // Overrides the built-in whitelist of store keys mirrored to the backend.
  preferencesWhitelist?: string[];
};

// Builds the schema-layer per-user store, scoped to `identity` — held by `useStoreIdentity` in
// `SchemaAdmin` and kept current by `DynamicAdminUI` inside `<Admin>`. The store runs *above*
// `<Admin>` and above `SchemaRootContextProvider` so `SchemaAdmin` can read the persisted `locale`
// from it to seed the first schema fetch. It is backend-synced when a service exposes the
// `user-preferences` endpoint group. `useScopedStore` re-creates it on a sign-in, a switch to
// another user or an impersonation, so the store is re-scoped (and re-hydrated from the backend)
// without a reload. Private to the `SchemaAdmin/` folder.
export const useSchemaAdminStore = ({
  identity,
  schemaProvider,
  serviceConfigMap,
  clearStoreOnLogout,
  preferencesWhitelist = PREFERENCES_WHITELIST,
}: UseSchemaAdminStoreOptions): Store => {
  const backendApi = useMemo(() => {
    const url = resolvePreferencesServiceUrl(serviceConfigMap);
    if (!url) {
      return undefined;
    }
    return buildPreferencesApi(schemaProvider, url);
  }, [serviceConfigMap, schemaProvider]);

  return useScopedStore(identity, {
    clearOnReset: clearStoreOnLogout,
    backendApi,
    whitelist: preferencesWhitelist,
  });
};
