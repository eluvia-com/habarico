import React, {ReactNode} from 'react';
import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FieldDefaultsProvider} from '../FieldDefaultsProvider';
import {FIELD_DEFAULTS, useFieldDefaults} from '../useFieldDefaults';

// Prints the resolved shapes so a test can assert all three at once — the merge rules are about the
// keys a provider does *not* set as much as the ones it does.
const Resolved = () => {
  const {reference, boolean, choices} = useFieldDefaults();
  return <span data-testid="resolved">{`${reference}/${boolean}/${choices}`}</span>;
};

const resolved = (tree: ReactNode) => {
  render(<>{tree}</>);
  return screen.getByTestId('resolved').textContent;
};

describe('useFieldDefaults', () => {
  // A field is rendered in a unit test and in a story with no admin above it; the hook has to answer
  // there rather than throw, the way `useListConfigContext` does.
  it('falls back to the built-in shapes with no provider', () => {
    expect(resolved(<Resolved />)).toBe('chip/chip/chip');
    expect(FIELD_DEFAULTS).toEqual({reference: 'chip', boolean: 'chip', choices: 'chip'});
  });

  it('publishes the shapes it is given', () => {
    expect(
      resolved(
        <FieldDefaultsProvider reference="link" boolean="text" choices="text">
          <Resolved />
        </FieldDefaultsProvider>
      )
    ).toBe('link/text/text');
  });

  it('leaves the keys it is not given at the built-in shape', () => {
    expect(
      resolved(
        <FieldDefaultsProvider boolean="icon">
          <Resolved />
        </FieldDefaultsProvider>
      )
    ).toBe('chip/icon/chip');
  });
});

describe('useFieldDefaults - nesting', () => {
  // The resource-level provider over the admin-level one: a resource naming one kind of field must
  // not reset the application's choice for the others.
  it('merges with the provider above instead of replacing it', () => {
    expect(
      resolved(
        <FieldDefaultsProvider reference="link" choices="text">
          <FieldDefaultsProvider boolean="icon">
            <Resolved />
          </FieldDefaultsProvider>
        </FieldDefaultsProvider>
      )
    ).toBe('link/icon/text');
  });

  it('lets the nearest provider win on a key both set', () => {
    expect(
      resolved(
        <FieldDefaultsProvider reference="link">
          <FieldDefaultsProvider reference="chip">
            <Resolved />
          </FieldDefaultsProvider>
        </FieldDefaultsProvider>
      )
    ).toBe('chip/chip/chip');
  });
});
