import {UserIdentity} from 'react-admin';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useAdminStore} from '../useAdminStore';

const renderStore = (initialIdentity: UserIdentity | undefined) =>
  renderHook(({identity}: {identity: UserIdentity | undefined}) => useAdminStore(identity), {
    initialProps: {identity: initialIdentity},
  });

describe('useAdminStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('scopes keys to the user once the identity arrives after sign-in', () => {
    const {result, rerender} = renderStore(undefined);

    rerender({identity: {id: 'user-a'}});
    result.current.setItem('product.listParams', {q: 'mug'});

    expect(localStorage.getItem('RaStore.user-a.product.listParams')).toBe('{"q":"mug"}');
    expect(localStorage.getItem('RaStore.product.listParams')).toBeNull();
  });

  it('switches to the next user when another one signs in without a reload', () => {
    const {result, rerender} = renderStore({id: 'user-a'});
    result.current.setItem('product.listParams', {q: 'mug'});

    rerender({identity: {id: 'user-b'}});

    expect(result.current.getItem('product.listParams')).toBeUndefined();
  });

  it('scopes an impersonated session to the user pair', () => {
    const {result} = renderStore({id: 'customer', originalUser: {id: 'admin'}});

    result.current.setItem('product.listParams', {q: 'mug'});

    expect(localStorage.getItem('RaStore.customer__admin.product.listParams')).toBe('{"q":"mug"}');
  });
});
