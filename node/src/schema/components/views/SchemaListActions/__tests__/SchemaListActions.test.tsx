import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {ActionDescriptor, ViewSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaListActions} from '../SchemaListActions';

const h = vi.hoisted(() => ({
  viewSchema: {} as unknown,
}));

vi.mock('@admin/contexts/AdminConfigContext', () => ({
  useAdminConfig: () => ({columnSelector: false}),
}));

vi.mock('@admin/contexts/ListConfigContext', () => ({
  useListConfigContext: () => ({
    preferenceKey: 'articles.list.datagrid',
    sort: {field: 'id', order: 'ASC'},
    filterDefaultValues: {},
    filters: [],
  }),
}));

vi.mock('@admin/contexts/ViewPresentationContext', () => ({
  useViewPresentation: () => ({presentation: 'page'}),
}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({viewSchema: h.viewSchema}),
}));

// The surrounding utility buttons need react-admin store/list contexts and are not under test.
vi.mock('@admin/components/buttons/ResetColumnsWidthDatagridButton', () => ({
  ResetColumnsWidthDatagridButton: () => null,
}));
vi.mock('@admin/components/buttons/ResetFiltersDatagridButton', () => ({
  ResetFiltersDatagridButton: () => null,
}));
vi.mock('@admin/components/buttons/ResetSortDatagridButton', () => ({
  ResetSortDatagridButton: () => null,
}));
vi.mock('@admin/components/buttons/ResetConfigurableDatagridButton', () => ({
  ResetConfigurableDatagridButton: () => null,
}));

vi.mock('@schema/components/buttons/SchemaButtons', () => ({
  SchemaButtons: ({descriptors}: {descriptors?: ActionDescriptor[]}) => (
    <div data-testid="schema-buttons">{descriptors?.map((d) => d.name).join(',')}</div>
  ),
}));

const buildViewSchema = (listActions?: ActionDescriptor[]): ViewSchema => ({
  name: 'list',
  type: 'list',
  isDetail: false,
  endpoint: {path: '/articles/', method: 'get'},
  list: {listActions},
});

describe('SchemaListActions', () => {
  it('renders list actions descriptors from the list view schema', () => {
    h.viewSchema = buildViewSchema([
      {name: 'export', action: {type: 'export', isDetail: false, export: {format: 'csv'}}},
    ]);

    render(<SchemaListActions />);

    expect(screen.getByTestId('schema-buttons')).toHaveTextContent('export');
  });

  it('renders no schema buttons when the view schema has no list actions', () => {
    h.viewSchema = buildViewSchema(undefined);

    render(<SchemaListActions />);

    expect(screen.queryByTestId('schema-buttons')).not.toBeInTheDocument();
  });

  it('renders no schema buttons when list actions are empty', () => {
    h.viewSchema = buildViewSchema([]);

    render(<SchemaListActions />);

    expect(screen.queryByTestId('schema-buttons')).not.toBeInTheDocument();
  });
});
