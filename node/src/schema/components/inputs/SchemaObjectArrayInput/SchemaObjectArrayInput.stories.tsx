import React from 'react';
import {productField} from '@schema/components/_data';
import {withSchemaInputShell} from '@schema/components/_storyKit';
import type {ItemFieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaObjectArrayInput} from './SchemaObjectArrayInput';

const VARIANT_ITEMS = productField('variants').items as ItemFieldSchema;

/**
 * The **write-mode adapter for an array of objects** — what `defaultInputProvider` resolves an
 * `array` schema whose `items.type` is `object` to, unless the items are images or files (those go
 * to `UploadInput` instead).
 *
 * It builds an `array` `BoxSchema` and delegates to `SchemaArrayBox`, whose writable branch owns
 * the add / remove / reorder affordances. Each row's inputs bind to `variants.<index>.<property>`,
 * so the form value stays an array of objects.
 */
const meta = {
  title: 'schema/inputs/SchemaObjectArrayInput',
  component: SchemaObjectArrayInput,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The rows the record carries, as editable rows. */
export const Default: Story = {
  render: () => (
    <SchemaObjectArrayInput source={'variants'} label={'Variants'} items={VARIANT_ITEMS} />
  ),
};

/** An empty array — the writable array box offers the first row. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 3, variants: []}}},
  render: () => (
    <SchemaObjectArrayInput source={'variants'} label={'Variants'} items={VARIANT_ITEMS} />
  ),
};
