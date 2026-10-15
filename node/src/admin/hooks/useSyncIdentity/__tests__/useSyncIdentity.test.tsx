import React, {ReactNode, useMemo, useState} from 'react';
import {
  AuthProvider,
  CoreAdminContext,
  CoreAdminUI,
  CustomRoutes,
  Resource,
  UserIdentity,
  memoryStore,
  useAuthProvider,
  useGetIdentity,
  useLogout,
} from 'react-admin';
import {Route, useNavigate} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AdminHashRouter} from '@admin/components/base/AdminHashRouter';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useSyncIdentity} from '../useSyncIdentity';

// An auth provider over a mutable session, the way `buildServiceAuthProvider` reads its persisted
// auth data: `getIdentity` rejects while signed out.
const buildAuthProvider = (initialUser?: UserIdentity) => {
  let user = initialUser;
  const authProvider: AuthProvider = {
    login: ({id}: {id: string}) => {
      user = {id, fullName: `User ${id}`};
      return Promise.resolve();
    },
    logout: () => {
      user = undefined;
      return Promise.resolve();
    },
    checkAuth: () => (user ? Promise.resolve() : Promise.reject()),
    checkError: () => Promise.resolve(),
    getPermissions: () => Promise.resolve(),
    getIdentity: () => (user ? Promise.resolve(user) : Promise.reject(new Error('signed out'))),
  };
  return authProvider;
};

// Like the real layouts, which read the identity for the user menu.
const Layout = ({children}: {children: ReactNode}) => {
  const {identity} = useGetIdentity();
  const logout = useLogout();
  return (
    <div>
      <span>Signed in as {identity?.fullName}</span>
      <button onClick={() => logout()}>Sign out</button>
      {children}
    </div>
  );
};

// Like `LoginForm`: signs in through the auth provider directly, then navigates.
const LoginPage = ({id}: {id: string}) => {
  const authProvider = useAuthProvider()!;
  const navigate = useNavigate();
  const signIn = async () => {
    await authProvider.login({id});
    navigate('/');
  };
  return <button onClick={signIn}>Sign in as {id}</button>;
};

// Like `DynamicAdminUI`: the resources appear only once the synced identity is known.
const App = ({
  initialUser,
  nextUser,
  onChange,
}: {
  initialUser?: UserIdentity;
  nextUser: string;
  onChange: (identity: UserIdentity | undefined) => void;
}) => {
  const [identity, setIdentity] = useState(initialUser);
  // An element, not an inline component: a new component type on every render would remount the
  // login page under a click.
  const loginPage = useMemo(() => <LoginPage id={nextUser} />, [nextUser]);
  useSyncIdentity((next) => {
    onChange(next);
    setIdentity(next);
  });
  return (
    <CoreAdminUI layout={Layout} loginPage={loginPage} requireAuth>
      {identity && <Resource name="products" list={() => <p>Products of {identity.id}</p>} />}
      <CustomRoutes noLayout>
        <Route path="/reset-password" element={<p>Reset password</p>} />
      </CustomRoutes>
    </CoreAdminUI>
  );
};

const renderAdmin = ({
  initialUser,
  nextUser = 'user-b',
}: {initialUser?: UserIdentity; nextUser?: string} = {}) => {
  const onChange = vi.fn();
  render(
    <CoreAdminContext
      authProvider={buildAuthProvider(initialUser)}
      dataProvider={{} as never}
      store={memoryStore()}
    >
      <App initialUser={initialUser} nextUser={nextUser} onChange={onChange} />
    </CoreAdminContext>
  );
  return onChange;
};

// Every wait below spans a sign-in or sign-out: the auth check, the identity fetch, the sync back up
// and the resource re-registration each take a render. On a loaded CI runner that chain has
// outlasted the 1s default of `findBy*`/`waitFor`.
const AUTH_WAIT = {timeout: 10000};

describe('useSyncIdentity', () => {
  // React Admin routes through the URL hash, which jsdom keeps between tests: a test that signs out
  // would leave the next one starting on the login page.
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('reports the identity of a session that is already signed in', async () => {
    const onChange = renderAdmin({initialUser: {id: 'user-a'}});

    await screen.findByText('Products of user-a', {}, AUTH_WAIT);
    expect(onChange).toHaveBeenLastCalledWith({id: 'user-a'});
  });

  it('reports the identity after signing in without a reload', async () => {
    const onChange = renderAdmin();

    await userEvent.click(
      await screen.findByRole('button', {name: 'Sign in as user-b'}, AUTH_WAIT)
    );

    await screen.findByText('Products of user-b', {}, AUTH_WAIT);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({id: 'user-b'}));
  });

  it('reports the next user after signing out and in as someone else', async () => {
    const onChange = renderAdmin({initialUser: {id: 'user-a'}, nextUser: 'user-b'});
    await screen.findByText('Products of user-a', {}, AUTH_WAIT);

    await userEvent.click(screen.getByRole('button', {name: 'Sign out'}));
    await userEvent.click(
      await screen.findByRole('button', {name: 'Sign in as user-b'}, AUTH_WAIT)
    );

    await waitFor(
      () => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({id: 'user-b'})),
      AUTH_WAIT
    );
    await screen.findByText('Products of user-b', {}, AUTH_WAIT);
  });

  it('reports a missing identity after signing out', async () => {
    const onChange = renderAdmin({initialUser: {id: 'user-a'}});
    await screen.findByText('Products of user-a', {}, AUTH_WAIT);

    await userEvent.click(screen.getByRole('button', {name: 'Sign out'}));
    await screen.findByRole('button', {name: 'Sign in as user-b'}, AUTH_WAIT);

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(undefined), AUTH_WAIT);
  });

  // Like `SchemaAdmin`: the identity is held above the React Admin context and scopes its store, so
  // every sign-in and sign-out re-renders `<CoreAdminContext>` with another store — under a router
  // that stays the same (`AdminHashRouter`).
  it('signs out and in again while the identity scopes the store', async () => {
    const authProvider = buildAuthProvider({id: 'user-a'});
    const Sync = ({onChange}: {onChange: (identity: UserIdentity | undefined) => void}) => {
      useSyncIdentity(onChange);
      return null;
    };
    const LoginPageB = () => <LoginPage id="user-b" />;
    const onChange = vi.fn();
    const ScopedAdmin = () => {
      const [identity, setIdentity] = useState<UserIdentity | undefined>({id: 'user-a'});
      const userId = identity?.id;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- one store per signed-in user
      const store = useMemo(() => memoryStore(), [userId]);
      return (
        <AdminHashRouter>
          <CoreAdminContext authProvider={authProvider} dataProvider={{} as never} store={store}>
            <Sync
              onChange={(next) => {
                onChange(next);
                setIdentity(next);
              }}
            />
            <CoreAdminUI layout={Layout} loginPage={LoginPageB} requireAuth>
              <Resource name="products" list={() => <p>Products of {userId}</p>} />
            </CoreAdminUI>
          </CoreAdminContext>
        </AdminHashRouter>
      );
    };
    render(<ScopedAdmin />);
    await screen.findByText('Products of user-a', {}, AUTH_WAIT);

    for (let round = 0; round < 2; round += 1) {
      await userEvent.click(await screen.findByRole('button', {name: 'Sign out'}, AUTH_WAIT));
      await screen.findByRole('button', {name: 'Sign in as user-b'}, AUTH_WAIT);
      await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(undefined), AUTH_WAIT);
      await userEvent.click(screen.getByRole('button', {name: 'Sign in as user-b'}));
      await screen.findByText('Products of user-b', {}, AUTH_WAIT);
    }
  }, 30000);
});
