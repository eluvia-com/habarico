import React from 'react';
import {CoreAdminContext, RecordContextProvider} from 'react-admin';
import {describe, expect, it} from 'vitest';
import {i18nProvider} from '@admin/pages/_i18n';
import {Choices} from '@admin/utils/choices';
import {render, screen} from '@testing-library/react';
import {ChipArrayField} from '../../ChipArrayField';
import {ChoicesField, ChoicesFieldProps} from '../ChoicesField';

const dataProvider = {getList: () => Promise.resolve({data: [], total: 0})} as never;

const PLAIN: Choices = [
  {value: 'draft', label: 'Draft'},
  {value: 'published', label: 'Published'},
];

// One option carrying a color is enough to make the chip load-bearing for the whole field.
const COLORED: Choices = [
  {value: 'draft', label: 'Draft'},
  {value: 'published', label: 'Published', color: 'success'},
];

// `'inherit'` is the contract's way of saying "no color of its own".
const INHERIT: Choices = [{value: 'draft', label: 'Draft', color: 'inherit'}];

const renderField = (props: Partial<ChoicesFieldProps> & {choices: Choices}) =>
  render(
    <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
      <RecordContextProvider value={{id: 1, status: 'published'}}>
        <ChoicesField source="status" {...props} />
      </RecordContextProvider>
    </CoreAdminContext>
  );

const chip = () => document.querySelector('.MuiChip-root');

describe('ChoicesField - variant', () => {
  // Regression guard: a project that asks for nothing keeps the chips it has today.
  it('renders a chip by default', () => {
    renderField({choices: PLAIN});

    expect(chip()).toHaveTextContent('Published');
  });

  it('renders the label as plain text when the options carry no color', () => {
    renderField({choices: PLAIN, variant: 'text'});

    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(chip()).toBeNull();
  });

  it('treats an inherit color as no color of its own', () => {
    renderField({choices: INHERIT, variant: 'text'});

    expect(chip()).toBeNull();
  });

  // The rule worth knowing: a color is information plain text cannot carry, so the chip stays.
  it('keeps the chips when an option defines a color', () => {
    renderField({choices: COLORED, variant: 'text'});

    expect(chip()).toHaveTextContent('Published');
  });

  // Evaluated over the whole option list, not per value: a column mixing chips and bare words
  // reads as a rendering bug, so the colorless value of a colored enum keeps a chip too.
  it('keeps a chip for a colorless value of a colored enum', () => {
    render(
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
        <RecordContextProvider value={{id: 1, status: 'draft'}}>
          <ChoicesField source="status" choices={COLORED} variant="text" />
        </RecordContextProvider>
      </CoreAdminContext>
    );

    expect(chip()).toHaveTextContent('Draft');
  });
});

describe('ChipArrayField - variant', () => {
  const renderArray = (props: {choices?: Choices; variant?: 'chip' | 'text'}) =>
    render(
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
        <RecordContextProvider value={{id: 1, tags: ['draft', 'published']}}>
          <ChipArrayField source="tags" {...props} />
        </RecordContextProvider>
      </CoreAdminContext>
    );

  it('renders chips by default', () => {
    renderArray({choices: PLAIN});

    expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(2);
  });

  it('renders the labels as plain text when the options carry no color', () => {
    renderArray({choices: PLAIN, variant: 'text'});

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(0);
  });

  it('applies the same colored-enum rule as the single-value field', () => {
    renderArray({choices: COLORED, variant: 'text'});

    expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(2);
  });

  // Raw values have no enum behind them and therefore no color to lose.
  it('honours the text shape for raw values with no enum', () => {
    renderArray({variant: 'text'});

    expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(0);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });
});
