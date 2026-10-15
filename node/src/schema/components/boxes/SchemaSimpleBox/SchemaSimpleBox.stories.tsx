import React from 'react';
import {PRODUCT_STATUSES, SUMMARY_FIELDS, box, fd, rootWrap} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaSimpleBox} from './SchemaSimpleBox';

// The stories render through `SchemaBox`, not `SchemaSimpleBox` directly: `simple` is the
// `defaultBoxProvider`'s fallback branch, so going through the dispatcher is what a schema actually
// produces — and it proves the routing, not just the component.
const simpleBox = (overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({name: 'summary', type: 'simple', label: 'Product', boxes: SUMMARY_FIELDS, ...overrides});

/**
 * The **default box type** — `defaultBoxProvider` routes every `BoxType` it does not recognise here,
 * so `simple` is what a box schema without a more specific type renders as. It lays its children out
 * one under another in a `PropertyList`: label on the left, value on the right.
 *
 * Its only structural decisions are the surface and the header:
 *
 * - **Card chrome** appears when the box carries a `label`, has `toolbarActions` or is
 *   `collapsible` — plus on the view's root box while it holds fields of its own. `card` overrides
 *   both ways, and a card stops the root default being handed down to children.
 * - **`readOnly`** on the schema is only half the story: the box renders read-only when the *view*
 *   is read-only (`list` / `show`) **or** the schema says so. These stories mount in an `edit` view,
 *   so the read-only examples set it on the schema.
 *
 * Header and footer action slots are resolved against the box's own record — see
 * `schema/boxes/BoxActions` for where each slot lands and why a descriptor is sometimes dropped.
 */
const meta = {
  title: 'schema/boxes/SchemaSimpleBox',
  component: SchemaSimpleBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The plain case — a labelled box of three fields. */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={simpleBox()} />,
};

/**
 * What decides the card. A labelled box draws one; a bare one is a transparent grouping container;
 * `card` forces either way regardless of the rest of the schema.
 */
export const CardChrome: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaSimpleBox — card chrome'}>
      <SchemaBox isRoot schema={rootWrap('labelled', simpleBox({label: 'Labelled → card'}))} />
      <SchemaBox isRoot schema={rootWrap('bare', simpleBox({name: 'bare', label: undefined}))} />
      <SchemaBox
        isRoot
        schema={rootWrap('forced', simpleBox({name: 'forced', label: undefined, card: true}))}
      />
    </ShowcaseStack>
  ),
};

/** Read-only renders the leaves as fields, writable as inputs — one schema, both view modes. */
export const ReadOnlyAndWritable: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaSimpleBox — readOnly'}>
      <SchemaBox
        isRoot
        schema={rootWrap('ro', simpleBox({name: 'ro', label: 'readOnly: true', readOnly: true}))}
      />
      <SchemaBox
        isRoot
        schema={rootWrap('rw', simpleBox({name: 'rw', label: 'readOnly: false'}))}
      />
    </ShowcaseStack>
  ),
};

/** A collapsible box gets a toggle in its header; `closed` starts folded. */
export const Collapsible: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaSimpleBox — collapsible'}>
      <SchemaBox
        isRoot
        schema={rootWrap('open', simpleBox({name: 'open', label: 'open', collapsible: 'open'}))}
      />
      <SchemaBox
        isRoot
        schema={rootWrap(
          'closed',
          simpleBox({name: 'closed', label: 'closed', collapsible: 'closed'})
        )}
      />
    </ShowcaseStack>
  ),
};

/**
 * Nesting: a bare simple box groups two labelled ones. The outer box draws no surface, so the two
 * inner cards sit directly on the page — this is how a detail view stacks sections.
 */
export const Nested: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={box({
        name: 'sections',
        type: 'simple',
        card: false,
        boxes: [
          simpleBox({name: 'identity', label: 'Identity', boxes: [fd('name'), fd('sku')]}),
          simpleBox({
            name: 'availability',
            label: 'Availability',
            boxes: [fd('price'), fd('stock'), fd('active')],
          }),
        ],
      })}
    />
  ),
};

/** A read-only box showing a choice value, so the enum rendering is visible at a glance. */
export const WithChoices: Story = {
  parameters: {
    schemaStory: {
      record: {
        id: 1,
        name: 'Mechanical Keyboard K2',
        status: PRODUCT_STATUSES[1].value,
        active: true,
      },
    },
  },
  render: () => (
    <SchemaBox
      isRoot
      schema={simpleBox({
        name: 'state',
        label: 'State',
        readOnly: true,
        boxes: [fd('name'), fd('status'), fd('active')],
      })}
    />
  ),
};
