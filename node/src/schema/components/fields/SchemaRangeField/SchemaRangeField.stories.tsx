import React from 'react';
import {productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {FieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaRangeField} from './SchemaRangeField';

const RANGE_FIELDS = productField('price_range').properties as FieldSchema[];

const DATE_RANGE_FIELDS: FieldSchema[] = [
  {name: 'lower', type: 'string', format: 'date', label: 'From'},
  {name: 'upper', type: 'string', format: 'date', label: 'To'},
];

/**
 * Renders a **range** — an object-typed field with `format: 'range'`, whose `properties` declare a
 * `lower` and an `upper` bound.
 *
 * The two bounds are not rendered by this component: each is handed back to `SchemaField`, so a
 * range of decimals formats like a decimal and a range of dates like a date. `SchemaRangeField` only
 * owns the pairing.
 *
 * Two details that are easy to miss:
 *
 * - **An open bound reads as infinity.** A missing `lower` renders `-∞` and a missing `upper` `∞`,
 *   rather than an empty slot — so a half-open range still reads as a range.
 * - **It throws** when `fields` lacks a `lower` or an `upper`. Unlike the object / array boxes,
 *   which degrade quietly, a range with no bounds is treated as a schema error.
 *
 * Inside a collection it renders at fixed column widths so ranges line up down a datagrid column;
 * on a detail it takes its natural width.
 */
const meta = {
  title: 'schema/fields/SchemaRangeField',
  component: SchemaRangeField,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** A closed numeric range — both bounds present, each formatted by its own field schema. */
export const Closed: Story = {
  render: () => (
    <SchemaRangeField source={'price_range'} label={'Price range'} fields={RANGE_FIELDS} />
  ),
};

/**
 * Half-open and fully open ranges. A missing bound is infinity, not a blank — the field stays
 * readable as a range whichever end is absent.
 */
export const OpenBounds: Story = {
  parameters: {
    schemaStory: {
      record: {id: 1, from_only: {lower: 99}, to_only: {upper: 149}, neither: {}, absent: null},
      width: 520,
    },
  },
  render: () => (
    <ShowcaseStack title={'SchemaRangeField — open bounds'}>
      <Showcase caption={'{lower: 99} → 99 - ∞'}>
        <SchemaRangeField source={'from_only'} label={'From only'} fields={RANGE_FIELDS} />
      </Showcase>
      <Showcase caption={'{upper: 149} → -∞ - 149'}>
        <SchemaRangeField source={'to_only'} label={'To only'} fields={RANGE_FIELDS} />
      </Showcase>
      <Showcase caption={'{} → -∞ - ∞'}>
        <SchemaRangeField source={'neither'} label={'Neither'} fields={RANGE_FIELDS} />
      </Showcase>
      <Showcase caption={'null → the empty placeholder, not a range'}>
        <SchemaRangeField source={'absent'} label={'Absent'} fields={RANGE_FIELDS} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * A date range — the same component, but each bound rendered by the date field, because the bound's
 * own schema decides its formatting.
 */
export const DateRange: Story = {
  parameters: {
    schemaStory: {record: {id: 1, date_range: {lower: '2026-02-17', upper: '2026-09-14'}}},
  },
  render: () => (
    <SchemaRangeField source={'date_range'} label={'Available'} fields={DATE_RANGE_FIELDS} />
  ),
};
