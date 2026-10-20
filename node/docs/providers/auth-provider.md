---
title: Auth provider
sidebar_position: 2
---

Connects the admin to authentication: who is signed in, what they may do, and the password and MFA
flows around it.

`buildServiceAuthProvider` is a plain factory — not a hook, and not tied to any specific auth
library. Pass it the individual auth operations (`login`, `logout`, password reset, MFA, …) plus
`getAuthData`/`clearAuthData` for the locally-held auth state, and it returns a
`ServiceAuthProvider`. Any auth library (or hand-rolled `fetch` calls and `localStorage`) can supply
those functions; nothing here imports a specific auth package. Implementing `ServiceAuthProvider`
by hand works too, for a shape the factory doesn't cover.

## Signature

```typescript
type ServiceAuthProvider = AuthProvider & {
  isAuthenticated: () => boolean;
  getIdentity: () => Promise<UserIdentity> | undefined;
  updateIdentity: (identity: Partial<UserIdentity>) => Promise<Response>;
  changePassword: (payload: {oldPassword: string; newPassword: string}) => Promise<void>;
  resetPassword: (payload: {username: string}) => Promise<void>;
  setPassword: (payload: {token: string; password: string}) => Promise<Response>;
  requestMfaChallenge: (payload: {method: string}) => Promise<unknown>;
  verifyMfa: (payload: {method: string; code: string; trust_device: boolean}) => Promise<Response>;
  getSsoLoginMethods?: () => LoginSsoMethod[];
  getAuthHeaders: () => Record<string, string>;
};

type ServiceAuthUser = {
  id: string | number;
  email?: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: {url?: string; filename?: string; content?: string};
};

type ServiceAuthData = {
  user?: ServiceAuthUser;
  jwt?: {access: string; refresh: string};
};
```

`AuthProvider` is React Admin's interface — `login`, `logout`, `checkAuth`, `checkError`,
`getPermissions`. The methods above are what Habarico adds on top. `ServiceAuthUser` /
`ServiceAuthData` are plain structural types — any auth library's user object works as long as it
carries these fields, no specific package required.

## Methods

| Method | Used by |
|---|---|
| `isAuthenticated` | Route guards — answers synchronously, without a request |
| `getIdentity` | The user menu, and the schema cache key |
| `updateIdentity` | The profile dialog |
| `changePassword` | The change-password dialog |
| `resetPassword` | "Forgotten password" on the login page |
| `setPassword` | [Reset password page](../page-components/reset-password-page-component.md), reached from the e-mail link |
| `requestMfaChallenge` / `verifyMfa` | The MFA step of [AuthPage](../page-components/auth-page-component.md) |
| `getSsoLoginMethods` | The SSO buttons on [AuthPage](../page-components/auth-page-component.md) — see below |
| `getAuthHeaders` | Every authenticated request: passed to [`getDataProviderFactory`](./data-provider.md) / [`getSchemaProvider`](./schema-provider.md) internally, and read by uploads (`useUploadQueue` / `UploadInput`) off the admin's `authProvider` |

## buildServiceAuthProvider

A plain function, not a hook. Hand it one function per operation; what they do inside is yours.
Below is a whole provider over a session-cookie backend — no auth library, just `fetch`:

```typescript
// src/auth.ts
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
  // This backend has no second factor: `login` never reports one, so these are never called.
  getMfaMethods: async () => ({available_methods: []}),
  requestMfaChallenge: async () => undefined,
  verifyMfaCode: () => Promise.reject(new Error('MFA is not supported')),
});
```

```tsx
import {SchemaAdmin, SchemaResource} from 'habarico';
import {authProvider} from './auth';

const App = () => (
  <SchemaAdmin authProvider={authProvider} /* … */>
    <SchemaResource name="eshop/product" />
  </SchemaAdmin>
);
```

That module and the two backends it talks to are the
[e-shop example](https://github.com/eluvia-com/habarico/tree/master/examples/eshop), which runs
against a Django and a Rails backend without a change.

`getMfaMethods`, `requestMfaChallenge`, `verifyMfaCode`, `getAuthData`, `clearAuthData` and
`getAuthHeaders` are **required** — the login flow always asks whether a second factor is needed,
and every other method reads or clears the local auth state through `getAuthData` /
`clearAuthData`. A backend without MFA stubs the three MFA functions as above: `login` returning
`isMfaRequired: false` means they are never reached.

Throw the raw `Response` from a failed `fetch` (not a parsed error) —
`buildServiceAuthProvider` catches `instanceof Response` and maps it to react-admin form errors.

:::caution
Build the provider once, at module scope as above. Built inside a component it has to be
memoised: a new object on every render restarts the identity query, which in turn invalidates the
schema cache — the schema key includes the identity, because permissions change what the schema
contains.
:::

:::tip
When the backend reports that a second factor is required, `login` throws `MfaRequiredError`,
which carries the available `methods`. That is the signal the login form turns into the MFA step —
a custom provider has to throw the same error to get the same screen.
:::

## SSO login methods

`AuthPage`'s login form renders one button per entry in `authProvider.getSsoLoginMethods()`
(Google, Apple, an internal SSO, …) below the credentials form, with a shared divider when the
list is non-empty. It lives on the auth provider rather than as a separate prop, because signing
in via SSO is just another way to authenticate. Habarico owns the button/spinner UI
(`LoginSsoMethodButton`); each entry supplies only the OAuth-driving *hook*:

```typescript
type LoginSsoMethod = {
  id: string;                                    // unique key, also used to detect its own callback
  label: string;                                  // translation key or literal text
  icon?: ReactNode;
  useLogin: (context: {location: Location; redirectPath: string; onSuccess?: () => void}) => {
    isCallback: boolean;                          // true while processing the provider's redirect
    loading: boolean;
    error?: unknown;
    login: () => void;                            // kicks off the flow, typically a redirect
  };
};
```

`buildServiceAuthProvider` takes an optional `ssoLoginMethods: LoginSsoMethod[]` param and exposes
it as `getSsoLoginMethods` for you. Any OAuth hook that fits the shape above works, wrapped to
close over its own config — here a `useGoogleLogin` from whichever library drives the flow:

```tsx
import {LoginSsoMethod, buildServiceAuthProvider, Iconify} from 'habarico';
import {useGoogleLogin} from './sso/google';

const googleSsoMethod: LoginSsoMethod = {
  id: 'google',
  label: 'ra.auth.sign_in_with_google', // or literal text
  icon: <Iconify icon="logos:google-icon" width={20} />,
  useLogin: ({location, redirectPath, onSuccess}) =>
    useGoogleLogin({googleClientId: '...', location, redirectPath, callbackAfterSuccessLogin: onSuccess}),
};

const authProvider = buildServiceAuthProvider({
  // ...login, logout, getAuthData, clearAuthData, getAuthHeaders, etc. — see above
  ssoLoginMethods: [googleSsoMethod],
});
```

Register as many entries as needed — each renders its own button and manages its own callback
independently. Writing a custom `ServiceAuthProvider` by hand instead? Implement
`getSsoLoginMethods: () => LoginSsoMethod[]` directly — it's optional, omit it for a plain
username/password login.

## getAuthHeaders

Headers (typically `Authorization`) attached to every authenticated request — required on
`ServiceAuthProvider`, since `SchemaAdmin` reads it off the built `authProvider` and passes it to
`dataProviderFactory` and the schema provider automatically (see
[Data provider](./data-provider.md) and [Schema provider](./schema-provider.md)). Uploads
(`useUploadQueue` / `UploadInput`) read it the same way, so pass the same function you give
`buildServiceAuthProvider` to those directly only when calling them outside an admin root.

## A custom provider

Implement `ServiceAuthProvider` and pass it as `authProvider`. Only the flows you expose need real
implementations: without `requestMfaChallenge` and `verifyMfa` the login page simply has no MFA
step, without `resetPassword` it has no "forgotten password" link, and without
`getSsoLoginMethods` it has no SSO buttons.

## See also

- [SchemaAdmin](../base-components/schema-admin.md) — where the provider is passed in
- [AuthPage](../page-components/auth-page-component.md) — the login screen that drives these methods
- [Permissions](/python/basic-usage/permissions) — what the backend does with the identity
