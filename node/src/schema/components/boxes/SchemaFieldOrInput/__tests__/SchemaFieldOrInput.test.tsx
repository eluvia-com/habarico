import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {FieldDescriptor, FieldSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaFieldOrInput} from '../SchemaFieldOrInput';

const state = vi.hoisted(() => ({
  showData: {data: {} as Record<string, unknown>, record: {}},
  fieldSchemaMap: {} as Record<string, unknown>,
}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: true}),
}));
vi.mock('@schema/components/dynamic/hooks/useDynamicShowData', () => ({
  useDynamicShowData: () => state.showData,
}));
vi.mock('@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext', () => ({
  useFieldSchemaMapContext: () => state.fieldSchemaMap,
}));
vi.mock('@design/contexts/ValueLocationContext', () => ({
  useValueLocationContext: () => ({isInCollection: true}),
}));
vi.mock('../../SchemaFieldOrInputContent', () => ({
  SchemaFieldOrInputContent: ({schema}: {schema: FieldSchema}) => (
    <span data-testid={`value-${schema.name}`} />
  ),
}));
vi.mock('../../SchemaActionField', () => ({
  SchemaActionField: () => <button>Mark as paid</button>,
}));

// A datagrid cell: the cell itself stays (the grid lays it out), only its content goes.
describe('SchemaFieldOrInput showQuery', () => {
  it('hides a field value while its schema query is false', () => {
    state.fieldSchemaMap = {
      discount: {
        name: 'discount',
        type: 'number',
        options: {dynamicRender: {showQuery: 'data.has_discount == true'}},
      },
    };
    state.showData = {data: {has_discount: false}, record: {}};

    render(<SchemaFieldOrInput field={{type: 'field', name: 'discount'}} />);

    expect(screen.queryByTestId('value-discount')).toBeNull();
  });

  it('hides an action while its descriptor query is false', () => {
    state.fieldSchemaMap = {};
    state.showData = {data: {status: 'Paid'}, record: {}};

    render(
      <SchemaFieldOrInput
        field={
          {
            type: 'field',
            name: 'mark_paid',
            action: {name: 'mark_paid'},
            options: {dynamicRender: {showQuery: 'data.status != "Paid"'}},
          } as FieldDescriptor
        }
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders the value while the query is true', () => {
    state.fieldSchemaMap = {
      discount: {
        name: 'discount',
        type: 'number',
        options: {dynamicRender: {showQuery: 'data.has_discount == true'}},
      },
    };
    state.showData = {data: {has_discount: true}, record: {}};

    render(<SchemaFieldOrInput field={{type: 'field', name: 'discount'}} />);

    expect(screen.getByTestId('value-discount')).toBeInTheDocument();
  });
});
