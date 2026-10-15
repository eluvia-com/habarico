import {act} from 'react';
import {AuthProvider, UserIdentity} from 'react-admin';
import {describe, expect, it} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useStoreIdentity} from '../useStoreIdentity';

const authProviderWith = (getIdentity: AuthProvider['getIdentity']) =>
  ({getIdentity}) as AuthProvider;

describe('useStoreIdentity', () => {
  it('bootstraps the identity from the auth provider', async () => {
    const authProvider = authProviderWith(() => Promise.resolve({id: 'user-a'}));

    const {result} = renderHook(() => useStoreIdentity(authProvider));

    await waitFor(() => expect(result.current[0]).toEqual({id: 'user-a'}));
  });

  it('stays undefined while signed out', async () => {
    let settled = false;
    const authProvider = authProviderWith(() =>
      Promise.reject(new Error('signed out')).finally(() => {
        settled = true;
      })
    );

    const {result} = renderHook(() => useStoreIdentity(authProvider));

    await waitFor(() => expect(settled).toBe(true));
    expect(result.current[0]).toBeUndefined();
  });

  it('stays undefined without an auth provider', () => {
    const {result} = renderHook(() => useStoreIdentity(undefined));

    expect(result.current[0]).toBeUndefined();
  });

  it('takes the identity reported later through the setter', async () => {
    const authProvider = authProviderWith(() => Promise.resolve({id: 'user-a'}));
    const {result} = renderHook(() => useStoreIdentity(authProvider));
    await waitFor(() => expect(result.current[0]).toEqual({id: 'user-a'}));

    act(() => result.current[1]({id: 'user-b'}));

    expect(result.current[0]).toEqual({id: 'user-b'});
  });

  it('does not let a late bootstrap overwrite an identity already reported', async () => {
    let resolve: (identity: UserIdentity) => void = () => {};
    const authProvider = authProviderWith(() => new Promise<UserIdentity>((r) => (resolve = r)));
    const {result} = renderHook(() => useStoreIdentity(authProvider));

    act(() => result.current[1]({id: 'user-b'}));
    await act(async () => resolve({id: 'user-a'}));

    expect(result.current[0]).toEqual({id: 'user-b'});
  });
});
