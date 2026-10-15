import {useSyncIdentity} from '@admin/hooks/useSyncIdentity';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext';

/**
 * Keeps `userIdentity` of `SchemaRootContext` current across sign-ins, sign-outs and impersonations,
 * by handing every identity React Admin resolves to its `setUserIdentity`.
 *
 * Renders nothing. Place it inside both `SchemaRootContextProvider` and the React Admin context
 * (`<AdminContext>`), which is where the identity is resolved. `SchemaAdmin` renders it itself; a
 * hand-assembled `SchemaRootContextProvider` needs it, or the identity stays the bootstrapped one
 * until the next reload.
 */
export const SchemaIdentitySync = () => {
  const {setUserIdentity} = useSchemaRootContext();
  useSyncIdentity(setUserIdentity);
  return null;
};
