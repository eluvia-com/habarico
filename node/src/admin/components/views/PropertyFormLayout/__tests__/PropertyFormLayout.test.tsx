import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {AdminContext, Form, FormDataConsumer, TextInput} from 'react-admin';
import {describe, expect, it} from 'vitest';
import {messages} from '@foundation/utils/locale';
import {render, screen} from '@testing-library/react';
import {PropertyFormLayout} from '../PropertyFormLayout';

const i18nProvider = polyglotI18nProvider(() => messages.en, 'en');

const renderLayout = (children: React.ReactNode, record: Record<string, unknown> = {}) =>
  render(
    <AdminContext i18nProvider={i18nProvider}>
      <Form record={record}>
        <PropertyFormLayout>{children}</PropertyFormLayout>
      </Form>
    </AdminContext>
  );

// The row label cell holding `label`, or `null`: the label must show exactly once, in that cell, and
// not as the input's own floating label.
const rowLabel = (label: string) => {
  const matches = screen.queryAllByText(label);
  return matches.length === 1 ? matches[0].closest('.PropertyItem-label') : null;
};

describe('PropertyFormLayout children', () => {
  it('builds the row from the input a FormDataConsumer returns', () => {
    renderLayout(
      <FormDataConsumer>
        {({formData}) => formData.has_discount && <TextInput source="discount" label="Discount" />}
      </FormDataConsumer>,
      {has_discount: true}
    );

    expect(rowLabel('Discount')).not.toBeNull();
  });

  it('renders no row while a FormDataConsumer returns nothing', () => {
    renderLayout(
      [
        <TextInput key="name" source="name" label="Name" />,
        <FormDataConsumer key="discount">
          {({formData}) =>
            formData.has_discount && <TextInput source="discount" label="Discount" />
          }
        </FormDataConsumer>,
      ],
      {has_discount: false}
    );

    expect(rowLabel('Name')).not.toBeNull();
    expect(screen.queryByText('Discount')).toBeNull();
    expect(document.querySelectorAll('.PropertyItem-label')).toHaveLength(1);
  });

  it('gives each input of a fragment a FormDataConsumer returns its own row', () => {
    renderLayout(
      <FormDataConsumer>
        {() => (
          <>
            <TextInput source="street" label="Street" />
            <TextInput source="city" label="City" />
          </>
        )}
      </FormDataConsumer>
    );

    expect(rowLabel('Street')).not.toBeNull();
    expect(rowLabel('City')).not.toBeNull();
  });

  it('gives each input of an array a FormDataConsumer returns its own row', () => {
    renderLayout(
      <FormDataConsumer>
        {() => [
          <TextInput key="street" source="street" label="Street" />,
          <TextInput key="city" source="city" label="City" />,
        ]}
      </FormDataConsumer>
    );

    expect(rowLabel('Street')).not.toBeNull();
    expect(rowLabel('City')).not.toBeNull();
  });

  it('gives each input of a top-level fragment its own row', () => {
    renderLayout(
      <>
        <TextInput source="street" label="Street" />
        <TextInput source="city" label="City" />
      </>
    );

    expect(rowLabel('Street')).not.toBeNull();
    expect(rowLabel('City')).not.toBeNull();
  });
});
