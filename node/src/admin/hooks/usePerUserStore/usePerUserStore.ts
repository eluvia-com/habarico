import {Dispatch, SetStateAction, useMemo} from 'react';
import {AuthProvider, Store, UserIdentity} from 'react-admin';
import {useStoreIdentity} from '@admin/hooks/useStoreIdentity';
import {
  PerUserStoreOptions,
  createScopedStore,
  toStoreUserId,
} from '@admin/utils/createPerUserStore';

export type UsePerUserStoreOptions = Omit<PerUserStoreOptions, 'identity'> & {
  authProvider: AuthProvider | undefined;
};

export type UsePerUserStoreResult = {
  store: Store;
  userIdentity: UserIdentity | undefined;
  setUserIdentity: Dispatch<SetStateAction<UserIdentity | undefined>>;
};

/**
 * A `createPerUserStore` store for `identity`, created again whenever the scope changes — a
 * sign-in, a switch to another user or an impersonation — and kept while it does not, so a
 * refetched identity of the same user (a renamed account) leaves the store alone.
 *
 * `whitelist` is compared by its contents, so an inline array does not create a new store on every
 * render; `backendApi` is compared by reference. Not part of the public barrel.
 */
export const useScopedStore = (
  identity: UserIdentity | undefined,
  {clearOnReset, backendApi, whitelist}: Omit<PerUserStoreOptions, 'identity'> = {}
): Store => {
  const storeUserId = toStoreUserId(identity);

  // The list is rebuilt from the key rather than closed over, so the memo depends on exactly what
  // it reads. NUL cannot occur in a store key.
  const whitelistKey = whitelist?.join('\u0000');
  const stableWhitelist = useMemo(
    () => (whitelistKey === undefined ? undefined : whitelistKey.split('\u0000').filter(Boolean)),
    [whitelistKey]
  );

  return useMemo(
    () => createScopedStore(storeUserId, {clearOnReset, backendApi, whitelist: stableWhitelist}),
    [storeUserId, clearOnReset, backendApi, stableWhitelist]
  );
};

/**
 * The per-user React Admin store of a hand-assembled admin, together with the signed-in user it is
 * scoped to.
 *
 * The user is resolved through `authProvider.getIdentity()` on page load. To follow a sign-in, a
 * switch to another user or an impersonation without a reload, feed `setUserIdentity` from inside
 * `<AdminContext>` — on the schema path, pass both to `SchemaRootContextProvider` and render
 * `SchemaIdentitySync`. A new store is created whenever someone else signs in.
 */
export const usePerUserStore = ({
  authProvider,
  ...options
}: UsePerUserStoreOptions): UsePerUserStoreResult => {
  const [userIdentity, setUserIdentity] = useStoreIdentity(authProvider);
  const store = useScopedStore(userIdentity, options);

  return {store, userIdentity, setUserIdentity};
};
