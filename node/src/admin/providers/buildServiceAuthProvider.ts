import {jwtDecode} from 'jwt-decode';
import {UserIdentity} from 'react-admin';
import {handleErrorResponse} from '@admin/utils/api';
import {DataType} from '@typing';
import {LoginSsoMethod, ServiceAuthData, ServiceAuthProvider, ServiceAuthUser} from './types';

const MAP_API_USER_FIELDS = {
  first_name: 'firstName',
  last_name: 'lastName',
};

/* eslint-disable sonarjs/no-hardcoded-passwords -- field name mapping, not a credential */
const MAP_API_CHANGE_PASSWORD_FIELDS = {
  old_password: 'oldPassword',
  new_password: 'newPassword',
};
/* eslint-enable sonarjs/no-hardcoded-passwords */

function mapUserToIdentity(user: ServiceAuthUser, original_user?: ServiceAuthUser): UserIdentity {
  return {
    id: user.id,
    fullName:
      [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || user.username,
    avatar: user.avatar?.url,
    // email: user.email,
    email: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    originalUser: original_user && mapUserToIdentity(original_user),
  };
}

function mapIdentityToUser(identity: Partial<UserIdentity>): Partial<ServiceAuthUser> {
  const user = {
    // email: identity.email,
    username: identity.email,
    first_name: identity.firstName,
    last_name: identity.lastName,
  } as Partial<ServiceAuthUser>;
  if (identity.avatarFilename && identity.avatarContent) {
    user.avatar = {
      filename: identity.avatarFilename,
      content: identity.avatarContent,
    };
  }
  return user;
}

type BuildServiceAuthProviderParams = {
  login: (payload: {
    username?: string;
    password?: string;
    token?: string;
  }) => Promise<{data: unknown; isMfaRequired: boolean}>;
  logout: () => Promise<void>;
  getMfaMethods: () => Promise<{available_methods: string[]}>;
  requestMfaChallenge: (method: MfaMethod) => Promise<unknown>;
  verifyMfaCode: (method: MfaMethod, code: string, trustDevice: boolean) => Promise<Response>;
  forgottenPassword: (payload: {email?: string}) => Promise<Response>;
  resetPassword: (token: string, payload: {password: string}) => Promise<Response>;
  changePassword: (payload: {old_password: string; new_password: string}) => Promise<Response>;
  updateUser: (user: Partial<ServiceAuthUser>) => Promise<Response>;
  /** Reads the locally-held auth state (current user + tokens). */
  getAuthData: () => ServiceAuthData;
  /** Clears the locally-held auth state (called on a 401 from `checkError`). */
  clearAuthData: () => void;
  /** Extra sign-in methods (Google, Apple, an internal SSO, …) `LoginForm` renders as buttons below
   *  the credentials form. Omit for a plain username/password login. */
  ssoLoginMethods?: LoginSsoMethod[];
  /** Headers (e.g. `Authorization`) attached to authenticated requests — pass the same function
   *  you give `getDataProviderFactory`/`getSchemaProvider`. */
  getAuthHeaders: () => Record<string, string>;
};

export type MfaMethod = 'email' | 'sms';

export class MfaRequiredError extends Error {
  code = 'MFA_REQUIRED' as const;
  methods: MfaMethod[];

  constructor(params: {methods: MfaMethod[]; message?: string}) {
    super(params.message ?? 'MFA required');

    this.name = 'MfaRequiredError';
    this.methods = params.methods;
  }
}

/**
 * Builds a `ServiceAuthProvider` from the individual auth operations, decoupled from any specific
 * auth library. To wire it up to `@eluvia/auth`, call its hooks in your app and pass the resulting
 * functions in — see the README's "Service Auth Provider" section for a full example.
 */
export function buildServiceAuthProvider({
  login,
  logout,
  getMfaMethods,
  requestMfaChallenge,
  verifyMfaCode,
  forgottenPassword,
  resetPassword,
  changePassword,
  updateUser,
  getAuthData,
  clearAuthData,
  ssoLoginMethods,
  getAuthHeaders,
}: BuildServiceAuthProviderParams): ServiceAuthProvider {
  return {
    getSsoLoginMethods: () => ssoLoginMethods ?? [],
    getAuthHeaders,
    login: async ({username, password, token}) => {
      try {
        const {data, isMfaRequired} = await login({username, password, token});
        if (isMfaRequired) {
          const {available_methods} = await getMfaMethods();
          throw new MfaRequiredError({methods: available_methods as MfaMethod[]});
        }
        return data;
      } catch (error) {
        if (error instanceof Response) handleErrorResponse(await error.json(), error.status);
        throw error;
      }
    },
    requestMfaChallenge: async ({method}) => {
      try {
        return await requestMfaChallenge(method as MfaMethod);
      } catch (error) {
        if (error instanceof Response) handleErrorResponse(await error.json(), error.status);
        throw error;
      }
    },
    verifyMfa: async ({method, code, trust_device}) => {
      try {
        return await verifyMfaCode(method as MfaMethod, code, trust_device);
      } catch (error) {
        if (error instanceof Response) handleErrorResponse(await error.json(), error.status);
        throw error;
      }
    },
    logout: async () => {
      const user = getAuthData().user;
      if (user) {
        try {
          await logout();
        } catch {
          // server logout failed; local auth already cleared
        }
      }
    },
    resetPassword: async ({username}) => {
      try {
        await forgottenPassword({email: username});
      } catch (error) {
        if (error instanceof Response) handleErrorResponse(await error.json(), error.status);
        throw error;
      }
    },
    setPassword: async ({token, password}) => {
      try {
        return await resetPassword(token, {password});
      } catch (error) {
        if (error instanceof Response) handleErrorResponse(await error.json(), error.status);
        throw error;
      }
    },
    changePassword: async ({oldPassword, newPassword}) => {
      try {
        await changePassword({old_password: oldPassword, new_password: newPassword});
      } catch (error) {
        if (error instanceof Response)
          handleErrorResponse(
            await error.json(),
            error.status,
            'ra.auth.change_password_error',
            MAP_API_CHANGE_PASSWORD_FIELDS
          );
        throw error;
      }
    },
    checkError: (error) => {
      const status = error.status;
      if (status === 401) {
        clearAuthData();
        return Promise.reject();
      }
      return Promise.resolve();
    },
    checkAuth: () => {
      if (window.location.pathname.match('^/reset-password/.+')) {
        return Promise.resolve();
      }
      const user = getAuthData().user;
      return user ? Promise.resolve() : Promise.reject();
    },
    getPermissions: () => {
      const user = getAuthData().user;
      return user ? Promise.resolve('logged-user') : Promise.resolve('guest');
    },
    getIdentity: () => {
      const {user, jwt} = getAuthData();
      if (!user) return Promise.reject();
      const jwtPayload: DataType | undefined = jwt ? jwtDecode(jwt.access) : undefined;
      const original_user = jwtPayload?.original_user as ServiceAuthUser | undefined;
      return Promise.resolve(mapUserToIdentity(user, original_user));
    },
    updateIdentity: async (identity: Partial<UserIdentity>) => {
      try {
        return await updateUser(mapIdentityToUser(identity));
      } catch (error) {
        if (error instanceof Response) {
          handleErrorResponse(
            await error.json(),
            error.status,
            'ra.auth.update_identity_error',
            MAP_API_USER_FIELDS
          );
        }
        throw error;
      }
    },
    isAuthenticated: () => {
      const user = getAuthData().user;
      return !!user;
    },
  };
}
