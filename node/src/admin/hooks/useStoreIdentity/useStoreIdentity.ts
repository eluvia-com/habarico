import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {AuthProvider, UserIdentity} from 'react-admin';

/**
 * The identity a per-user store is scoped to, held *above* `<Admin>` where the store is built.
 *
 * React Admin's `useGetIdentity` is unavailable there, so the first value comes from a one-off
 * `authProvider.getIdentity()` — enough to scope the store (and read its persisted locale) on the
 * first paint after a reload. From then on the identity is kept current by `useSyncIdentity`,
 * rendered inside `<Admin>` and handed this hook's setter (with a schema root context, through
 * `SchemaIdentitySync`), so a sign-in, sign-out or impersonation without a reload re-scopes the
 * store too.
 *
 * An identity already reported through the setter wins over a bootstrap that resolves later.
 */
export const useStoreIdentity = (
  authProvider: AuthProvider | undefined
): [UserIdentity | undefined, Dispatch<SetStateAction<UserIdentity | undefined>>] => {
  const [identity, setIdentity] = useState<UserIdentity | undefined>(undefined);

  useEffect(() => {
    authProvider
      ?.getIdentity?.()
      ?.then((bootstrapped) => {
        setIdentity((current) => current ?? bootstrapped);
      })
      .catch(() => {});
  }, [authProvider]);

  return [identity, setIdentity];
};
