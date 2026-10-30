import React, {ReactElement} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SchemaRecordRepresentation} from '@schema/components/fields/SchemaRecordRepresentation';
import {FieldDefaultsProvider} from '@schema/contexts/FieldDefaultsContext';
import {FieldDefaults} from '@schema/types';
import {render} from '@testing-library/react';
import {SchemaReferenceField} from '../SchemaReferenceField';

// The field is exercised through the props it hands the admin `ReferenceField`: the representation
// arrives there as `children`, and the width cap as that child's `maxWidth`. Rendering it for real
// would need a data provider and the whole schema context ring to say nothing more.
const received: Record<string, unknown>[] = [];
vi.mock('@admin/components/fields/ReferenceField', () => ({
  ReferenceField: (props: Record<string, unknown>) => {
    received.push(props);
    return null;
  },
}));

const state = vi.hoisted(() => ({isInCollection: false}));
vi.mock('@design/contexts/ValueLocationContext', () => ({
  useValueLocationContext: () => state,
  ValueLocationContextProvider: ({children}: {children: React.ReactNode}) => children,
}));

vi.mock('@admin/contexts/ResourceContext', () => ({
  useResourceContext: (reference?: string) => reference ?? 'eshop/product',
}));

vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({schema: {name: 'category'}}),
}));

const renderField = (
  props: Partial<React.ComponentProps<typeof SchemaReferenceField>> = {},
  fieldDefaults: FieldDefaults = {}
) => {
  render(
    <FieldDefaultsProvider {...fieldDefaults}>
      <SchemaReferenceField source={'category_id'} reference={'eshop/category'} {...props} />
    </FieldDefaultsProvider>
  );
  return received[received.length - 1];
};

// What this field is responsible for handing the representation — `variant` included, now that it
// is the prop choosing the chip or the text link rather than a choice between two components.
type RepresentationProps = {
  variant?: 'chip' | 'link';
  maxWidth?: string;
  link?: boolean;
  dialogWidth?: string;
};

const representationOf = (props: Record<string, unknown>) =>
  props.children as ReactElement<RepresentationProps>;

beforeEach(() => {
  received.length = 0;
  state.isInCollection = false;
});

describe('SchemaReferenceField - variant', () => {
  // Regression guard: every project that does not ask for the link form must keep its chips.
  it('renders a chip by default', () => {
    const representation = representationOf(renderField());

    expect(representation.type).toBe(SchemaRecordRepresentation);
    expect(representation.props.variant).toBe('chip');
  });

  it('renders a chip when asked for one explicitly', () => {
    expect(representationOf(renderField({variant: 'chip'})).props.variant).toBe('chip');
  });

  it('renders a text link when asked for one', () => {
    expect(representationOf(renderField({variant: 'link'})).props.variant).toBe('link');
  });

  it('passes the schema link options on whichever variant it renders', () => {
    const options = {relation: {showLink: false, dialogWidth: '40rem'}};

    for (const variant of ['chip', 'link'] as const) {
      expect(representationOf(renderField({variant, options})).props).toMatchObject({
        link: false,
        dialogWidth: '40rem',
      });
    }
  });
});

describe('SchemaReferenceField - width cap', () => {
  it('caps both representations at the column width in a collection', () => {
    state.isInCollection = true;

    for (const variant of ['chip', 'link'] as const) {
      expect(representationOf(renderField({variant})).props.maxWidth).toBe(
        'calc(var(--field-category_id, 500px) - 32px)'
      );
    }
  });

  it('leaves the cap to the container outside a collection', () => {
    for (const variant of ['chip', 'link'] as const) {
      expect(representationOf(renderField({variant})).props.maxWidth).toBeUndefined();
    }
  });

  // A dotted source names a nested field; a CSS custom property cannot carry the dot.
  it('flattens a nested source into the column-width variable name', () => {
    state.isInCollection = true;

    expect(representationOf(renderField({source: 'owner.category_id'})).props.maxWidth).toBe(
      'calc(var(--field-owner__category_id, 500px) - 32px)'
    );
  });
});

describe('SchemaReferenceField - fieldDefaults', () => {
  // The application's choice, set once on `SchemaAdmin` (or per resource) instead of duplicated into
  // a `fieldProvider` override. A prop on the field still wins over it.
  it('falls back to the shape the application chose', () => {
    expect(representationOf(renderField({}, {reference: 'link'})).props.variant).toBe('link');
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
