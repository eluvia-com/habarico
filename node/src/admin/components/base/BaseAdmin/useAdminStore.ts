import {Store, UserIdentity} from 'react-admin';
import {useScopedStore} from '@admin/hooks/usePerUserStore';

// Schema-free per-user store for `BaseAdmin`, scoped to `identity` — held by `useStoreIdentity` in
// `BaseAdmin` (the store is a prop of `<Admin>`, so it is built *above* the React Admin context)
// and kept current by `IdentitySync` inside it. `useScopedStore` re-creates it on a sign-in, a
// switch to another user or an impersonation without a reload. No backend sync (that needs the
// schema-layer `serviceConfigMap`). Internal to the `BaseAdmin/` folder.
export const useAdminStore = (identity: UserIdentity | undefined): Store =>
  useScopedStore(identity);
