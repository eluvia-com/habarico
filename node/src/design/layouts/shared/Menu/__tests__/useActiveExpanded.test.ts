import {describe, expect, it, vi} from 'vitest';
import {LayoutMenuItem} from '@design/layouts/types';
import {renderHook} from '@testing-library/react';
import {useActiveExpanded} from '../useActiveExpanded';

// Holder mutated per test so the mocked hook reports the pathname under test.
const pathnameHolder = vi.hoisted(() => ({current: '/'}));

vi.mock('@foundation/hooks/usePathname', () => ({usePathname: () => pathnameHolder.current}));

const renderAt = (pathname: string) => {
  pathnameHolder.current = pathname;
  return renderHook(() => useActiveExpanded()).result.current;
};

const item = (partial: Partial<LayoutMenuItem> & {href: string}): LayoutMenuItem => ({
  title: 'item',
  icon: null,
  ...partial,
});

describe('useActiveExpanded', () => {
  describe('matching against href (no activePath)', () => {
    it('marks an item active on its own path', () => {
      const {isActive} = renderAt('/svc/orders');
      expect(isActive(item({href: '/svc/orders'}))).toBe(true);
    });

    it('marks an item active on a sub path', () => {
      const {isActive} = renderAt('/svc/orders/5');
      expect(isActive(item({href: '/svc/orders'}))).toBe(true);
    });

    it('leaves an unrelated item inactive', () => {
      const {isActive} = renderAt('/svc/invoices');
      expect(isActive(item({href: '/svc/orders'}))).toBe(false);
    });
  });

  describe('matching against activePath', () => {
    it('keeps a record-scoped item active on a sibling view of the same record', () => {
      // Menu links to the show view, but react-admin puts edit one level up at the
      // record base path — the item must stay highlighted there.
      const {isActive} = renderAt('/svc/orders/5');
      expect(isActive(item({href: '/svc/orders/5/show', activePath: '/svc/orders/5'}))).toBe(true);
    });

    it('keeps a record-scoped item active on its own link target', () => {
      const {isActive} = renderAt('/svc/orders/5/show');
      expect(isActive(item({href: '/svc/orders/5/show', activePath: '/svc/orders/5'}))).toBe(true);
    });

    it('keeps a record-scoped item active on a record action of the same record', () => {
      const {isActive} = renderAt('/svc/orders/5/a/approve');
      expect(isActive(item({href: '/svc/orders/5/show', activePath: '/svc/orders/5'}))).toBe(true);
    });

    it('does not leak onto a different record sharing the id prefix', () => {
      const {isActive} = renderAt('/svc/orders/50');
      expect(isActive(item({href: '/svc/orders/5/show', activePath: '/svc/orders/5'}))).toBe(false);
    });
  });

  describe('groups', () => {
    it('expands a group when a child matches through its activePath', () => {
      const child = item({href: '/svc/orders/5/show', activePath: '/svc/orders/5'});
      const group = item({href: '/svc/orders/5/show', items: [child]});

      const {isExpanded, isActive} = renderAt('/svc/orders/5');

      expect(isExpanded(group)).toBe(true);
      expect(isActive(child)).toBe(true);
    });

    it('keeps the group itself inactive while one of its children is active', () => {
      const child = item({href: '/svc/orders/5/show', activePath: '/svc/orders/5'});
      const group = item({href: '/svc/orders/5/show', items: [child]});

      const {isActive} = renderAt('/svc/orders/5');

      expect(isActive(group)).toBe(false);
    });
  });

  describe('per-item overrides', () => {
    it('prefers an explicit isActive over path matching', () => {
      const {isActive} = renderAt('/svc/invoices');
      expect(isActive(item({href: '/svc/orders', isActive: () => true}))).toBe(true);
    });

    it('prefers an explicit isExpanded over path matching', () => {
      const {isExpanded} = renderAt('/svc/invoices');
      expect(isExpanded(item({href: '/svc/orders', isExpanded: () => true}))).toBe(true);
    });
  });
});
