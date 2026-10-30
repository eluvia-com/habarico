import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {FieldDefaultsProvider} from '@schema/contexts/FieldDefaultsContext';
import {FieldDefaults} from '@schema/types';
import {render} from '@testing-library/react';
import {SchemaBooleanField} from '../SchemaBooleanField';
import {SchemaChipArrayField} from '../SchemaChipArrayField';
import {SchemaChoicesField} from '../SchemaChoicesField';

// Each wrapper adds one thing to its admin field — the shape the application chose — so each is read
// through the `variant` it hands down. The admin components themselves are covered by their own
// tests; rendering them for real here would only re-assert those.
// Hoisted with the `vi.mock` factories below, which run before the module body.
const {received, capture} = vi.hoisted(() => {
  const received: Record<string, unknown>[] = [];
  return {
    received,
    capture: (props: Record<string, unknown>) => {
      received.push(props);
      return null;
    },
  };
});

vi.mock('@admin/components/fields/BooleanField', () => ({BooleanField: capture}));
vi.mock('@admin/components/fields/ChoicesField', () => ({ChoicesField: capture}));
vi.mock('@admin/components/fields/ChipArrayField', () => ({ChipArrayField: capture}));

const variantOf = (field: React.ReactElement, fieldDefaults: FieldDefaults = {}) => {
  received.length = 0;
  render(<FieldDefaultsProvider {...fieldDefaults}>{field}</FieldDefaultsProvider>);
  return received[received.length - 1].variant;
};

describe('SchemaBooleanField', () => {
  it('is a chip when nothing says otherwise', () => {
    expect(variantOf(<SchemaBooleanField source="is_available" />)).toBe('chip');
  });

  it('takes the shape the application chose', () => {
    expect(variantOf(<SchemaBooleanField source="is_available" />, {boolean: 'text'})).toBe('text');
  });

  it('lets an explicit prop win over it', () => {
    expect(
      variantOf(<SchemaBooleanField source="is_available" variant="icon" />, {boolean: 'text'})
    ).toBe('icon');
  });

  // `fieldDefaults` is a record per kind of field for exactly this reason: a reference's `'link'`
  // means nothing to a boolean, and nothing should leak across the kinds.
  it('ignores the shapes chosen for other kinds of field', () => {
    expect(
      variantOf(<SchemaBooleanField source="is_available" />, {reference: 'link', choices: 'text'})
    ).toBe('chip');
  });
});

describe('SchemaChoicesField', () => {
  const choices = [{value: 'draft', label: 'Draft'}];

  it('is a chip when nothing says otherwise', () => {
    expect(variantOf(<SchemaChoicesField source="status" choices={choices} />)).toBe('chip');
  });

  it('takes the shape the application chose', () => {
    expect(variantOf(<SchemaChoicesField source="status" choices={choices} />, {choices: 'text'})) //
      .toBe('text');
  });

  it('lets an explicit prop win over it', () => {
    expect(
      variantOf(<SchemaChoicesField source="status" choices={choices} variant="chip" />, {
        choices: 'text',
      })
    ).toBe('chip');
  });
});

describe('SchemaChipArrayField', () => {
  // An array of choices reads the same key as a single one, so one project never renders the two in
  // two different shapes.
  it('takes the shape chosen for choices', () => {
    expect(variantOf(<SchemaChipArrayField source="tags" />, {choices: 'text'})).toBe('text');
  });

  it('is a chip when nothing says otherwise', () => {
    expect(variantOf(<SchemaChipArrayField source="tags" />)).toBe('chip');
  });
});
