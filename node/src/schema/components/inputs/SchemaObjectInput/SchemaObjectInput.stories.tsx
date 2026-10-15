import React from 'react';
import {productField} from '@schema/components/_data';
import {withSchemaInputShell} from '@schema/components/_storyKit';
import type {FieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaObjectInput} from './SchemaObjectInput';

const DIMENSION_FIELDS = productField('dimensions').properties as FieldSchema[];

/**
 * The **write-mode adapter for a nested object** — the input counterpart of `SchemaObjectField`,
 * and what `defaultInputProvider` resolves an `object` schema with `properties` to.
 *
 * Same shape as the read-side adapter: it builds an `object` `BoxSchema` from `source` and the
 * declared properties and delegates to `SchemaObjectBox`, which then takes its writable branch. The
 * inputs bind to paths inside the object (`dimensions.width`), so the form value stays a nested
 * object rather than being flattened.
 */
const meta = {
  title: 'schema/inputs/SchemaObjectInput',
  component: SchemaObjectInput,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The nested object seeded from the record. */
export const Default: Story = {
  render: () => (
    <SchemaObjectInput source={'dimensions'} label={'Dimensions'} fields={DIMENSION_FIELDS} />
  ),
};

/** An empty form — the object does not exist yet on the record. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 1}}},
  render: () => (
    <SchemaObjectInput source={'dimensions'} label={'Dimensions'} fields={DIMENSION_FIELDS} />
  ),
};
