import {ReactNode} from 'react';
import {AuthProvider, UserIdentity} from 'react-admin';
import {Location} from 'react-router-dom';

// The context `LoginForm` feeds into every SSO method's hook — the routing state an OAuth redirect
// flow needs to detect its own callback and to return to the right page after success.
export type LoginSsoMethodContext = {
  location: Location;
  redirectPath: string;
  onSuccess?: () => void;
};

export type LoginSsoMethodState = {
  /** True while the current page load is processing the provider's redirect back (e.g. `?code=…`). */
  isCallback: boolean;
  loading: boolean;
  error?: unknown;
  login: () => void;
};

// The built-in `LoginForm` bundles no Google (or any other) OAuth implementation. Instead, return
// one or more `LoginSsoMethod` entries from `ServiceAuthProvider.getSsoLoginMethods` (see
// `buildServiceAuthProvider`'s `ssoLoginMethods` param); habarico renders the button/spinner and
// calls `useLogin` with the routing context, so only the OAuth *hook* (not the surrounding UI)
// needs to be provided. Any library whose login hook fits this shape works, wrapped to close over
// its own client id.
export type LoginSsoMethod = {
  /** Unique key — used as the React list key and to detect this method's own callback. */
  id: string;
  /** Button label — a translation key (looked up via `ra.auth.*`) or literal text. */
  label: string;
  icon?: ReactNode;
  useLogin: (context: LoginSsoMethodContext) => LoginSsoMethodState;
};

// Generic shape of the authenticated user. `buildServiceAuthProvider` imports no auth package, so
// any backend whose user object carries these fields can be plugged in.
export type ServiceAuthUser = {
  id: string | number;
  email?: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: {url?: string; filename?: string; content?: string};
};

// Generic shape of the locally-held auth state, as `getAuthData()` returns it. `jwt` is optional:
// a session-cookie backend keeps only the user here.
export type ServiceAuthData = {
  user?: ServiceAuthUser;
  jwt?: {access: string; refresh: string};
};

// React Admin's `AuthProvider` extended with the auth service operations the admin auth
// surfaces call (reset / set / change password, update identity, MFA challenge & verify …).
export type ServiceAuthProvider = AuthProvider & {
  resetPassword: (payload: {username: string}) => Promise<void>;
  setPassword: (payload: {token: string; password: string}) => Promise<Response>;
  isAuthenticated: () => boolean;
  updateIdentity: (identity: Partial<UserIdentity>) => Promise<Response>;
  changePassword: (payload: {oldPassword: string; newPassword: string}) => Promise<void>;
  getIdentity: () => Promise<UserIdentity> | undefined;
  verifyMfa: (payload: {method: string; code: string; trust_device: boolean}) => Promise<Response>;
  requestMfaChallenge: (payload: {method: string}) => Promise<unknown>;
  /** Extra sign-in methods (Google, Apple, an internal SSO, …) `LoginForm` renders as buttons below
   *  the credentials form. Optional — omit for a plain username/password login. */
  getSsoLoginMethods?: () => LoginSsoMethod[];
  /** Headers (e.g. `Authorization`) attached to authenticated requests — the same function passed
   *  to `getDataProviderFactory`/`getSchemaProvider`. Uploads (`useUploadQueue`/`UploadInput`) read
   *  it from here. */
  getAuthHeaders: () => Record<string, string>;
};
