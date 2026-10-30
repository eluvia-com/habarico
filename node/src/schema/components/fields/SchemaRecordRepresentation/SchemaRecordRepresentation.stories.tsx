import React from 'react';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaRecordRepresentation} from './SchemaRecordRepresentation';

/**
 * **How a related record looks.** The ambient record rendered as its `meta.repr` — the display
 * string the backend sends with every record. This is what a relation field puts on screen, so it
 * is where "what a relation looks like" is actually decided. `variant` picks the shape: a `'chip'`
 * (the default — a tag) or a `'link'` (plain text, for a reference that should read as part of the
 * surrounding text).
 *
 * It is a thin wrapper over the admin `RecordRepresentation`, and the thing it adds is the
 * **link resolution**: the admin component needs an already-resolved view (deciding whether a
 * resource *has* a show view requires a schema, which the admin layer does not have), so this
 * component takes the schema-level `link` — `true`, `'show'`, `'edit'` or `false` — and resolves it
 * through `useSchemaRecordLinkOptions` against the resource's schema.
 *
 * That means `link` is a **request, not a guarantee**: asking for `'edit'` on a resource whose
 * schema has no edit view yields an unlinked representation rather than a broken one. Everything
 * else — `variant`, `maxWidth`, `linkMode`, `dialogWidth` and the chip's own `size` /
 * `chipVariant` / `color` / `icon` — is the admin component's and passes through untouched.
 *
 * Note the default: **`link` defaults to `false` here**, so a representation links only when asked.
 */
const meta = {
  title: 'schema/fields/SchemaRecordRepresentation',
  component: SchemaRecordRepresentation,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * The two shapes the representation takes. The chip is the default; the text link is the same
 * record, the same resolved link, rendered to read as part of a sentence.
 */
export const Variants: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaRecordRepresentation — variant'}>
      <Showcase caption={"variant: 'chip' (the default)"}>
        <SchemaRecordRepresentation link />
      </Showcase>
      <Showcase caption={"variant: 'link' — plain text"}>
        <SchemaRecordRepresentation variant={'link'} link />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * Link resolution against the schema. `products` has both a `show` and an `edit` view, so both
 * requests link; `false` is the component's own default and renders a plain chip.
 */
export const LinkResolution: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaRecordRepresentation — link'}>
      <Showcase caption={'link: false (the default) → a plain chip'}>
        <SchemaRecordRepresentation link={false} />
      </Showcase>
      <Showcase caption={"link: true → the resource's default view"}>
        <SchemaRecordRepresentation link />
      </Showcase>
      <Showcase caption={"link: 'show'"}>
        <SchemaRecordRepresentation link={'show'} />
      </Showcase>
      <Showcase caption={"link: 'edit'"}>
        <SchemaRecordRepresentation link={'edit'} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** The admin chip's own appearance props, passed straight through. */
export const Appearance: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaRecordRepresentation — appearance'}>
      {(['soft', 'filled', 'outlined'] as const).map((chipVariant) => (
        <Showcase key={chipVariant} caption={`chipVariant: '${chipVariant}' — small, then medium`}>
          <SchemaRecordRepresentation link={false} chipVariant={chipVariant} size={'small'} />
          <SchemaRecordRepresentation link={false} chipVariant={chipVariant} size={'medium'} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * A long representation string against a `maxWidth` — the representation truncates rather than
 * stretching the column it sits in. This is the path a datagrid cell uses.
 */
export const Truncation: Story = {
  parameters: {
    schemaStory: {
      record: {
        id: 1,
        name: 'A product whose representation is far too long for one chip',
        meta: {
          schema: {name: 'products', pkFieldName: 'id', actions: []},
          repr: 'A product whose representation is far too long for one chip',
          tags: [],
        },
      },
    },
  },
  render: () => (
    <ShowcaseStack title={'SchemaRecordRepresentation — maxWidth'}>
      <Showcase caption={'no maxWidth'}>
        <SchemaRecordRepresentation link={false} />
      </Showcase>
      <Showcase caption={'maxWidth: 200'}>
        <SchemaRecordRepresentation link={false} maxWidth={200} />
      </Showcase>
    </ShowcaseStack>
  ),
};
