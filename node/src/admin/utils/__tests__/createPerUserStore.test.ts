import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BackendApi} from '@admin/utils/createBackendStore';
import {createPerUserStore, toStoreUserId} from '@admin/utils/createPerUserStore';

describe('createPerUserStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  describe('per-user prefixing (no backend sync)', () => {
    it('isolates keys by user id', () => {
      const a = createPerUserStore({identity: {id: 'user-a'}});
      const b = createPerUserStore({identity: {id: 'user-b'}});

      a.setItem('dashboard', {widgets: ['a']});
      expect(b.getItem('dashboard')).toBeUndefined();
      expect(a.getItem('dashboard')).toEqual({widgets: ['a']});
    });

    it("listItems returns only the current user's keys with un-prefixed names", () => {
      const a = createPerUserStore({identity: {id: 'user-a'}});
      const b = createPerUserStore({identity: {id: 'user-b'}});

      a.setItem('dashboard', {v: 1});
      b.setItem('dashboard', {v: 2});

      expect(a.listItems!()).toEqual({dashboard: {v: 1}});
      expect(b.listItems!()).toEqual({dashboard: {v: 2}});
    });

    it('stores aliased keys (theme, locale) globally as fallback for logged-out state', () => {
      const store = createPerUserStore({identity: {id: 'user-a'}});

      store.setItem('locale', 'cs');

      // user-scoped read
      expect(store.getItem('locale')).toBe('cs');

      // anonymous store reads the global fallback
      const anon = createPerUserStore();
      expect(anon.getItem('locale')).toBe('cs');
    });
  });

  describe('scoped by identity', () => {
    it("writes under the user's id", () => {
      const store = createPerUserStore({identity: {id: 42}});

      store.setItem('products.listParams', {page: 2});

      expect(localStorage.getItem('RaStore.42.products.listParams')).toBe('{"page":2}');
      expect(localStorage.getItem('RaStore.products.listParams')).toBeNull();
    });

    it('keeps an impersonated session apart from both users', () => {
      const impersonated = createPerUserStore({
        identity: {id: 'customer', originalUser: {id: 'admin'}},
      });
      const customer = createPerUserStore({identity: {id: 'customer'}});

      impersonated.setItem('dashboard', {v: 1});

      expect(localStorage.getItem('RaStore.customer__admin.dashboard')).toBe('{"v":1}');
      expect(customer.getItem('dashboard')).toBeUndefined();
    });

    it('falls back to unscoped keys while nobody is signed in', () => {
      const store = createPerUserStore({identity: undefined});

      store.setItem('dashboard', {v: 1});

      expect(localStorage.getItem('RaStore.dashboard')).toBe('{"v":1}');
    });
  });

  describe('backend sync integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const buildApi = (): BackendApi & {
      list: ReturnType<typeof vi.fn>;
      put: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      deleteAll: ReturnType<typeof vi.fn>;
    } => ({
      list: vi.fn().mockResolvedValue({}),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteAll: vi.fn().mockResolvedValue(undefined),
    });

    it('syncs whitelisted keys to backend verbatim', async () => {
      const api = buildApi();

      const store = createPerUserStore({
        identity: {id: 'user-a'},
        backendApi: api,
        whitelist: ['preferences.dashboard'],
      });
      store.setup();
      await vi.advanceTimersByTimeAsync(0);

      store.setItem('preferences.dashboard', {widgets: [{id: 'x'}]});
      await vi.advanceTimersByTimeAsync(500);

      expect(api.put).toHaveBeenCalledTimes(1);
      const [key, value] = api.put.mock.calls[0];
      expect(key).toBe('preferences.dashboard');
      expect(value).toEqual({widgets: [{id: 'x'}]});
    });

    it('does not sync keys outside the whitelist to backend', async () => {
      const api = buildApi();

      const store = createPerUserStore({
        identity: {id: 'user-a'},
        backendApi: api,
        whitelist: ['preferences.dashboard'],
      });
      store.setup();
      await vi.advanceTimersByTimeAsync(0);

      store.setItem('other.setting', 'value');
      await vi.advanceTimersByTimeAsync(1000);

      expect(api.put).not.toHaveBeenCalled();
    });

    it('skips backend wiring when whitelist is omitted', async () => {
      const api = buildApi();

      const store = createPerUserStore({
        identity: {id: 'user-a'},
        backendApi: api,
      });
      store.setup();
      await vi.advanceTimersByTimeAsync(0);

      store.setItem('preferences.dashboard', {x: 1});
      await vi.advanceTimersByTimeAsync(1000);

      expect(api.list).not.toHaveBeenCalled();
      expect(api.put).not.toHaveBeenCalled();
    });

    it('skips backend wiring when backendApi is omitted', async () => {
      const store = createPerUserStore({
        identity: {id: 'user-a'},
        whitelist: ['preferences.dashboard'],
      });
      store.setup();
      await vi.advanceTimersByTimeAsync(0);

      store.setItem('preferences.dashboard', {x: 1});
      expect(store.getItem('preferences.dashboard')).toEqual({x: 1});
    });

    it('skips backend wiring while nobody is signed in', async () => {
      const api = buildApi();

      const store = createPerUserStore({
        backendApi: api,
        whitelist: ['preferences.dashboard'],
      });
      store.setup();
      await vi.advanceTimersByTimeAsync(0);

      store.setItem('preferences.dashboard', {x: 1});
      await vi.advanceTimersByTimeAsync(500);

      expect(api.list).not.toHaveBeenCalled();
      expect(api.put).not.toHaveBeenCalled();
    });

    it('hydrates local store with keys from backend verbatim', async () => {
      const api = buildApi();
      api.list.mockResolvedValue({'preferences.dashboard': {widgets: []}, theme: 'dark'});

      const store = createPerUserStore({
        identity: {id: 'user-a'},
        backendApi: api,
        whitelist: ['preferences.dashboard', 'theme'],
      });
      store.setup();
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getItem('preferences.dashboard')).toEqual({widgets: []});
      expect(store.getItem('theme')).toBe('dark');
    });
  });

  describe('toStoreUserId', () => {
    it('is undefined while nobody is signed in', () => {
      expect(toStoreUserId(undefined)).toBeUndefined();
    });

    it("is the user's id, stringified", () => {
      expect(toStoreUserId({id: 42})).toBe('42');
    });

    it('pairs an impersonated user with the original one', () => {
      expect(toStoreUserId({id: 'customer', originalUser: {id: 'admin'}})).toBe('customer__admin');
    });
  });
});
