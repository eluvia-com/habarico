import {Store, UserIdentity, localStorageStore} from 'react-admin';
import {BackendApi, createBackendStore} from './createBackendStore';

// Keys that are ALSO written globally (without userId prefix) so the value
// survives logout. These match React Admin's hardcoded store keys.
const GLOBAL_KEYS: ReadonlyArray<string | RegExp> = ['theme', 'locale', /^preferences\.layout\./];

const isGlobal = (key: string): boolean =>
  GLOBAL_KEYS.some((pattern) => (pattern instanceof RegExp ? pattern.test(key) : key === pattern));

const createUserScopedStore = (
  base: Store,
  getUserId: () => string | undefined,
  clearOnReset: boolean
): Store => {
  const userKey = (key: string): string => {
    const userId = getUserId();
    return userId ? `${userId}.${key}` : key;
  };

  return {
    setup: () => base.setup(),
    teardown: () => base.teardown(),
    getItem: (key, defaultValue) => {
      const value = base.getItem(userKey(key));
      if (value !== undefined) return value;
      if (isGlobal(key)) return base.getItem(key, defaultValue);
      return defaultValue;
    },
    setItem: (key, value) => {
      if (isGlobal(key)) {
        base.setItem(key, value);
      }
      return base.setItem(userKey(key), value);
    },
    removeItem: (key) => {
      base.removeItem(userKey(key));
    },
    removeItems: (keyPrefix) => base.removeItems(userKey(keyPrefix)),
    reset: () => {
      if (clearOnReset) {
        const userId = getUserId();
        if (userId) {
          base.removeItems(userId);
        } else {
          base.reset();
        }
      }
    },
    subscribe: (key, callback) => {
      return base.subscribe(userKey(key), callback);
    },
    listItems: (keyPrefix) => {
      if (typeof base.listItems !== 'function') {
        return {};
      }
      const userId = getUserId();
      if (!userId) {
        return base.listItems(keyPrefix);
      }
      const prefix = `${userId}.${keyPrefix ?? ''}`;
      const all = base.listItems(prefix);
      const stripFrom = `${userId}.`;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(all)) {
        if (k.startsWith(stripFrom)) {
          out[k.slice(stripFrom.length)] = v;
        }
      }
      return out;
    },
  };
};

/**
 * The id a per-user store scopes its keys under: the user's id, or `{userId}__{originalUserId}`
 * for an impersonated session, so it never shares keys with either user's own session.
 */
export const toStoreUserId = (identity: UserIdentity | undefined): string | undefined => {
  const userId = identity?.id != null ? String(identity.id) : undefined;
  const originalUserId =
    identity?.originalUser?.id != null ? String(identity.originalUser.id) : undefined;
  return [userId, originalUserId].filter(Boolean).join('__') || undefined;
};

export type PerUserStoreOptions = {
  /**
   * The signed-in user the keys are scoped to (see `toStoreUserId`). The scope is fixed when the
   * store is created: a sign-in, a switch to another user or an impersonation needs a new store —
   * `usePerUserStore` creates it whenever the scope changes. No backend sync while `undefined`.
   */
  identity?: UserIdentity;
  clearOnReset?: boolean;
  backendApi?: BackendApi;
  whitelist?: string[];
};

/**
 * Per-user localStorage store for React Admin.
 *
 * All keys are stored as `RaStore.{userId}.{key}` when authenticated, or
 * `RaStore.{key}` as fallback. React Admin's internal `theme` and `locale`
 * keys are additionally written globally so they survive logout.
 *
 * When `backendApi` and `whitelist` are provided and a user is signed in,
 * whitelisted keys are mirrored to the backend verbatim via `createBackendStore`
 * (local-first sync with hydration, debounced PUT and one-shot migration).
 */
export const createPerUserStore = ({identity, ...options}: PerUserStoreOptions = {}): Store =>
  createScopedStore(toStoreUserId(identity), options);

/**
 * `createPerUserStore` for an already resolved scope id — lets `useScopedStore` memoize on the id
 * alone rather than on the identity object. Not part of the public barrel.
 */
export const createScopedStore = (
  storeUserId: string | undefined,
  options: Omit<PerUserStoreOptions, 'identity'> = {}
): Store => {
  const localBase = localStorageStore();
  const userScoped = createUserScopedStore(
    localBase,
    () => storeUserId,
    options.clearOnReset ?? false
  );

  // Backend sync needs a signed-in user: an unscoped store would hydrate and migrate the keys of
  // whoever is signed out, over requests the backend rejects.
  if (!storeUserId || !options.backendApi || !options.whitelist) {
    return userScoped;
  }

  return createBackendStore(userScoped, {
    api: options.backendApi,
    whitelist: options.whitelist,
  });
};
