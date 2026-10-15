import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {FieldDescriptor, FieldSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaPropertyItem} from '../SchemaPropertyItem';

// The real `DynamicRenderWrapper` runs; only the data it evaluates against is stubbed. Form and
// record data differ on purpose, so each test also shows which of the two the view type selects.
const state = vi.hoisted(() => ({
  readOnly: false,
  formData: {data: {} as Record<string, unknown>, record: {}},
  showData: {data: {} as Record<string, unknown>, record: {}},
  fieldSchemaMap: {} as Record<string, unknown>,
}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: state.readOnly}),
}));
vi.mock('@schema/components/dynamic/hooks/useDynamicFormData', () => ({
  useDynamicFormData: () => state.formData,
}));
vi.mock('@schema/components/dynamic/hooks/useDynamicShowData', () => ({
  useDynamicShowData: () => state.showData,
}));
vi.mock('@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext', () => ({
  useFieldSchemaMapContext: () => state.fieldSchemaMap,
}));
vi.mock('@admin/components/common/DynamicText', () => ({
  DynamicText: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));
vi.mock('@schema/components/boxes/SchemaFieldOrInputContent', () => ({
  SchemaFieldOrInputContent: ({schema}: {schema: FieldSchema}) => (
    <span data-testid={`value-${schema.name}`} />
  ),
}));
vi.mock('@schema/components/boxes/SchemaActionField', () => ({
  SchemaActionField: () => <button>Mark as paid</button>,
}));
vi.mock('@schema/components/boxes/SchemaWrappedFields', () => ({
  SchemaWrappedFields: () => <span data-testid="wrapped" />,
}));

const AREA: FieldSchema = {
  name: 'area',
  type: 'number',
  label: 'Area',
  options: {dynamicRender: {showQuery: 'data.show_area == true'}},
};

const renderItem = (field: FieldDescriptor) => render(<SchemaPropertyItem field={field} />);

describe('SchemaPropertyItem showQuery', () => {
  it('drops the whole row, label included, while the query is false in a form', () => {
    state.readOnly = false;
    state.fieldSchemaMap = {area: AREA};
    state.formData = {data: {show_area: false}, record: {}};

    renderItem({type: 'field', name: 'area'});

    expect(screen.queryByText('Area')).toBeNull();
    expect(screen.queryByTestId('value-area')).toBeNull();
  });

  it('renders label and value while the query is true in a form', () => {
    state.readOnly = false;
    state.fieldSchemaMap = {area: AREA};
    state.formData = {data: {show_area: true}, record: {}};

    renderItem({type: 'field', name: 'area'});

    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByTestId('value-area')).toBeInTheDocument();
  });

  it('evaluates against the record in a read-only view', () => {
    state.readOnly = true;
    state.fieldSchemaMap = {area: AREA};
    state.formData = {data: {show_area: true}, record: {}};
    state.showData = {data: {show_area: false}, record: {}};

    renderItem({type: 'field', name: 'area'});

    expect(screen.queryByText('Area')).toBeNull();
  });

  it('reads an action field query off the descriptor and drops its row', () => {
    state.readOnly = true;
    state.fieldSchemaMap = {};
    state.showData = {data: {status: 'Paid'}, record: {}};

    renderItem({
      type: 'field',
      name: 'mark_paid',
      label: 'Payment',
      action: {name: 'mark_paid'},
      options: {dynamicRender: {showQuery: 'data.status != "Paid"'}},
    } as FieldDescriptor);

    expect(screen.queryByText('Payment')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a field without a query as is', () => {
    state.readOnly = false;
    state.fieldSchemaMap = {address: {name: 'address', type: 'string', label: 'Address'}};

    renderItem({type: 'field', name: 'address'});

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByTestId('value-address')).toBeInTheDocument();
  });
});
