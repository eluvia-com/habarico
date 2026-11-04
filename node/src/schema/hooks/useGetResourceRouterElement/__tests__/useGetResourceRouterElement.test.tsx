import React, {ReactElement} from 'react';
import {ResourceProps} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {ResourceButtonProvider} from '@schema/contexts/ResourceButtonContext';
import {GlobalResourceSchema, GlobalViewSchema, ViewModeType} from '@schema/types';
import {renderHook} from '@testing-library/react';
import {useGetResourceRouterElement} from '../useGetResourceRouterElement';

// Holder mutated per test so the mocked schema hook returns the right resource schema.
const schemaHolder = vi.hoisted(() => ({current: undefined as GlobalResourceSchema | undefined}));
// Holder mutated per test so a `<SchemaResource>`-like element (with its own provider props)
// can be injected without a real `<Resource>` (which would short-circuit the hook).
const resourcesHolder = vi.hoisted(() => ({current: {} as Record<string, ReactElement>}));

vi.mock('@schema/contexts/SchemaRootContext/useSchemaRootContext', () => ({
  useSchemaRootContext: () => ({
    resources: resourcesHolder.current,
    // Return a marker element for every requested view so gating (not element resolution)
    // is the only thing under test.
    defaultViewProvider: (args: Record<string, unknown>) =>
      React.createElement('mock-view', {...args, key: JSON.stringify(args)}),
  }),
}));

vi.mock('../../useGetGlobalResourceSchema', () => ({
  useGetGlobalResourceSchema: () => () => schemaHolder.current,
}));

// Collect every Route `path` from the <Resource> children tree.
const collectRoutePaths = (node: unknown, out: string[] = []): string[] => {
  if (Array.isArray(node)) {
    node.forEach((child) => collectRoutePaths(child, out));
    return out;
  }
  if (!React.isValidElement(node)) return out;
  const props = node.props as {path?: unknown; children?: unknown};
  if (typeof props.path === 'string') out.push(props.path);
  if (props.children) collectRoutePaths(props.children, out);
  return out;
};

const view = (
  name: GlobalViewSchema['name'],
  type: GlobalViewSchema['type'],
  isDetail: boolean,
  mode?: ViewModeType
): GlobalViewSchema => ({
  name,
  type,
  isDetail,
  mode,
  endpoint: {method: 'get', reference: {service: 'svc', resource: 'res', actionName: name}},
});

const buildSchema = (views: GlobalViewSchema[]): GlobalResourceSchema => ({
  name: 'res',
  pkFieldName: 'id',
  label: 'Res',
  views,
  actions: [],
  url: '/svc/res',
});

const renderResource = (views: GlobalViewSchema[]): ReactElement<ResourceProps> => {
  schemaHolder.current = buildSchema(views);
  const {result} = renderHook(() => useGetResourceRouterElement());
  return result.current('svc/res') as ReactElement<ResourceProps>;
};

// Walks a (not-yet-mounted) element tree looking for a `ResourceButtonProvider` wrapping `node`.
const findButtonProviderValue = (node: unknown): unknown => {
  if (!React.isValidElement(node)) return undefined;
  if (node.type === ResourceButtonProvider) {
    return (node.props as {provider?: unknown}).provider;
  }
  const children = (node.props as {children?: unknown}).children;
  return Array.isArray(children)
    ? children.map(findButtonProviderValue).find((found) => found !== undefined)
    : findButtonProviderValue(children);
};

describe('useGetResourceRouterElement - mode gating', () => {
  describe('reserved views are wired into <Resource> only when routed', () => {
    it('wires reserved views with no mode / redirect', () => {
      const el = renderResource([
        view('list', 'list', false),
        view('create', 'create', false, 'redirect'),
      ]);
      expect(el.props.list).toBeTruthy();
      expect(el.props.create).toBeTruthy();
    });

    it('drops dialog/sidepanel reserved views (no route, opened from a trigger)', () => {
      const el = renderResource([
        view('list', 'list', false),
        view('create', 'create', false, 'dialog'),
        view('edit', 'edit', true, 'redirect'),
        view('show', 'show', true, 'sidepanel'),
      ]);
      expect(el.props.list).toBeTruthy();
      expect(el.props.edit).toBeTruthy();
      // dialog / sidepanel views must not become react-admin routes
      expect(el.props.create).toBeUndefined();
      expect(el.props.show).toBeUndefined();
    });
  });

  describe('action views register a route only when routed', () => {
    it('registers /a/{name} routes for inline action views', () => {
      const el = renderResource([
        view('export', 'action', false),
        view('approve', 'action', true, 'redirect'),
      ]);
      const paths = collectRoutePaths(el.props.children);
      expect(paths).toContain('a/export/*');
      expect(paths).toContain(':id/a/approve/*');
    });

    it('omits routes for dialog/sidepanel action views', () => {
      const el = renderResource([
        view('export', 'action', false),
        view('bulk', 'action', false, 'dialog'),
        view('approve', 'action', true, 'redirect'),
        view('preview', 'action', true, 'sidepanel'),
      ]);
      const paths = collectRoutePaths(el.props.children);
      expect(paths).toContain('a/export/*');
      expect(paths).toContain(':id/a/approve/*');
      expect(paths).not.toContain('a/bulk/*');
      expect(paths).not.toContain(':id/a/preview/*');
    });
  });
});

describe('useGetResourceRouterElement - providers (HAB-974)', () => {
  it('forwards buttonProvider into list/create/edit/show, like boxProvider', () => {
    const buttonProvider = vi.fn();
    resourcesHolder.current = {
      'svc/res': React.createElement('mock-resource-config', {buttonProvider}),
    };

    const el = renderResource([
      view('list', 'list', false),
      view('create', 'create', false, 'redirect'),
      view('edit', 'edit', true, 'redirect'),
      view('show', 'show', true, 'redirect'),
    ]);

    resourcesHolder.current = {};

    expect(findButtonProviderValue(el.props.list)).toBe(buttonProvider);
    expect(findButtonProviderValue(el.props.create)).toBe(buttonProvider);
    expect(findButtonProviderValue(el.props.edit)).toBe(buttonProvider);
    expect(findButtonProviderValue(el.props.show)).toBe(buttonProvider);
  });
});
