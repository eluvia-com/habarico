import React from 'react';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaRecordRepresentationChip} from './SchemaRecordRepresentationChip';

/**
 * **How a related record looks.** The ambient record rendered as a chip showing its `meta.repr` —
 * the display string the backend sends with every record. This is what a relation field puts on
 * screen, so it is where "what a relation looks like" is actually decided.
 *
 * It is a thin wrapper over the admin `RecordRepresentationChip`, and the thing it adds is the
 * **link resolution**: the admin chip needs an already-resolved view (deciding whether a resource
 * *has* a show view requires a schema, which the admin layer does not have), so this component
 * takes the schema-level `link` — `true`, `'show'`, `'edit'` or `false` — and resolves it through
 * `useSchemaRecordLinkOptions` against the resource's schema.
 *
 * That means `link` is a **request, not a guarantee**: asking for `'edit'` on a resource whose
 * schema has no edit view yields an unlinked chip rather than a broken one. Everything else —
 * `size`, `variant`, `color`, `icon`, `linkMode`, `dialogWidth` — is the admin chip's and passes
 * through untouched.
 *
 * Note the default: **`link` defaults to `false` here**, so a chip links only when asked.
 */
const meta = {
  title: 'schema/fields/SchemaRecordRepresentationChip',
  component: SchemaRecordRepresentationChip,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * Link resolution against the schema. `products` has both a `show` and an `edit` view, so both
 * requests link; `false` is the component's own default and renders a plain chip.
 */
export const LinkResolution: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaRecordRepresentationChip — link'}>
      <Showcase caption={'link: false (the default) → a plain chip'}>
        <SchemaRecordRepresentationChip link={false} />
      </Showcase>
      <Showcase caption={"link: true → the resource's default view"}>
        <SchemaRecordRepresentationChip link />
      </Showcase>
      <Showcase caption={"link: 'show'"}>
        <SchemaRecordRepresentationChip link={'show'} />
      </Showcase>
      <Showcase caption={"link: 'edit'"}>
        <SchemaRecordRepresentationChip link={'edit'} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** The admin chip's own appearance props, passed straight through. */
export const Appearance: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaRecordRepresentationChip — appearance'}>
      {(['soft', 'filled', 'outlined'] as const).map((variant) => (
        <Showcase key={variant} caption={`variant: '${variant}' — small, then medium`}>
          <SchemaRecordRepresentationChip link={false} variant={variant} size={'small'} />
          <SchemaRecordRepresentationChip link={false} variant={variant} size={'medium'} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * A long representation string against a `maxWidth` — the chip truncates rather than stretching the
 * column it sits in. This is the path a datagrid cell uses.
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
    <ShowcaseStack title={'SchemaRecordRepresentationChip — maxWidth'}>
      <Showcase caption={'no maxWidth'}>
        <SchemaRecordRepresentationChip link={false} />
      </Showcase>
      <Showcase caption={'maxWidth: 200'}>
        <SchemaRecordRepresentationChip link={false} maxWidth={200} />
      </Showcase>
    </ShowcaseStack>
  ),
};
