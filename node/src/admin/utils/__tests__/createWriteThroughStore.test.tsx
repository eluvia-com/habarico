import React from 'react';
import {StoreContextProvider, localStorageStore, useStore} from 'react-admin';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createWriteThroughStore} from '@admin/utils/createWriteThroughStore';
import {act, renderHook} from '@testing-library/react';

// Answers `getItem` with the value a key had before its last write, the way Firefox can.
const staleReads = () => {
  const previous = new Map<string, string | null>();
  const realSetItem = Storage.prototype.setItem;
  const realGetItem = Storage.prototype.getItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    previous.set(key, realGetItem.call(this, key));
    realSetItem.call(this, key, value);
  });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
    return previous.has(key) ? previous.get(key)! : realGetItem.call(this, key);
  });
};

const writeFromAnotherTab = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(value),
      storageArea: localStorage,
    })
  );
};

describe('createWriteThroughStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('reads back the value it wrote when localStorage answers with the previous one', () => {
    const store = createWriteThroughStore(localStorageStore());
    store.setItem('dashboard', {widgets: ['a']});
    staleReads();

    store.setItem('dashboard', {widgets: ['a', 'b']});

    expect(localStorage.getItem('RaStore.dashboard')).toBe('{"widgets":["a"]}');
    expect(store.getItem('dashboard')).toEqual({widgets: ['a', 'b']});
  });

  it('keeps useStore on the value just set when localStorage answers with the previous one', () => {
    const store = createWriteThroughStore(localStorageStore());
    store.setItem('dashboard', ['a']);
    staleReads();
    const {result} = renderHook(() => useStore<string[]>('dashboard', []), {
      wrapper: ({children}) => (
        <StoreContextProvider value={store}>{children}</StoreContextProvider>
      ),
    });

    act(() => result.current[1](['a', 'b']));

    expect(result.current[0]).toEqual(['a', 'b']);
  });

  it('reads a key it never wrote from localStorage', () => {
    localStorage.setItem('RaStore.locale', '"cs"');
    const store = createWriteThroughStore(localStorageStore());

    expect(store.getItem('locale')).toBe('cs');
    expect(store.getItem('theme', 'light')).toBe('light');
  });

  it('takes the value another tab wrote', () => {
    const store = createWriteThroughStore(localStorageStore());
    store.setup();
    store.setItem('dashboard', {widgets: ['a']});

    staleReads();
    writeFromAnotherTab('RaStore.dashboard', {widgets: ['b']});

    expect(store.getItem('dashboard')).toEqual({widgets: ['b']});
    store.teardown();
  });

  it('hands out a copy that does not change what it remembers', () => {
    const store = createWriteThroughStore(localStorageStore());
    store.setItem('orders.listParams', {page: 2});

    store.getItem<{page: number}>('orders.listParams')!.page = 5;

    expect(store.getItem('orders.listParams')).toEqual({page: 2});
  });

  it('keeps a removed key removed', () => {
    const store = createWriteThroughStore(localStorageStore());
    store.setItem('dashboard', {widgets: ['a']});
    store.setItem('orders.listParams', {page: 2});
    store.setItem('orders.columns', ['id']);
    staleReads();

    store.removeItem('dashboard');
    store.removeItems('orders.');

    expect(store.getItem('dashboard')).toBeUndefined();
    expect(store.getItem('orders.listParams')).toBeUndefined();
    expect(store.getItem('orders.columns', [])).toEqual([]);
  });

  it('keeps every key removed after a reset', () => {
    localStorage.setItem('RaStore.locale', '"cs"');
    const store = createWriteThroughStore(localStorageStore());
    store.setItem('dashboard', {widgets: ['a']});
    staleReads();

    store.reset();

    expect(store.getItem('dashboard')).toBeUndefined();
    expect(store.getItem('locale')).toBeUndefined();
  });

  it('lists the values it wrote over what localStorage answers', () => {
    localStorage.setItem('RaStore.orders.columns', '["id"]');
    const store = createWriteThroughStore(localStorageStore());
    store.setItem('orders.listParams', {page: 1});
    staleReads();

    store.setItem('orders.listParams', {page: 2});
    store.removeItem('orders.columns');

    expect(store.listItems!('orders.')).toEqual({'orders.listParams': {page: 2}});
  });
});
