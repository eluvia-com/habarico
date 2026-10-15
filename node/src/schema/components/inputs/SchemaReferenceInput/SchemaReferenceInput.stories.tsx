import React from 'react';
import {CATEGORIES_RESOURCE} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaInputShell} from '@schema/components/_storyKit';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaReferenceInput} from './SchemaReferenceInput';

/**
 * The **relation picker** — what a schema's `format: 'relation'` resolves to in write mode, and the
 * input counterpart of `SchemaReferenceField`.
 *
 * It is a React Admin `ReferenceInput` wrapping our `AutocompleteInput`, so the choices are fetched
 * from the referenced resource rather than declared in the schema — typing filters server-side.
 * What the schema layer adds on top is the **shortcuts**: `options.relation.showCreateButton` and
 * `showEditButton` put a `SchemaCreateButton` / `SchemaEditButton` next to the picker, so a missing
 * related record can be created without leaving the form. Both are still gated by the referenced
 * resource's own schema — a resource with no `create` view offers no create shortcut however the
 * option is set.
 *
 * `options.relation.filters` and `sort` are passed through to the fetch, which is how a picker is
 * narrowed to a subset of the referenced resource.
 */
const meta = {
  title: 'schema/inputs/SchemaReferenceInput',
  component: SchemaReferenceInput,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The plain picker, with the record's current category selected. */
export const Default: Story = {
  render: () => (
    <SchemaReferenceInput
      source={'category_id'}
      label={'Category'}
      reference={CATEGORIES_RESOURCE}
    />
  ),
};

/**
 * The create / edit shortcuts. `categories` has a `show` view but no `create` or `edit` in the
 * fixture schema — so the buttons stay hidden even with the options on, which is the point: the
 * referenced resource's schema has the last word.
 */
export const Shortcuts: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaReferenceInput — options.relation shortcuts'}>
      <Showcase caption={'showCreateButton: false, showEditButton: false'}>
        <SchemaReferenceInput
          source={'category_id'}
          label={'Category'}
          reference={CATEGORIES_RESOURCE}
        />
      </Showcase>
      <Showcase caption={'showCreateButton / showEditButton: true — gated by the target schema'}>
        <SchemaReferenceInput
          source={'category_id'}
          label={'Category'}
          reference={CATEGORIES_RESOURCE}
          options={{relation: {showCreateButton: true, showEditButton: true}}}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** An empty form — nothing selected yet. */
export const NoSelection: Story = {
  parameters: {schemaStory: {record: {id: 1}}},
  render: () => (
    <SchemaReferenceInput
      source={'category_id'}
      label={'Category'}
      reference={CATEGORIES_RESOURCE}
    />
  ),
};

/** Disabled — still an input, unlike a read-only value. */
export const Disabled: Story = {
  render: () => (
    <SchemaReferenceInput
      source={'category_id'}
      label={'Category'}
      reference={CATEGORIES_RESOURCE}
      disabled
    />
  ),
};
