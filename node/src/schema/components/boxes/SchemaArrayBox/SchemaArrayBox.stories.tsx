import React from 'react';
import {box, fd} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaArrayBox} from './SchemaArrayBox';

// `variants` is the fixture's object-array field: `items.properties` declares `{sku, size, stock}`.
// Like the object box, the array box reads those properties out of the method schema.
const arrayBox = (overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({
    name: 'variants_box',
    type: 'array',
    label: 'Variants',
    array: {target: 'variants'},
    boxes: [fd('sku'), fd('size'), fd('stock')],
    ...overrides,
  });

/**
 * The **repeating-rows container** — renders an array-typed field as a table of rows, one per array
 * item, with every source resolved inside the item.
 *
 * - **`array.target`** names the field; it must carry `items.properties`, or the box renders
 *   nothing (the same contract as `SchemaObjectBox`).
 * - **`array.inline`** is the row layout, and it changes the padding as well as the arrangement:
 *   a read-only inline array is a full-bleed datagrid (edge to edge), a read-only non-inline one
 *   renders nested-panel rows in a small gutter, and a writable array always takes the medium form
 *   gutter around its inputs.
 * - **`array.listed`** switches to a different component entirely — `defaultBoxProvider` routes a
 *   `listed` array to `SchemaChoicesArrayBox`, the enum checklist, which has its own story.
 * - **Read vs. write** follows the view's `readOnly` **or** the target field's, like the object box.
 *   The writable branch owns the add / remove / reorder row affordances.
 */
const meta = {
  title: 'schema/boxes/SchemaArrayBox',
  component: SchemaArrayBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The writable branch — rows of inputs, with the add / remove affordances. */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={arrayBox({name: 'rw'})} />,
};

/**
 * Read-only, both layouts. `inline: true` is the full-bleed datagrid; `inline: false` renders each
 * row as its own nested panel — note the different gutters, not just the different arrangement.
 */
export const ReadOnlyLayouts: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaArrayBox — readOnly, inline vs. stacked'}>
      <SchemaBox
        isRoot
        schema={arrayBox({
          name: 'ro_inline',
          label: 'inline: true → full-bleed datagrid',
          readOnly: true,
          array: {target: 'variants', inline: true},
        })}
      />
      <SchemaBox
        isRoot
        schema={arrayBox({
          name: 'ro_stacked',
          label: 'inline: false → nested panel rows',
          readOnly: true,
          array: {target: 'variants', inline: false},
        })}
      />
    </ShowcaseStack>
  ),
};

/** An empty array — the writable box offers the first row, the read-only one shows the empty state. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 3, name: 'Wireless Mouse M5', variants: []}}},
  render: () => (
    <ShowcaseStack title={'SchemaArrayBox — no rows'}>
      <SchemaBox isRoot schema={arrayBox({name: 'empty_rw', label: 'writable'})} />
      <SchemaBox isRoot schema={arrayBox({name: 'empty_ro', label: 'readOnly', readOnly: true})} />
    </ShowcaseStack>
  ),
};

/** A target that carries no `items.properties` — the box renders nothing rather than throwing. */
export const UnknownTarget: Story = {
  render: () => (
    <SchemaBox isRoot schema={arrayBox({name: 'unknown', array: {target: 'not_a_field'}})} />
  ),
};
