import React, {PropsWithChildren} from 'react';
import {BasenameContextProvider} from 'react-admin';
import {describe, expect, it} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useCreateHabPath} from '../useCreateHabPath';

const noBasenameWrapper = ({children}: PropsWithChildren) => <>{children}</>;

const basenameWrapper = ({children}: PropsWithChildren) => (
  <BasenameContextProvider basename="/admin">{children}</BasenameContextProvider>
);

describe('useCreateHabPath', () => {
  describe('reserved view types route via react-admin (branch on type, not action_name)', () => {
    it('builds the list route for type "list"', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(result.current({resource: 'shop/orders', type: 'list'})).toBe('/shop/orders');
    });

    it('builds the create route for type "create"', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(result.current({resource: 'shop/orders', type: 'create'})).toBe('/shop/orders/create');
    });

    it('builds the show route for type "show"', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(result.current({resource: 'shop/orders', id: '5', type: 'show'})).toBe(
        '/shop/orders/5/show'
      );
    });

    it('builds the edit route for type "edit"', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(result.current({resource: 'shop/orders', id: '5', type: 'edit'})).toBe(
        '/shop/orders/5'
      );
    });

    it('ignores a stray action_name on a reserved type and still routes via react-admin', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      // Backend may fill action_name even for a reserved view; routing must not depend on it.
      expect(
        result.current({resource: 'shop/orders', id: '5', type: 'show', actionName: 'preview'})
      ).toBe('/shop/orders/5/show');
    });
  });

  describe('non-reserved (action) view types use the /a/{action_name} route', () => {
    it('builds a collection-level action route (no id)', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(result.current({resource: 'shop/orders', type: 'action', actionName: 'export'})).toBe(
        '/shop/orders/a/export'
      );
    });

    it('builds a record-level action route (with id)', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(
        result.current({resource: 'shop/orders', id: '5', type: 'action', actionName: 'approve'})
      ).toBe('/shop/orders/5/a/approve');
    });

    it('encodes the id in the action route', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: noBasenameWrapper});
      expect(
        result.current({resource: 'shop/orders', id: 'a b', type: 'action', actionName: 'approve'})
      ).toBe('/shop/orders/a%20b/a/approve');
    });
  });

  describe('basename handling', () => {
    it('prefixes the basename on reserved routes', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: basenameWrapper});
      expect(result.current({resource: 'shop/orders', id: '5', type: 'show'})).toBe(
        '/admin/shop/orders/5/show'
      );
    });

    it('prefixes the basename on action routes', () => {
      const {result} = renderHook(() => useCreateHabPath(), {wrapper: basenameWrapper});
      expect(
        result.current({resource: 'shop/orders', id: '5', type: 'action', actionName: 'approve'})
      ).toBe('/admin/shop/orders/5/a/approve');
    });
  });
});
