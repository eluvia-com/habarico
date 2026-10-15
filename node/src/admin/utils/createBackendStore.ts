import {isEqual} from 'lodash-es';
import {Store} from 'react-admin';
import {matchesAnyGlob} from '@foundation/utils/globMatch';

const MIGRATION_GUARD_KEY = '__backendSync.migrated';
const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_RETRY_BASE_MS = 1000;
const DEFAULT_RETRY_MAX_MS = 30000;

export type BackendApi = {
  list: () => Promise<Record<string, unknown>>;
  put: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  deleteAll: () => Promise<void>;
};

export type BackendStoreConfig = {
  api: BackendApi;
  whitelist: string[];
  debounceMs?: number;
  retryBaseMs?: number;
  retryMaxMs?: number;
  onError?: (error: unknown) => void;
};

// A rejected credential stays rejected until someone signs in again, which creates a new store.
const isAuthError = (error: unknown): boolean => {
  const status = (error as {status?: unknown} | null | undefined)?.status;
  return status === 401 || status === 403;
};

const collectBaseKeys = (base: Store): string[] => {
  if (typeof base.listItems !== 'function') {
    return [];
  }
  const items = base.listItems();
  return Object.keys(items);
};

export const createBackendStore = (base: Store, config: BackendStoreConfig): Store => {
  const {
    api,
    whitelist,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    retryBaseMs = DEFAULT_RETRY_BASE_MS,
    retryMaxMs = DEFAULT_RETRY_MAX_MS,
    onError,
  } = config;

  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let retryAttempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  // Counts `setup()` calls, so a hydration started before a teardown cannot schedule a retry for
  // the setup that follows it (React StrictMode runs setup → teardown → setup on the same store).
  let session = 0;
  let tornDown = false;

  const shouldSync = (key: string): boolean => matchesAnyGlob(key, whitelist);

  const flushKey = (key: string): void => {
    pendingTimers.delete(key);
    const value = base.getItem(key);
    api.put(key, value).catch((err) => onError?.(err));
  };

  const schedulePut = (key: string): void => {
    const existing = pendingTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => flushKey(key), debounceMs);
    pendingTimers.set(key, timer);
  };

  const runOneShotMigration = (remote: Record<string, unknown>): void => {
    if (base.getItem(MIGRATION_GUARD_KEY) === true) {
      return;
    }
    const localKeys = collectBaseKeys(base);
    for (const key of localKeys) {
      if (
        key !== MIGRATION_GUARD_KEY &&
        shouldSync(key) &&
        !Object.prototype.hasOwnProperty.call(remote, key)
      ) {
        const value = base.getItem(key);
        if (value !== undefined) {
          api.put(key, value).catch((err) => onError?.(err));
        }
      }
    }
    base.setItem(MIGRATION_GUARD_KEY, true);
  };

  const hydrate = async (hydrationSession: number): Promise<void> => {
    try {
      const remote = await api.list();
      retryAttempt = 0;
      for (const [key, value] of Object.entries(remote)) {
        base.setItem(key, value);
      }
      runOneShotMigration(remote);
    } catch (err) {
      onError?.(err);
      if (tornDown || hydrationSession !== session || isAuthError(err)) {
        return;
      }
      const delay = Math.min(retryBaseMs * 2 ** retryAttempt, retryMaxMs);
      retryAttempt += 1;
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        hydrate(hydrationSession);
      }, delay);
    }
  };

  return {
    setup: () => {
      session += 1;
      tornDown = false;
      retryAttempt = 0;
      base.setup();
      hydrate(session);
    },
    teardown: () => {
      tornDown = true;
      clearTimeout(retryTimer);
      retryTimer = undefined;
      for (const [key, timer] of pendingTimers.entries()) {
        clearTimeout(timer);
        if (shouldSync(key)) {
          const value = base.getItem(key);
          api.put(key, value).catch((err) => onError?.(err));
        }
      }
      pendingTimers.clear();
      base.teardown();
    },
    getItem: (key, defaultValue) => base.getItem(key, defaultValue),
    setItem: (key, value) => {
      const previous = base.getItem(key);
      base.setItem(key, value);
      if (shouldSync(key) && !isEqual(previous, value)) {
        schedulePut(key);
      }
    },
    removeItem: (key) => {
      const existing = pendingTimers.get(key);
      if (existing) {
        clearTimeout(existing);
        pendingTimers.delete(key);
      }
      base.removeItem(key);
      if (shouldSync(key)) {
        api.delete(key).catch((err) => onError?.(err));
      }
    },
    removeItems: (prefix) => {
      const items = base.listItems ? base.listItems(prefix) : {};
      const keys = Object.keys(items);
      for (const key of keys) {
        const timer = pendingTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          pendingTimers.delete(key);
        }
      }
      base.removeItems(prefix);
      for (const key of keys) {
        if (shouldSync(key)) {
          api.delete(key).catch((err) => onError?.(err));
        }
      }
    },
    reset: () => {
      for (const timer of pendingTimers.values()) {
        clearTimeout(timer);
      }
      pendingTimers.clear();
      base.reset();
    },
    subscribe: (key, callback) => base.subscribe(key, callback),
    listItems: base.listItems ? (keyPrefix) => base.listItems!(keyPrefix) : undefined,
  };
};
