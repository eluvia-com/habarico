import React from 'react';
import {productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaInputShell} from '@schema/components/_storyKit';
import type {FieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaRangeInput} from './SchemaRangeInput';

const RANGE_FIELDS = productField('price_range').properties as FieldSchema[];

/**
 * The **write-mode range** — two bound inputs presented as one field, and what
 * `defaultInputProvider` resolves an `object` schema with `format: 'range'` to.
 *
 * Each bound is rendered by the input dispatcher from its own property schema, so a decimal range
 * gets number inputs and the pair binds to `price_range.lower` / `price_range.upper`.
 *
 * One special case lives in the provider rather than here: a range whose properties are **all**
 * `format: 'date'` never reaches this component — it collapses to a single `DateRangeInput`
 * instead, because two date pickers side by side is a worse calendar than one range picker.
 */
const meta = {
  title: 'schema/inputs/SchemaRangeInput',
  component: SchemaRangeInput,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Both bounds seeded from the record. */
export const Default: Story = {
  render: () => (
    <SchemaRangeInput source={'price_range'} label={'Price range'} fields={RANGE_FIELDS} />
  ),
};

/** An empty and a half-filled range — a bound may be left open. */
export const PartialValues: Story = {
  parameters: {schemaStory: {record: {id: 1, empty_range: {}, half_range: {lower: 99}}}},
  render: () => (
    <ShowcaseStack title={'SchemaRangeInput — partial values'}>
      <Showcase caption={'{} — both bounds open'}>
        <SchemaRangeInput source={'empty_range'} label={'Empty'} fields={RANGE_FIELDS} />
      </Showcase>
      <Showcase caption={'{lower: 99} — upper bound open'}>
        <SchemaRangeInput source={'half_range'} label={'From only'} fields={RANGE_FIELDS} />
      </Showcase>
    </ShowcaseStack>
  ),
};
