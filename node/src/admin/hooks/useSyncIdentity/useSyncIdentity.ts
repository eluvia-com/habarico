import {useEffect} from 'react';
import {UserIdentity, useEvent, useGetIdentity} from 'react-admin';
import {hashKey, useQueryClient} from '@tanstack/react-query';

// React Admin's cache key for `authProvider.getIdentity()` (`useGetIdentity`).
const IDENTITY_QUERY_KEY = ['auth', 'getIdentity'];
const IDENTITY_QUERY_HASH = hashKey(IDENTITY_QUERY_KEY);

/**
 * Reports every identity React Admin resolves to `onChange` — rendered inside `<Admin>` to carry a
 * sign-in, a sign-out, a switch to another user or an impersonation to state held above it (the
 * per-user store's `useStoreIdentity`).
 *
 * It watches the query cache rather than its own `useGetIdentity` result: React Admin clears the
 * cache on logout (also on the failed auth check of a signed-out start), which detaches every
 * mounted `useGetIdentity` from the query that the next sign-in fetches. The cache still announces
 * that query, whichever component (the layout's user menu, the login form) fetches it.
 *
 * A resolved identity is reported as it is; `undefined` is reported when the cache drops the
 * identity on logout, so the per-user store stops syncing with the backend and identity-gated
 * queries (the schema fetch) are skipped until the next sign-in. A failed lookup is not reported —
 * it leaves the last known identity in place.
 */
export const useSyncIdentity = (onChange: (identity: UserIdentity | undefined) => void): void => {
  const queryClient = useQueryClient();
  const report = useEvent(onChange);

  // Keeps the identity query alive and fetched while nothing else on screen reads it.
  useGetIdentity();

  useEffect(() => {
    const reportResolved = () => {
      const state = queryClient.getQueryState<UserIdentity>(IDENTITY_QUERY_KEY);
      if (state?.status === 'success' && state.data) {
        report(state.data);
      }
    };
    reportResolved();
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryHash !== IDENTITY_QUERY_HASH) {
        return;
      }
      if (event.type === 'updated') {
        reportResolved();
      } else if (event.type === 'removed') {
        report(undefined);
      }
    });
  }, [queryClient, report]);
};
