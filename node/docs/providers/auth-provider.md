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

A plain function, not a hook — call your auth library's hooks (or write plain `fetch` calls) in
your own component, and pass the resulting functions in.

```tsx
import {useMemo} from 'react';
import {buildServiceAuthProvider, SchemaAdmin} from 'habarico';
import {
  usePasswordLoginWithMfa, useLogout, useForgottenPassword,
  useResetPassword, useChangePassword, useCurrentUser,
  getAuthData, clearAuthData, getAuthHeaders,
} from '@eluvia/auth';

const App = () => {
  const {login, getMethods, requestEmailChallenge, verifyEmailCode} = usePasswordLoginWithMfa();
  const {logout} = useLogout();
  const {forgottenPassword} = useForgottenPassword();
  const {resetPassword} = useResetPassword();
  const {post: changePassword} = useChangePassword();
  const {patch: updateUser} = useCurrentUser();

  const authProvider = useMemo(
    () => buildServiceAuthProvider({
      login, logout, forgottenPassword, resetPassword, changePassword, updateUser,
      getAuthData, clearAuthData, getAuthHeaders,
      getMfaMethods: getMethods,
      requestMfaChallenge: (method) => {
        if (method === 'email') return requestEmailChallenge();
        throw new Error(`Unsupported MFA method: ${method}`);
      },
      verifyMfaCode: (method, code, trustDevice) => {
        if (method === 'email') return verifyEmailCode(code, trustDevice);
        throw new Error(`Unsupported MFA method: ${method}`);
      },
    }),
    [login, logout, forgottenPassword, resetPassword, changePassword, updateUser,
     getMethods, requestEmailChallenge, verifyEmailCode],
  );

  return (
    <SchemaAdmin authProvider={authProvider} /* … */>
      <SchemaResource name="eshop/product" />
    </SchemaAdmin>
  );
};
```

`getMfaMethods`, `requestMfaChallenge`, `verifyMfaCode`, `getAuthData`, `clearAuthData` and
`getAuthHeaders` are **required** — the login flow always asks the backend whether a second factor
is needed, and every other method reads or clears the local auth state through `getAuthData` /
`clearAuthData`. `login` therefore has to come from `usePasswordLoginWithMfa`, not
`usePasswordLogin`, when using `@eluvia/auth`.

`buildServiceAuthProvider` isn't tied to `@eluvia/auth` at all — the same factory works with
hand-rolled `fetch` calls and your own `localStorage`-backed auth state; only the function
signatures need to match. Throw the raw `Response` from a failed `fetch` (not a parsed error) —
`buildServiceAuthProvider` catches `instanceof Response` and maps it to react-admin form errors.

:::caution
Memoise the provider. A new object on every render restarts the identity query, which in turn
invalidates the schema cache — the schema key includes the identity, because permissions change
what the schema contains.
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
it as `getSsoLoginMethods` for you. With `@eluvia/auth`'s `useGoogleLogin` (any OAuth hook that
fits the shape works the same way, wrapped to close over its own config):

```tsx
import {LoginSsoMethod, buildServiceAuthProvider, Iconify} from 'habarico';
import {useGoogleLogin} from '@eluvia/auth';

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
