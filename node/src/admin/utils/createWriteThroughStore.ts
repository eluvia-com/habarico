import {Store} from 'react-admin';

// React Admin's `localStorageStore` key prefix (`RaStore` + an empty app key).
const STORE_PREFIX = 'RaStore.';

// Parsed the way `localStorageStore` parses what it reads: a value that is not JSON stays a string.
const parse = (serialized: string) => {
  try {
    return JSON.parse(serialized);
  } catch {
    return serialized;
  }
};

/**
 * Wraps a `localStorageStore` so every value this page wrote is read back from memory.
 *
 * Firefox can answer `localStorage.getItem` with the previous value of a key written moments before
 * in the same page, and `useStore` re-reads the store after each write, so the stale value would
 * replace the one just set. Keys this page never wrote are still read from `localStorage`, and a
 * write from another tab (a `storage` event) replaces the remembered value.
 */
export const createWriteThroughStore = (base: Store): Store => {
  // Kept serialized like in `localStorage`, so every read hands out a fresh copy; `null` is removed.
  const written = new Map<string, string | null>();

  const remember = (key: string, value: unknown) =>
    written.set(key, value === undefined ? null : JSON.stringify(value));

  // A removed key is remembered as removed: reading it from `localStorage` could bring it back.
  const markRemoved = (keyPrefix?: string) => {
    const keys = new Set([...Object.keys(base.listItems?.(keyPrefix) ?? {}), ...written.keys()]);
    for (const key of keys) {
      if (!keyPrefix || key.startsWith(keyPrefix)) written.set(key, null);
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage) return;
    if (event.key === null) {
      written.clear();
    } else if (event.key.startsWith(STORE_PREFIX)) {
      written.set(event.key.slice(STORE_PREFIX.length), event.newValue);
    }
  };

  return {
    setup: () => {
      window.addEventListener('storage', onStorage);
      base.setup();
    },
    teardown: () => {
      window.removeEventListener('storage', onStorage);
      base.teardown();
    },
    getItem: (key, defaultValue) => {
      if (!written.has(key)) return base.getItem(key, defaultValue);
      const serialized = written.get(key);
      return serialized == null ? defaultValue : parse(serialized);
    },
    setItem: (key, value) => {
      remember(key, value);
      base.setItem(key, value);
    },
    removeItem: (key) => {
      written.set(key, null);
      base.removeItem(key);
    },
    removeItems: (keyPrefix) => {
      markRemoved(keyPrefix);
      base.removeItems(keyPrefix);
    },
    reset: () => {
      markRemoved();
      base.reset();
    },
    subscribe: (key, callback) => base.subscribe(key, callback),
    listItems: base.listItems
      ? (keyPrefix) => {
          const items = {...base.listItems!(keyPrefix)};
          for (const [key, serialized] of written) {
            if (keyPrefix && !key.startsWith(keyPrefix)) continue;
            if (serialized == null) delete items[key];
            else items[key] = parse(serialized);
          }
          return items;
        }
      : undefined,
  };
};
