import React from 'react';
import {ResourceContextProvider} from 'react-admin';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  ActionDescriptor,
  AnyActionDescriptor,
  LocalResourceSchema,
  ResourceActionSchema,
} from '@schema/types';
import {ReferencedSchema} from '@schema/utils/actionDescriptor';
import {render, screen} from '@testing-library/react';
import {SchemaButtons} from '../SchemaButtons';

const h = vi.hoisted(() => ({
  referenced: {isLoading: true} as ReferencedSchema,
  localActions: [] as ResourceActionSchema[],
}));

vi.mock('@schema/hooks/useGetLocalResourceSchemas', () => ({
  useGetLocalResourceSchemas: () => () => h.referenced,
}));

vi.mock('@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext', () => ({
  useLocalResourceSchemaContext: () => ({schema: {actions: h.localActions}}),
}));

vi.mock('@schema/hooks/useHabRecordContext', () => ({useHabRecordContext: () => undefined}));

// Stands in for the real button: shows what it was asked to run and against what.
vi.mock('../../SchemaButton', () => ({
  SchemaButton: ({schema, actionContext}: {schema: {label?: string}; actionContext?: object}) => (
    <span data-testid="button" data-action-context={JSON.stringify(actionContext ?? null)}>
      {schema.label}
    </span>
  ),
}));

const action = (name: string, label: string): ResourceActionSchema => ({
  name,
  label,
  type: 'resource',
  isDetail: false,
  showInList: true,
  showInDetail: true,
});

const schemaWith = (actions: ResourceActionSchema[]) => ({actions}) as LocalResourceSchema;

const descriptors: ActionDescriptor[] = [
  {name: 'export'},
  {name: 'approve', reference: {service: 'billing', resource: 'invoice', recordPk: 3}},
];

const renderButtons = () =>
  render(
    <ResourceContextProvider value="shop/order">
      <SchemaButtons descriptors={descriptors} />
    </ResourceContextProvider>
  );

describe('SchemaButtons with a linked descriptor', () => {
  beforeEach(() => {
    h.localActions = [action('export', 'Export'), action('approve', 'Approve order')];
  });

  it('leaves the linked button out while its schema loads', () => {
    h.referenced = {isLoading: true};
    renderButtons();
    expect(screen.getAllByTestId('button').map((el) => el.textContent)).toEqual(['Export']);
  });

  it('renders it from the linked schema, bound to the link, once loaded', () => {
    h.referenced = {isLoading: false, schema: schemaWith([action('approve', 'Approve invoice')])};
    renderButtons();
    const [, linked] = screen.getAllByTestId('button');
    expect(linked.textContent).toBe('Approve invoice');
    expect(JSON.parse(linked.dataset.actionContext!)).toEqual({
      resource: 'billing/invoice',
      recordPk: 3,
    });
  });

  it('leaves it out when the linked schema has no such action', () => {
    h.referenced = {isLoading: false, schema: schemaWith([action('other', 'Other')])};
    renderButtons();
    expect(screen.getAllByTestId('button').map((el) => el.textContent)).toEqual(['Export']);
  });
});

describe('SchemaButtons slot', () => {
  beforeEach(() => {
    // `export` acts on the collection, `approve` on one record
    h.localActions = [
      action('export', 'Export'),
      {...action('approve', 'Approve order'), isDetail: true},
    ];
    h.referenced = {isLoading: false};
  });

  const renderSlot = (slot?: AnyActionDescriptor[]) =>
    render(
      <ResourceContextProvider value="shop/order">
        <SchemaButtons descriptors={slot} isList />
      </ResourceContextProvider>
    );

  it('renders nothing for an absent slot — the resource actions are never inferred', () => {
    renderSlot(undefined);
    expect(screen.queryAllByTestId('button')).toEqual([]);
  });

  it('renders nothing for an empty slot', () => {
    renderSlot([]);
    expect(screen.queryAllByTestId('button')).toEqual([]);
  });

  it('expands a DefaultActions entry into the actions it stands for, in slot order', () => {
    renderSlot([{name: 'approve'}, {type: 'default_actions', scope: 'list'}]);
    expect(screen.getAllByTestId('button').map((el) => el.textContent)).toEqual([
      'Approve order',
      'Export',
    ]);
  });
});
