import React from 'react';
import {CATEGORIES_RESOURCE, PRODUCT_STATUSES} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaInputShell} from '@schema/components/_storyKit';
import type {FilterSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaFilter} from './SchemaFilter';

// A `FilterSchema` is a `FieldSchema` minus the write-side flags, plus `isAlwaysOn`. The same
// `type` + `format` pair that picks a field picks the filter input.
const FILTERS: FilterSchema[] = [
  {name: 'name', type: 'string', format: 'text', label: 'Name'},
  {name: 'status', type: 'string', format: 'choices', label: 'Status', enum: PRODUCT_STATUSES},
  {name: 'active', type: 'boolean', label: 'Active'},
  {name: 'stock', type: 'integer', label: 'In stock'},
  {name: 'released_on', type: 'string', format: 'date', label: 'Released on'},
  {
    name: 'category_id',
    type: 'integer',
    format: 'relation',
    label: 'Category',
    reference: CATEGORIES_RESOURCE,
  },
];

const filterOf = (name: string): FilterSchema => {
  const schema = FILTERS.find((filter) => filter.name === name);
  if (!schema) throw new Error(`No mock filter named "${name}"`);
  return schema;
};

/**
 * One **list filter**, built from a `FilterSchema`.
 *
 * It resolves through the same `useGetInput` chain as `SchemaInput`, but with `isFilter: true` —
 * which is where the two differ. A filter is a *query*, not a value, so some types render
 * differently: a `boolean` filter becomes a `TriStateBooleanInput` (yes / no / either) rather than a
 * checkbox, because "unset" has to be distinguishable from "false".
 *
 * How it handles an unresolvable filter is worth knowing, because the two cases are deliberately
 * different:
 *
 * - The provider returns **`null`** — a project switched this filter off on purpose. Nothing
 *   renders, silently.
 * - The provider returns **`undefined`** — no input is registered for that `type` / `format`, which
 *   is most likely a schema gap. Nothing renders either, but a `console.warn` names the filter in
 *   development, because the filter still counts towards the filter button and would otherwise be
 *   an invisible discrepancy.
 *
 * Filters are always `fullWidth` and `size: 'small'` — the filter drawer's layout, not the field's
 * own choice.
 */
const meta = {
  title: 'schema/filters/SchemaFilter',
  component: SchemaFilter,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * Every filter type the fixtures cover. Note `active`: as a filter a boolean is **tri-state**, so a
 * list can be filtered to "either" as well as to yes or no.
 */
export const FilterTypes: Story = {
  parameters: {schemaStory: {record: {}, width: 620}},
  render: () => (
    <ShowcaseStack title={'SchemaFilter — one schema per row'}>
      {FILTERS.map((schema) => (
        <Showcase
          key={schema.name}
          caption={`${schema.name} — type: '${schema.type}'${
            schema.format ? `, format: '${schema.format}'` : ''
          }`}
        >
          <SchemaFilter schema={schema} source={schema.name} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * A filter whose `type` / `format` no input is registered for. Nothing renders, and in development
 * a `console.warn` names the filter — the case that would otherwise be an invisible schema gap.
 */
export const UnresolvedFilter: Story = {
  parameters: {schemaStory: {record: {}}},
  render: () => (
    <SchemaFilter
      schema={{name: 'mystery', type: 'object', label: 'Unresolvable'}}
      source={'mystery'}
    />
  ),
};

/** A filter pre-seeded with a value — what the drawer shows for an already-applied filter. */
export const WithValue: Story = {
  parameters: {schemaStory: {record: {status: 'published', name: 'Keyboard'}, width: 620}},
  render: () => (
    <ShowcaseStack title={'SchemaFilter — applied values'}>
      <Showcase caption={'name'}>
        <SchemaFilter schema={filterOf('name')} source={'name'} />
      </Showcase>
      <Showcase caption={'status'}>
        <SchemaFilter schema={filterOf('status')} source={'status'} />
      </Showcase>
    </ShowcaseStack>
  ),
};
