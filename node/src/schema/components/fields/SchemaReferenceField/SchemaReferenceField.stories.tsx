import React from 'react';
import {CATEGORIES_RESOURCE} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaReferenceField} from './SchemaReferenceField';

/**
 * Renders a **relation** — the field a schema's `format: 'relation'` resolves to.
 *
 * It has two quite different shapes, and `targetSource` is the switch:
 *
 * - **Without `targetSource`** (the default) it renders the referenced record's *representation* —
 *   its `meta.repr`, in a `SchemaRecordRepresentationChip`. This is the usual relation rendering:
 *   one chip, optionally a link.
 * - **With `targetSource`** it renders **one named field** of the referenced record instead, through
 *   the full field dispatcher. Useful when a relation should read as a plain value (a category's
 *   `name` as text) rather than as a chip.
 *
 * Two behaviours worth knowing:
 *
 * - **It degrades to a `TextField`** when the referenced resource is not in the service schema —
 *   the raw foreign key is shown rather than an error, so a partial schema does not break a view.
 * - **Inside a collection** it renders bare (no `Labeled` wrapper) and constrains the chip to the
 *   column width; the same happens on `label={false}`, where the caller already renders the label.
 *
 * Linking is described by the schema, not decided here: `options.relation.showLink` says *whether*
 * to link and `linkMode` how the target is presented — the referenced resource's own schema then
 * decides whether that view exists at all.
 */
const meta = {
  title: 'schema/fields/SchemaReferenceField',
  component: SchemaReferenceField,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The two shapes side by side — the representation chip, then a named field of the target. */
export const ChipVsTargetSource: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaReferenceField — targetSource'}>
      <Showcase caption={'no targetSource → the representation chip'}>
        <SchemaReferenceField
          source={'category_id'}
          label={'Category'}
          reference={CATEGORIES_RESOURCE}
        />
      </Showcase>
      <Showcase caption={"targetSource: 'name' → that field of the referenced record"}>
        <SchemaReferenceField
          source={'category_id'}
          label={'Category'}
          reference={CATEGORIES_RESOURCE}
          targetSource={'name'}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** `showLink` on and off — the same value, once as a link and once as plain text. */
export const Linking: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaReferenceField — options.relation.showLink'}>
      <Showcase caption={'showLink: true'}>
        <SchemaReferenceField
          source={'category_id'}
          label={'Category'}
          reference={CATEGORIES_RESOURCE}
          options={{relation: {showLink: true}}}
        />
      </Showcase>
      <Showcase caption={'showLink: false'}>
        <SchemaReferenceField
          source={'category_id'}
          label={'Category'}
          reference={CATEGORIES_RESOURCE}
          options={{relation: {showLink: false}}}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * An unknown reference — the resource is not in the service schema, so the field falls back to a
 * plain `TextField` showing the raw foreign key.
 */
export const UnknownReference: Story = {
  render: () => (
    <SchemaReferenceField source={'category_id'} label={'Category'} reference={'shop/nothing'} />
  ),
};

/** A record whose foreign key is null — `emptyText` rather than a blank chip. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 1, category_id: null}}},
  render: () => (
    <SchemaReferenceField
      source={'category_id'}
      label={'Category'}
      reference={CATEGORIES_RESOURCE}
      emptyText={'--'}
    />
  ),
};
