import React, {ReactNode, createContext, useContext, useState} from 'react';
import {CoreAdminContext, CoreAdminUI, CustomRoutes, memoryStore, useNavigate} from 'react-admin';
import {MemoryRouter, Route} from 'react-router-dom';
import {beforeEach, describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AdminHashRouter} from '../AdminHashRouter';

// Lets a page re-render everything above the React Admin context, the way a sign-out re-scopes the
// store or drops the schemas of an admin.
const RerenderContext = createContext<() => void>(() => {});

// The timing of React Admin's `useLogout`: the auth provider's `logout()` resolves, whatever that
// changes re-renders the admin, and the redirect follows in a `setTimeout`.
const FirstPage = () => {
  const navigate = useNavigate();
  const rerenderAdmin = useContext(RerenderContext);
  const goToSecondPage = () => {
    Promise.resolve().then(() => {
      rerenderAdmin();
      setTimeout(() => navigate('/second'), 0);
    });
  };
  return <button onClick={goToSecondPage}>Go to the second page</button>;
};

const Admin = ({wrap}: {wrap: (admin: ReactNode) => ReactNode}) => {
  const [renders, setRenders] = useState(0);
  return (
    <RerenderContext.Provider value={() => setRenders((count) => count + 1)}>
      {wrap(
        // A new store on every render re-renders the React Admin context, like a re-scoped store.
        <CoreAdminContext dataProvider={{} as never} store={memoryStore({renders})}>
          <CoreAdminUI>
            <CustomRoutes noLayout>
              <Route path="/" element={<FirstPage />} />
              <Route path="/second" element={<p>Second page</p>} />
            </CustomRoutes>
          </CoreAdminUI>
        </CoreAdminContext>
      )}
    </RerenderContext.Provider>
  );
};

describe('AdminHashRouter', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('keeps a navigation that the admin context re-renders under', async () => {
    render(<Admin wrap={(admin) => <AdminHashRouter>{admin}</AdminHashRouter>} />);

    await userEvent.click(await screen.findByRole('button', {name: 'Go to the second page'}));

    expect(await screen.findByText('Second page')).toBeDefined();
    expect(window.location.hash).toBe('#/second');
  });

  it('routes through the hash under the given basename', async () => {
    window.location.hash = '#/shop/';
    render(<Admin wrap={(admin) => <AdminHashRouter basename="/shop">{admin}</AdminHashRouter>} />);

    await userEvent.click(await screen.findByRole('button', {name: 'Go to the second page'}));

    expect(await screen.findByText('Second page')).toBeDefined();
    expect(window.location.hash).toBe('#/shop/second');
  });

  it('leaves the routing to a router the application already renders', async () => {
    render(
      <Admin
        wrap={(admin) => (
          <MemoryRouter>
            <AdminHashRouter>{admin}</AdminHashRouter>
          </MemoryRouter>
        )}
      />
    );

    await userEvent.click(await screen.findByRole('button', {name: 'Go to the second page'}));

    expect(await screen.findByText('Second page')).toBeDefined();
    expect(window.location.hash).toBe('');
  });
});
