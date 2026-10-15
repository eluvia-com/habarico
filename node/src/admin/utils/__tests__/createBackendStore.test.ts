import {Store, localStorageStore} from 'react-admin';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BackendApi, createBackendStore} from '@admin/utils/createBackendStore';

const makeBase = (): Store => {
  const s = localStorageStore('1', 'RaStore.backend-test');
  s.reset();
  return s;
};

const makeApi = (
  overrides: Partial<BackendApi> = {}
): BackendApi & {
  listMock: ReturnType<typeof vi.fn>;
  putMock: ReturnType<typeof vi.fn>;
  deleteMock: ReturnType<typeof vi.fn>;
  deleteAllMock: ReturnType<typeof vi.fn>;
} => {
  const listMock = vi.fn<BackendApi['list']>().mockResolvedValue({});
  const putMock = vi.fn<BackendApi['put']>().mockResolvedValue();
  const deleteMock = vi.fn<BackendApi['delete']>().mockResolvedValue();
  const deleteAllMock = vi.fn<BackendApi['deleteAll']>().mockResolvedValue();
  return {
    list: overrides.list ?? listMock,
    put: overrides.put ?? putMock,
    delete: overrides.delete ?? deleteMock,
    deleteAll: overrides.deleteAll ?? deleteAllMock,
    listMock,
    putMock,
    deleteMock,
    deleteAllMock,
  };
};

const flush = async () => {
  await vi.runAllTimersAsync();
};

describe('createBackendStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('local-first reads', () => {
    it('getItem delegates to base before hydration', () => {
      const base = makeBase();
      base.setItem('theme', 'dark');
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});
      store.setup();
      expect(store.getItem('theme')).toBe('dark');
    });

    it('subscribe delegates to base, notifies on setItem', () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: []});
      const callback = vi.fn();
      store.subscribe('theme', callback);
      store.setItem('theme', 'dark');
      expect(callback).toHaveBeenCalledWith('dark');
    });
  });

  describe('writes', () => {
    it('non-whitelisted setItem updates base but does not PUT', async () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], debounceMs: 500});
      store.setup();
      await flush();
      api.putMock.mockClear();

      store.setItem('theme', 'dark');

      expect(base.getItem('theme')).toBe('dark');
      await vi.advanceTimersByTimeAsync(1000);
      expect(api.putMock).not.toHaveBeenCalled();
    });

    it('whitelisted setItem updates base optimistically and PUTs after debounce', async () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], debounceMs: 500});
      store.setup();
      await flush();
      api.putMock.mockClear();

      store.setItem('dashboard', {widgets: [{id: 'a'}]});

      expect(base.getItem('dashboard')).toEqual({widgets: [{id: 'a'}]});
      expect(api.putMock).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(500);
      expect(api.putMock).toHaveBeenCalledTimes(1);
      expect(api.putMock).toHaveBeenCalledWith('dashboard', {widgets: [{id: 'a'}]});
    });

    it('coalesces rapid writes into one PUT with the latest value', async () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], debounceMs: 500});
      store.setup();
      await flush();
      api.putMock.mockClear();

      store.setItem('dashboard', {v: 1});
      await vi.advanceTimersByTimeAsync(100);
      store.setItem('dashboard', {v: 2});
      await vi.advanceTimersByTimeAsync(100);
      store.setItem('dashboard', {v: 3});

      await vi.advanceTimersByTimeAsync(500);
      expect(api.putMock).toHaveBeenCalledTimes(1);
      expect(api.putMock).toHaveBeenCalledWith('dashboard', {v: 3});
    });

    it('matches a wildcard whitelist pattern', async () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['*.columns'], debounceMs: 500});
      store.setup();
      await flush();
      api.putMock.mockClear();

      store.setItem('shop_orders.columns', ['a', 'b']);
      await vi.advanceTimersByTimeAsync(500);
      expect(api.putMock).toHaveBeenCalledWith('shop_orders.columns', ['a', 'b']);
    });
  });

  describe('reset', () => {
    it('resets the base store but leaves the backend preferences alone', async () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});
      store.setup();
      await flush();
      store.setItem('dashboard', {v: 1});

      store.reset();

      expect(base.getItem('dashboard')).toBeUndefined();
      expect(api.deleteAllMock).not.toHaveBeenCalled();
    });

    it('cancels a pending PUT', async () => {
      const base = makeBase();
      const api = makeApi();
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], debounceMs: 500});
      store.setup();
      await flush();
      api.putMock.mockClear();
      store.setItem('dashboard', {v: 1});

      store.reset();
      await vi.advanceTimersByTimeAsync(1000);

      expect(api.putMock).not.toHaveBeenCalled();
    });
  });

  describe('hydration', () => {
    it('calls api.list() during setup and merges values into base', async () => {
      const base = makeBase();
      const api = makeApi();
      api.listMock.mockResolvedValue({theme: 'dark', dashboard: {widgets: [{id: 'remote'}]}});
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});

      store.setup();
      await flush();

      expect(api.listMock).toHaveBeenCalledTimes(1);
      expect(base.getItem('dashboard')).toEqual({widgets: [{id: 'remote'}]});
      expect(base.getItem('theme')).toBe('dark');
    });

    it('notifies subscribers of hydrated values', async () => {
      const base = makeBase();
      const api = makeApi();
      api.listMock.mockResolvedValue({dashboard: {widgets: [{id: 'remote'}]}});
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});
      const callback = vi.fn();
      store.subscribe('dashboard', callback);

      store.setup();
      await flush();

      expect(callback).toHaveBeenCalledWith({widgets: [{id: 'remote'}]});
    });

    it('falls back to local cache and retries on hydration failure', async () => {
      const base = makeBase();
      base.setItem('dashboard', {widgets: [{id: 'local'}]});
      const api = makeApi();
      api.listMock
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce({dashboard: {widgets: [{id: 'remote'}]}});
      const onError = vi.fn();
      const store = createBackendStore(base, {
        api,
        whitelist: ['dashboard'],
        retryBaseMs: 1000,
        onError,
      });

      store.setup();
      // Flush microtasks so the rejected list() reaches its catch handler.
      await vi.advanceTimersByTimeAsync(0);
      expect(api.listMock).toHaveBeenCalledTimes(1);
      expect(base.getItem('dashboard')).toEqual({widgets: [{id: 'local'}]});
      expect(onError).toHaveBeenCalledTimes(1);

      // Now trigger the retry timer.
      await vi.advanceTimersByTimeAsync(1000);
      expect(api.listMock).toHaveBeenCalledTimes(2);
      expect(base.getItem('dashboard')).toEqual({widgets: [{id: 'remote'}]});
    });

    // React StrictMode runs the store's effect as setup → teardown → setup on the same store.
    it('retries once after a setup that follows a teardown', async () => {
      const base = makeBase();
      const api = makeApi();
      api.listMock
        .mockRejectedValueOnce(new Error('network'))
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce({dashboard: {widgets: [{id: 'remote'}]}});
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], retryBaseMs: 1000});

      store.setup();
      store.teardown();
      store.setup();
      await vi.advanceTimersByTimeAsync(0);
      expect(api.listMock).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1000);
      expect(api.listMock).toHaveBeenCalledTimes(3);
      expect(base.getItem('dashboard')).toEqual({widgets: [{id: 'remote'}]});

      await vi.advanceTimersByTimeAsync(60000);
      expect(api.listMock).toHaveBeenCalledTimes(3);
    });

    it.each([401, 403])('does not retry a hydration rejected with status %i', async (status) => {
      const base = makeBase();
      const api = makeApi();
      api.listMock.mockRejectedValue(Object.assign(new Error('Forbidden'), {status}));
      const onError = vi.fn();
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], onError});

      store.setup();
      await vi.advanceTimersByTimeAsync(60000);

      expect(api.listMock).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({status}));
    });

    it('retries a hydration rejected with a server error status', async () => {
      const base = makeBase();
      const api = makeApi();
      api.listMock
        .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), {status: 503}))
        .mockResolvedValueOnce({});
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], retryBaseMs: 1000});

      store.setup();
      await vi.advanceTimersByTimeAsync(1000);

      expect(api.listMock).toHaveBeenCalledTimes(2);
    });

    it('cancels a scheduled retry on teardown', async () => {
      const base = makeBase();
      const api = makeApi();
      api.listMock.mockRejectedValue(new Error('network'));
      const store = createBackendStore(base, {api, whitelist: ['dashboard'], retryBaseMs: 1000});

      store.setup();
      await vi.advanceTimersByTimeAsync(0);
      store.teardown();
      await vi.advanceTimersByTimeAsync(60000);

      expect(api.listMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('one-shot migration', () => {
    it('PUTs local whitelisted values not present on backend', async () => {
      const base = makeBase();
      base.setItem('dashboard', {widgets: [{id: 'local'}]});
      const api = makeApi();
      api.listMock.mockResolvedValue({});
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});

      store.setup();
      await flush();

      expect(api.putMock).toHaveBeenCalledWith('dashboard', {widgets: [{id: 'local'}]});
    });

    it('does not PUT keys that already exist on backend', async () => {
      const base = makeBase();
      base.setItem('dashboard', {widgets: [{id: 'local'}]});
      const api = makeApi();
      api.listMock.mockResolvedValue({dashboard: {widgets: [{id: 'remote'}]}});
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});

      store.setup();
      await flush();

      expect(api.putMock).not.toHaveBeenCalled();
    });

    it('does not PUT non-whitelisted keys', async () => {
      const base = makeBase();
      base.setItem('theme', 'dark');
      const api = makeApi();
      api.listMock.mockResolvedValue({});
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});

      store.setup();
      await flush();

      expect(api.putMock).not.toHaveBeenCalled();
    });

    it('is idempotent: second setup() skips migration', async () => {
      const base = makeBase();
      base.setItem('dashboard', {widgets: [{id: 'local'}]});
      const api = makeApi();
      api.listMock.mockResolvedValue({});
      const store = createBackendStore(base, {api, whitelist: ['dashboard']});

      store.setup();
      await flush();
      expect(api.putMock).toHaveBeenCalledTimes(1);

      api.putMock.mockClear();
      // Simulate restart: keep base storage, recreate store
      const store2 = createBackendStore(base, {api, whitelist: ['dashboard']});
      store2.setup();
      await flush();
      expect(api.putMock).not.toHaveBeenCalled();
    });
  });
});
