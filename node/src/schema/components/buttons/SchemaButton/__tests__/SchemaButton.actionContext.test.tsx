import React from 'react';
import {RecordContextProvider, ResourceContextProvider} from 'react-admin';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {ResourceActionSchema} from '@schema/types';
import {render} from '@testing-library/react';
import {SchemaButton} from '../SchemaButton';

const h = vi.hoisted(() => ({
  getButton: vi.fn((_props: unknown): React.ReactElement | null => null),
}));

vi.mock('@schema/contexts/ResourceButtonContext/useGetButton', () => ({
  useGetButton: () => h.getButton,
}));

vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({getGlobalViewSchema: () => undefined}),
}));

const approve: ResourceActionSchema = {
  name: 'approve',
  type: 'resource',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  resource: {endpoint: {method: 'post', path: 'approve/'}, data: {}},
};

// The surrounding page: an order with id 7.
const renderInOrder = (element: React.ReactElement) =>
  render(
    <ResourceContextProvider value="shop/order">
      <RecordContextProvider value={{id: 7}}>{element}</RecordContextProvider>
    </ResourceContextProvider>
  );

const lastCall = () => h.getButton.mock.lastCall?.[0] as {resource: string; recordPk?: unknown};

describe('SchemaButton actionContext', () => {
  beforeEach(() => {
    h.getButton.mockClear();
    h.getButton.mockImplementation(() => null);
  });

  it('runs an unlinked detail action against the surrounding resource and record', () => {
    renderInOrder(<SchemaButton schema={approve} />);
    expect(lastCall()).toMatchObject({resource: 'shop/order', recordPk: 7});
  });

  it('runs a linked action against the resource and record of the link', () => {
    renderInOrder(
      <SchemaButton schema={approve} actionContext={{resource: 'billing/invoice', recordPk: 3}} />
    );
    expect(lastCall()).toMatchObject({resource: 'billing/invoice', recordPk: 3});
  });

  it('never hands a linked action the surrounding record when the link names none', () => {
    renderInOrder(<SchemaButton schema={approve} actionContext={{resource: 'billing/invoice'}} />);
    expect(lastCall()).toMatchObject({resource: 'billing/invoice', recordPk: undefined});
  });
});

describe('SchemaButton parent link', () => {
  // Reads the parent stack and the target the button was rendered with.
  const h2 = {seen: [] as unknown[]};
  const StackProbe = () => {
    h2.seen.push(useParentResourceDescriptorsContext());
    return null;
  };

  beforeEach(() => {
    h.getButton.mockClear();
    h.getButton.mockImplementation(() => <StackProbe />);
    h2.seen = [];
  });

  it('puts the linked record on the parent stack and makes its column the target', () => {
    const parent = {resource: 'shop/order', recordId: 7, target: 'order_id'};
    renderInOrder(
      <SchemaButton schema={approve} actionContext={{resource: 'shop/item', parent}} />
    );
    expect(h2.seen.at(-1)).toEqual([parent]);
    expect(lastCall()).toMatchObject({target: 'order_id'});
  });

  it('leaves the stack alone for a actionContext without a parent', () => {
    renderInOrder(<SchemaButton schema={approve} actionContext={{resource: 'shop/item'}} />);
    expect(h2.seen.at(-1)).toEqual([]);
  });
});
