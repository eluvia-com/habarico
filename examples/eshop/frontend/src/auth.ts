import {buildServiceAuthProvider, type ServiceAuthData, type ServiceAuthUser} from 'habarico';

// The backend authenticates with its session cookie; the signed-in user is kept here only so the
// admin can answer "who is signed in" without a request. A 401 from the API clears it.
const USER_KEY = 'eshop.user';

const getCsrfToken = () => document.cookie.match(/(?:^|; )csrftoken=([^;]*)/)?.[1];

const getAuthHeaders = (): Record<string, string> => {
  const token = getCsrfToken();
  return token ? {'X-CSRFToken': decodeURIComponent(token)} : {};
};

const getAuthData = (): ServiceAuthData => {
  const user = localStorage.getItem(USER_KEY);
  return user ? {user: JSON.parse(user) as ServiceAuthUser} : {};
};

const setUser = (user: ServiceAuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(user));

const clearAuthData = () => localStorage.removeItem(USER_KEY);

// Throws the failed `Response` itself: `buildServiceAuthProvider` maps it onto the form's fields.
const request = async (path: string, method: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`/api/auth/${path}`, {
    method,
    headers: {'Content-Type': 'application/json', ...getAuthHeaders()},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw response;
  return response;
};

export const authProvider = buildServiceAuthProvider({
  login: async ({username, password}) => {
    const user = await (await request('login/', 'POST', {username, password})).json();
    setUser(user);
    return {data: user, isMfaRequired: false};
  },
  logout: async () => {
    clearAuthData();
    await request('logout/', 'POST');
  },
  forgottenPassword: ({email}) => request('forgotten-password/', 'POST', {email}),
  resetPassword: (token, {password}) => request('reset-password/', 'POST', {token, password}),
  changePassword: (payload) => request('current-user/change-password/', 'POST', payload),
  updateUser: async (user) => {
    const response = await request('current-user/', 'PATCH', user);
    setUser(await response.clone().json());
    return response;
  },
  getAuthData,
  clearAuthData,
  getAuthHeaders,
  // The backend has no second factor: `login` never reports one, so these are never called.
  getMfaMethods: async () => ({available_methods: []}),
  requestMfaChallenge: async () => undefined,
  verifyMfaCode: () => Promise.reject(new Error('MFA is not supported')),
});
