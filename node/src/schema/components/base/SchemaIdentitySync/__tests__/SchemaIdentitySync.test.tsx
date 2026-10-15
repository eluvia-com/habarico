import React from 'react';
import {AuthProvider, CoreAdminContext, UserIdentity, memoryStore} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {SchemaRootContextState} from '@schema/contexts/SchemaRootContext/types';
import {SchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {render, waitFor} from '@testing-library/react';
import {SchemaIdentitySync} from '../SchemaIdentitySync';

// The sign-in, sign-out and impersonation cases are covered by `useSyncIdentity`; this pins the
// wiring — the identity React Admin resolves reaches `setUserIdentity` of the schema root context.
describe('SchemaIdentitySync', () => {
  it("hands React Admin's identity to the schema root context", async () => {
    const setUserIdentity = vi.fn<(identity: UserIdentity | undefined) => void>();
    const authProvider: AuthProvider = {
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      checkAuth: () => Promise.resolve(),
      checkError: () => Promise.resolve(),
      getPermissions: () => Promise.resolve(),
      getIdentity: () => Promise.resolve({id: 'user-a', fullName: 'User A'}),
    };

    render(
      <SchemaRootContext.Provider value={{setUserIdentity} as unknown as SchemaRootContextState}>
        <CoreAdminContext
          authProvider={authProvider}
          dataProvider={{} as never}
          store={memoryStore()}
        >
          <SchemaIdentitySync />
        </CoreAdminContext>
      </SchemaRootContext.Provider>
    );

    await waitFor(() =>
      expect(setUserIdentity).toHaveBeenLastCalledWith({id: 'user-a', fullName: 'User A'})
    );
  });
});
