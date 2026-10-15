import React from 'react';
import {productField} from '@schema/components/_data';
import {withSchemaFieldShell} from '@schema/components/_storyKit';
import type {ItemFieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaObjectArrayField} from './SchemaObjectArrayField';

const VARIANT_ITEMS = productField('variants').items as ItemFieldSchema;

/**
 * The **field-level adapter for an array of objects** — the array counterpart of
 * `SchemaObjectField`, and what `defaultFieldProvider` resolves an `array` field whose
 * `items.type` is `object` to, on a detail view.
 *
 * Like its sibling it renders nothing itself: it builds an `array` `BoxSchema` from `source` and
 * `items.properties` and delegates to `SchemaArrayBox`.
 *
 * Two contract details: it returns **nothing** when `items.properties` is missing or not an array
 * (a quiet degrade, matching the array box), and it is **detail-only** — the provider skips this
 * branch inside a collection.
 */
const meta = {
  title: 'schema/fields/SchemaObjectArrayField',
  component: SchemaObjectArrayField,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The rows the record carries. */
export const Default: Story = {
  render: () => (
    <SchemaObjectArrayField source={'variants'} label={'Variants'} items={VARIANT_ITEMS} />
  ),
};

/** An empty array — the array box's empty state. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 3, variants: []}}},
  render: () => (
    <SchemaObjectArrayField source={'variants'} label={'Variants'} items={VARIANT_ITEMS} />
  ),
};

/** `items` with no `properties` — the component renders nothing rather than throwing. */
export const NoProperties: Story = {
  render: () => (
    <SchemaObjectArrayField
      source={'variants'}
      label={'Variants'}
      items={{name: 'variants', type: 'object'}}
    />
  ),
};
