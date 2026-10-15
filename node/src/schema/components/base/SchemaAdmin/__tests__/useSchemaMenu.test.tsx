import {ResourceDefinition} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {LayoutMenuItem} from '@design/layouts/types';
import {GlobalResourceSchema, MenuSchema} from '@schema/types';
import {renderHook} from '@testing-library/react';
import {ExtraMenuItem} from '../types';
import {useSchemaMenu} from '../useSchemaMenu';

// Holders mutated per test so the mocked schema root context serves the fixture under test.
const contextHolder = vi.hoisted(() => ({
  serviceConfigMap: {} as Record<string, {url: string; label?: string}>,
  servicesSchema: {} as Record<string, GlobalResourceSchema[]>,
}));
const resourcesHolder = vi.hoisted(() => ({current: {} as Record<string, ResourceDefinition>}));

vi.mock('@schema/contexts/SchemaRootContext/useSchemaRootContext', () => ({
  useSchemaRootContext: () => contextHolder,
}));

vi.mock('react-admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-admin')>()),
  useResourceDefinitions: () => resourcesHolder.current,
}));

const showView = {
  name: 'detail',
  type: 'show' as const,
  isDetail: true,
  endpoint: {method: 'get' as const, actionName: 'detail'},
};

const listView = {
  name: 'list',
  type: 'list' as const,
  isDetail: false,
  endpoint: {method: 'get' as const, actionName: 'list'},
};

const buildSchema = (
  menu: MenuSchema,
  views: GlobalResourceSchema['views']
): GlobalResourceSchema => ({
  name: 'orders',
  pkFieldName: 'id',
  label: 'Orders',
  url: '/svc/orders',
  views,
  actions: [],
  menu,
});

const viewMenu = (viewName: string, recordPk?: number): MenuSchema => ({
  name: 'orders-menu',
  label: 'Orders',
  priority: 1,
  type: 'view',
  view: {
    name: viewName,
    choices: [],
    mode: 'redirect',
    parameters: {},
    ...(recordPk === undefined ? {} : {endpoint: {recordPk}}),
  },
});

const renderMenu = (
  menu: MenuSchema,
  views: GlobalResourceSchema['views'],
  extraMenuItems?: ExtraMenuItem[]
): LayoutMenuItem[] => {
  contextHolder.serviceConfigMap = {svc: {url: 'https://api.test/svc'}};
  contextHolder.servicesSchema = {svc: [buildSchema(menu, views)]};
  resourcesHolder.current = {'svc/orders': {name: 'svc/orders'} as ResourceDefinition};
  return renderHook(() => useSchemaMenu(extraMenuItems)).result.current;
};

describe('useSchemaMenu - activePath', () => {
  it('links a record-scoped show menu to the show view', () => {
    const [item] = renderMenu(viewMenu('detail', 5), [showView]);
    expect(item.href).toBe('/svc/orders/5/show');
  });

  it('matches a record-scoped show menu against the record base path', () => {
    // The record's edit view lives at the base path, one level above the show view,
    // so matching on `href` alone would drop the highlight on the edit page.
    const [item] = renderMenu(viewMenu('detail', 5), [showView]);
    expect(item.activePath).toBe('/svc/orders/5');
  });

  it('leaves a collection-scoped menu matching on its own href', () => {
    const [item] = renderMenu(viewMenu('list'), [listView]);
    expect(item.href).toBe('/svc/orders');
    expect(item.activePath).toBeUndefined();
  });

  it('keeps activePath when an extra menu item only re-labels the schema item', () => {
    const [item] = renderMenu(
      viewMenu('detail', 5),
      [showView],
      [{key: 'orders-menu', title: 'Renamed'}]
    );
    expect(item.title).toBe('Renamed');
    expect(item.activePath).toBe('/svc/orders/5');
  });

  it('drops activePath when an extra menu item overrides the link target', () => {
    const [item] = renderMenu(
      viewMenu('detail', 5),
      [showView],
      [{key: 'orders-menu', href: '/custom'}]
    );
    expect(item.href).toBe('/custom');
    expect(item.activePath).toBeUndefined();
  });
});
