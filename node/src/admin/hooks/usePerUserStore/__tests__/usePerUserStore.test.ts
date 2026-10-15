import {act} from 'react';
import {AuthProvider, UserIdentity} from 'react-admin';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BackendApi} from '@admin/utils/createBackendStore';
import {renderHook, waitFor} from '@testing-library/react';
import {usePerUserStore, useScopedStore} from '../usePerUserStore';

const authProviderWith = (identity?: UserIdentity) =>
  ({
    getIdentity: () =>
      identity ? Promise.resolve(identity) : Promise.reject(new Error('signed out')),
  }) as AuthProvider;

const buildApi = (): BackendApi => ({
  list: vi.fn().mockResolvedValue({}),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  deleteAll: vi.fn().mockResolvedValue(undefined),
});

describe('usePerUserStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('scopes the store to the user resolved on page load', async () => {
    const {result} = renderHook(() =>
      usePerUserStore({authProvider: authProviderWith({id: 'user-a'})})
    );
    await waitFor(() => expect(result.current.userIdentity).toEqual({id: 'user-a'}));

    result.current.store.setItem('product.listParams', {q: 'mug'});

    expect(localStorage.getItem('RaStore.user-a.product.listParams')).toBe('{"q":"mug"}');
  });

  it('scopes keys to the user reported through the setter after sign-in', () => {
    const {result} = renderHook(() => usePerUserStore({authProvider: authProviderWith()}));

    act(() => result.current.setUserIdentity({id: 'user-a'}));
    result.current.store.setItem('product.listParams', {q: 'mug'});

    expect(localStorage.getItem('RaStore.user-a.product.listParams')).toBe('{"q":"mug"}');
    expect(localStorage.getItem('RaStore.product.listParams')).toBeNull();
  });

  it('creates a new store for another user', () => {
    const {result} = renderHook(() => usePerUserStore({authProvider: authProviderWith()}));
    act(() => result.current.setUserIdentity({id: 'user-a'}));
    const first = result.current.store;

    act(() => result.current.setUserIdentity({id: 'user-b'}));

    expect(result.current.store).not.toBe(first);
  });
});

describe('useScopedStore', () => {
  it('keeps the store when the same user is refetched under a new name', () => {
    const {result, rerender} = renderHook(
      ({identity}: {identity: UserIdentity}) => useScopedStore(identity),
      {initialProps: {identity: {id: 'user-a', fullName: 'Jane Doe'}}}
    );
    const first = result.current;

    rerender({identity: {id: 'user-a', fullName: 'Jane Smith'}});

    expect(result.current).toBe(first);
  });

  it('keeps the store across renders with an inline whitelist', () => {
    const backendApi = buildApi();
    const {result, rerender} = renderHook(() =>
      useScopedStore({id: 'user-a'}, {backendApi, whitelist: ['preferences.*']})
    );
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('creates a new store when the whitelist contents change', () => {
    const backendApi = buildApi();
    const {result, rerender} = renderHook(
      ({whitelist}: {whitelist: string[]}) =>
        useScopedStore({id: 'user-a'}, {backendApi, whitelist}),
      {initialProps: {whitelist: ['preferences.*']}}
    );
    const first = result.current;

    rerender({whitelist: ['preferences.*', 'theme']});

    expect(result.current).not.toBe(first);
  });
});
