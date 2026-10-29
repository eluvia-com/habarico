import React, {ReactElement} from 'react';
import {RecordContextProvider} from 'react-admin';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SchemaRecordRepresentation} from '@schema/components/fields/SchemaRecordRepresentation';
import {FieldDefaultsProvider} from '@schema/contexts/FieldDefaultsContext';
import {FieldDefaults, ItemFieldSchema} from '@schema/types';
import {render} from '@testing-library/react';
import {SchemaReferenceArrayField} from '../SchemaReferenceArrayField';

// Same approach as `SchemaReferenceField`'s test: the field is read through the props it hands the
// admin `ReferenceArrayField`. The real `FunctionField` is kept, so the record below actually
// drives the render callback the component wraps its output in.
const received: Record<string, unknown>[] = [];
vi.mock('@admin/components/fields/ReferenceArrayField', () => ({
  ReferenceArrayField: (props: Record<string, unknown>) => {
    received.push(props);
    return null;
  },
}));

const state = vi.hoisted(() => ({isInCollection: false}));
vi.mock('@design/contexts/ValueLocationContext', () => ({
  useValueLocationContext: () => state,
}));

vi.mock('@admin/contexts/ResourceContext', () => ({
  useResourceContext: (reference?: string) => reference ?? 'eshop/product',
}));

vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({schema: {name: 'tag'}}),
}));

const items = {reference: 'eshop/tag'} as ItemFieldSchema;

const renderField = (
  props: Partial<React.ComponentProps<typeof SchemaReferenceArrayField>> = {},
  fieldDefaults: FieldDefaults = {}
) => {
  render(
    <FieldDefaultsProvider {...fieldDefaults}>
      <RecordContextProvider value={{id: 1, tag_ids: [1, 2]}}>
        <SchemaReferenceArrayField source={'tag_ids'} items={items} {...props} />
      </RecordContextProvider>
    </FieldDefaultsProvider>
  );
  return received[received.length - 1];
};

// What this field is responsible for handing the representation — `variant` included, now that it
// is the prop choosing the chip or the text link rather than a choice between two components.
type RepresentationProps = {variant?: 'chip' | 'link'; maxWidth?: string};
type ListProps = {
  direction?: 'row' | 'column';
  sx?: {alignItems?: string};
  children: ReactElement<RepresentationProps>;
};

const listOf = (props: Record<string, unknown>) => props.children as ReactElement<ListProps>;
const representationOf = (props: Record<string, unknown>) => listOf(props).props.children;

beforeEach(() => {
  received.length = 0;
  state.isInCollection = false;
});

describe('SchemaReferenceArrayField - variant', () => {
  // Regression guard: every project that does not ask for the link form must keep its chips.
  it('renders chips by default', () => {
    const representation = representationOf(renderField());

    expect(representation.type).toBe(SchemaRecordRepresentation);
    expect(representation.props.variant).toBe('chip');
  });

  it('renders text links when asked for them', () => {
    expect(representationOf(renderField({variant: 'link'})).props.variant).toBe('link');
  });

  it('renders nothing but the empty text when the record holds no references', () => {
    render(
      <RecordContextProvider value={{id: 1, tag_ids: []}}>
        <SchemaReferenceArrayField source={'tag_ids'} items={items} variant={'link'} />
      </RecordContextProvider>
    );

    expect(received).toHaveLength(0);
  });
});

describe('SchemaReferenceArrayField - layout', () => {
  // Chips carry a shape that keeps neighbours apart; a row of bare text links would read as one
  // run-on sentence, so the link form stacks them instead.
  it('stacks text links one per line', () => {
    expect(listOf(renderField({variant: 'link'})).props).toMatchObject({
      direction: 'column',
      sx: {alignItems: 'flex-start'},
    });
  });

  it('keeps chips in a wrapping row', () => {
    expect(listOf(renderField()).props.direction).toBe('row');
  });

  // The stacking applies in a collection cell too — the datagrid row has no fixed height, so it
  // simply grows rather than clipping the links below the first.
  it('stacks text links in a collection as well', () => {
    state.isInCollection = true;

    expect(listOf(renderField({variant: 'link'})).props.direction).toBe('column');
  });
});

describe('SchemaReferenceArrayField - width cap', () => {
  // A stacked text link pays only the cell's own padding: it has neither the chip's inset nor the
  // row gap, so the chip's larger offset would ellipsise it well before the column runs out.
  it('caps a text link at the cell padding only', () => {
    state.isInCollection = true;

    expect(representationOf(renderField({variant: 'link'})).props.maxWidth).toBe(
      'calc(var(--field-tag_ids, 500px) - 32px)'
    );
  });

  it('keeps the chip row offset unchanged', () => {
    state.isInCollection = true;

    expect(representationOf(renderField()).props.maxWidth).toBe(
      'calc(var(--field-tag_ids, 500px) - 46px)'
    );
  });

  it('leaves the cap to the container outside a collection', () => {
    expect(representationOf(renderField({variant: 'link'})).props.maxWidth).toBeUndefined();
  });
});

describe('SchemaReferenceArrayField - fieldDefaults', () => {
  // The application's choice, set once on `SchemaAdmin` (or per resource) instead of duplicated into
  // a `fieldProvider` override. A prop on the field still wins over it.
  it('falls back to the shape the application chose', () => {
    expect(representationOf(renderField({}, {reference: 'link'})).props.variant).toBe('link');
  });

  it('stacks the links the application asked for, one per line', () => {
    expect(listOf(renderField({}, {reference: 'link'})).props.direction).toBe('column');
  });

  it('lets an explicit prop win over it', () => {
    expect(
      representationOf(renderField({variant: 'chip'}, {reference: 'link'})).props.variant
    ).toBe('chip');
  });

  // Regression guard for every project that sets no defaults at all.
  it('is a chip when nothing says otherwise', () => {
    expect(representationOf(renderField()).props.variant).toBe('chip');
  });
});
