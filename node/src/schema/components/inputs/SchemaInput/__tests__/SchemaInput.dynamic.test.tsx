import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {FieldSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaInput} from '../SchemaInput';
import {SchemaInputBody} from '../SchemaInputBody';

const state = vi.hoisted(() => ({
  readOnly: false,
  formData: {data: {} as Record<string, unknown>, record: {}},
}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: state.readOnly}),
}));
vi.mock('@schema/components/dynamic/hooks/useDynamicFormData', () => ({
  useDynamicFormData: () => state.formData,
}));
vi.mock('@schema/components/dynamic/hooks/useDynamicShowData', () => ({
  useDynamicShowData: () => ({data: {}, record: {}}),
}));
vi.mock('../SchemaWriteonlyInputContent', () => ({
  SchemaWriteonlyInputContent: ({isRequired}: {isRequired?: boolean}) => (
    <input data-testid="input" data-required={String(Boolean(isRequired))} />
  ),
}));

const VAT_ID: FieldSchema = {
  name: 'vat_id',
  type: 'string',
  label: 'VAT ID',
  options: {
    dynamicRender: {showQuery: 'data.is_company == true', requiredQuery: 'data.country == "DE"'},
  },
};

// `SchemaInput` rendered on its own owns its slot, so it hides itself.
describe('SchemaInput dynamicRender', () => {
  it('renders hiddenEl in place of the input while showQuery is false', () => {
    state.formData = {data: {is_company: false}, record: {}};

    render(<SchemaInput schema={VAT_ID} source="vat_id" hiddenEl={<div data-testid="gap" />} />);

    expect(screen.queryByTestId('input')).toBeNull();
    expect(screen.getByTestId('gap')).toBeInTheDocument();
  });

  it('marks the input required while requiredQuery holds', () => {
    state.formData = {data: {is_company: true, country: 'DE'}, record: {}};

    render(<SchemaInput schema={VAT_ID} source="vat_id" />);

    expect(screen.getByTestId('input')).toHaveAttribute('data-required', 'true');
  });

  it('leaves the input optional while requiredQuery is false', () => {
    state.formData = {data: {is_company: true, country: 'US'}, record: {}};

    render(<SchemaInput schema={VAT_ID} source="vat_id" />);

    expect(screen.getByTestId('input')).toHaveAttribute('data-required', 'false');
  });
});

// `SchemaInputBody` is what a slot owner renders once it has evaluated showQuery itself.
describe('SchemaInputBody dynamicRender', () => {
  it('ignores showQuery', () => {
    state.formData = {data: {is_company: false}, record: {}};

    render(<SchemaInputBody schema={VAT_ID} source="vat_id" />);

    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('still applies requiredQuery', () => {
    state.formData = {data: {is_company: false, country: 'DE'}, record: {}};

    render(<SchemaInputBody schema={VAT_ID} source="vat_id" />);

    expect(screen.getByTestId('input')).toHaveAttribute('data-required', 'true');
  });
});
