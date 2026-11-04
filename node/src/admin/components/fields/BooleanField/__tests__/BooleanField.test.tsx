import React from 'react';
import {CoreAdminContext, RecordContextProvider} from 'react-admin';
import {describe, expect, it} from 'vitest';
import {i18nProvider} from '@admin/pages/_i18n';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import {render, screen} from '@testing-library/react';
import {BooleanField, BooleanFieldProps} from '../BooleanField';

const dataProvider = {getList: () => Promise.resolve({data: [], total: 0})} as never;

const renderField = (
  props: Partial<BooleanFieldProps> = {},
  {value = true, isInCollection = false}: {value?: unknown; isInCollection?: boolean} = {}
) =>
  render(
    <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
      <ValueLocationContextProvider value={{isInCollection}}>
        <RecordContextProvider value={{id: 1, is_available: value}}>
          <BooleanField source="is_available" {...props} />
        </RecordContextProvider>
      </ValueLocationContextProvider>
    </CoreAdminContext>
  );

// The chip is an MUI `Chip`, the glyph an `svg`; both carry the yes/no word somewhere (the chip as
// its label, the glyph only in React Admin's tooltip), so the shapes are told apart by what element
// the value is drawn as rather than by the text alone.
const chip = () => document.querySelector('.MuiChip-root');
const glyph = () => document.querySelector('svg');

describe('BooleanField - variant', () => {
  // Regression guard: a project that asks for nothing keeps the chip it has today.
  it('renders a chip by default', () => {
    renderField();

    expect(chip()).toHaveTextContent('Yes');
    expect(glyph()).toBeNull();
  });

  it('renders the yes/no word as plain text', () => {
    renderField({variant: 'text'});

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(chip()).toBeNull();
    expect(glyph()).toBeNull();
  });

  it('renders the word for false too', () => {
    renderField({variant: 'text'}, {value: false});

    expect(screen.getByText('No')).toBeInTheDocument();
  });
});

describe('BooleanField - icon variant', () => {
  // A glyph buys back a column's width, which is only scarce inside a collection.
  it('renders a glyph in a collection', () => {
    renderField({variant: 'icon'}, {isInCollection: true});

    expect(glyph()).toBeInTheDocument();
    expect(chip()).toBeNull();
  });

  // Outside one, a tick beside a label reads worse than the word it stands for.
  it('falls back to the word outside a collection', () => {
    renderField({variant: 'icon'});

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(glyph()).toBeNull();
  });
});

describe('BooleanField - color', () => {
  it('tints the chip by the value', () => {
    renderField({color: true});
    expect(chip()).toHaveClass('MuiChip-colorSuccess');

    renderField({color: true}, {value: false});
    expect(document.querySelectorAll('.MuiChip-root')[1]).toHaveClass('MuiChip-colorError');
  });

  it('leaves the chip neutral without it', () => {
    renderField();

    expect(chip()).toHaveClass('MuiChip-colorDefault');
  });
});

describe('BooleanField - chipVariant', () => {
  // The MUI chip style is a separate axis from the shape, which is why it no longer shares the name
  // `variant` with it.
  it('draws the chip in the MUI style it is given', () => {
    renderField({chipVariant: 'outlined'});

    expect(chip()).toHaveClass('MuiChip-outlined');
  });

  it('defaults to the soft style', () => {
    renderField();

    expect(chip()).toHaveClass('MuiChip-soft');
  });
});

describe('BooleanField - empty value', () => {
  // React Admin's own handling, which every shape inherits by going through its `TrueIcon` /
  // `FalseIcon` rather than rendering in place of its field.
  it('shows the empty text instead of a shape when the value is missing', () => {
    renderField({variant: 'text', emptyText: 'Unknown'}, {value: null});

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByText('No')).toBeNull();
  });
});
