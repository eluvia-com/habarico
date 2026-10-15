import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {BoxSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaBox} from '../SchemaBox';
import {SchemaBoxBody} from '../SchemaBoxBody';

const state = vi.hoisted(() => ({
  showData: {data: {} as Record<string, unknown>, record: {}},
}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: true}),
}));
vi.mock('@schema/components/dynamic/hooks/useDynamicShowData', () => ({
  useDynamicShowData: () => state.showData,
}));
vi.mock('@admin/contexts/ResourceContext', () => ({
  useResourceContext: () => 'orders',
}));
vi.mock('@schema/contexts/ResourceBoxContext/useGetBox', () => ({
  useGetBox:
    () =>
    ({schema}: {schema: BoxSchema}) => <section data-testid={`box-${schema.name}`} />,
}));

const SHIPPING: BoxSchema = {
  name: 'shipping',
  type: 'simple',
  options: {dynamicRender: {showQuery: 'data.needs_shipping == true'}},
} as BoxSchema;

describe('SchemaBox showQuery', () => {
  it('hides itself when rendered on its own', () => {
    state.showData = {data: {needs_shipping: false}, record: {}};

    render(<SchemaBox schema={SHIPPING} />);

    expect(screen.queryByTestId('box-shipping')).toBeNull();
  });

  it('shows itself while the query holds', () => {
    state.showData = {data: {needs_shipping: true}, record: {}};

    render(<SchemaBox schema={SHIPPING} />);

    expect(screen.getByTestId('box-shipping')).toBeInTheDocument();
  });

  it('leaves the check to the owner when rendered as SchemaBoxBody', () => {
    state.showData = {data: {needs_shipping: false}, record: {}};

    render(<SchemaBoxBody schema={SHIPPING} />);

    expect(screen.getByTestId('box-shipping')).toBeInTheDocument();
  });
});
