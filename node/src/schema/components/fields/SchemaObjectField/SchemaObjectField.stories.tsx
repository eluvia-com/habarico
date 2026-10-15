import React from 'react';
import {productField} from '@schema/components/_data';
import {withSchemaFieldShell} from '@schema/components/_storyKit';
import type {FieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaObjectField} from './SchemaObjectField';

const DIMENSION_FIELDS = productField('dimensions').properties as FieldSchema[];

/**
 * The **field-level adapter for a nested object** — what `defaultFieldProvider` resolves an
 * `object` field with `properties` to, on a detail view.
 *
 * It renders nothing itself: it builds a `BoxSchema` of type `object` on the fly — `object.target`
 * from the last segment of `source`, one field descriptor per declared property — and hands it to
 * `SchemaObjectBox`. So everything the object box does (source resolution inside the object, the
 * read-only / writable split) applies here, and this component only exists so a nested object can
 * appear in a *field* position rather than as a box in the layout.
 *
 * It is **detail-only**: `defaultFieldProvider` returns nothing for this branch inside a collection,
 * because a nested structure has no single-cell rendering.
 */
const meta = {
  title: 'schema/fields/SchemaObjectField',
  component: SchemaObjectField,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The whole nested object, each property rendered by its own field schema. */
export const Default: Story = {
  render: () => (
    <SchemaObjectField source={'dimensions'} label={'Dimensions'} fields={DIMENSION_FIELDS} />
  ),
};

/** A record with no nested object — the object box's empty state, not a blank field. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 1, name: 'Mechanical Keyboard K2'}}},
  render: () => (
    <SchemaObjectField source={'dimensions'} label={'Dimensions'} fields={DIMENSION_FIELDS} />
  ),
};
