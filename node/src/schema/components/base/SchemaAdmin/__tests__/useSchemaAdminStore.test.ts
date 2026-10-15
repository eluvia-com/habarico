import {UserIdentity} from 'react-admin';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {SchemaProvider} from '@schema/providers/types';
import {renderHook} from '@testing-library/react';
import {useSchemaAdminStore} from '../useSchemaAdminStore';

// No service flags `syncPreferences`, so the store stays local-only and the schema provider is
// never called.
const schemaProvider = {} as SchemaProvider;
const serviceConfigMap = {};

const renderStore = (initialIdentity: UserIdentity | undefined) =>
  renderHook(
    ({identity}: {identity: UserIdentity | undefined}) =>
      useSchemaAdminStore({identity, schemaProvider, serviceConfigMap}),
    {initialProps: {identity: initialIdentity}}
  );

describe('useSchemaAdminStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('writes unscoped keys while nobody is signed in', () => {
    const {result} = renderStore(undefined);

    result.current.setItem('product.listParams', {q: 'mug'});

    expect(localStorage.getItem('RaStore.product.listParams')).toBe('{"q":"mug"}');
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

    rerender({identity: undefined});
    rerender({identity: {id: 'user-b'}});

    expect(result.current.getItem('product.listParams')).toBeUndefined();
    result.current.setItem('product.listParams', {q: 'plate'});
    expect(localStorage.getItem('RaStore.user-a.product.listParams')).toBe('{"q":"mug"}');
    expect(localStorage.getItem('RaStore.user-b.product.listParams')).toBe('{"q":"plate"}');
  });

  it('scopes an impersonated session to the user pair', () => {
    const {result, rerender} = renderStore({id: 'admin'});

    rerender({identity: {id: 'customer', originalUser: {id: 'admin'}}});
    result.current.setItem('product.listParams', {q: 'mug'});

    expect(localStorage.getItem('RaStore.customer__admin.product.listParams')).toBe('{"q":"mug"}');
  });

  it('keeps the same store when the identity is refetched for the same user', () => {
    const {result, rerender} = renderStore({id: 'user-a', fullName: 'Jane Doe'});
    const first = result.current;

    rerender({identity: {id: 'user-a', fullName: 'Jane Smith'}});

    expect(result.current).toBe(first);
  });
});
