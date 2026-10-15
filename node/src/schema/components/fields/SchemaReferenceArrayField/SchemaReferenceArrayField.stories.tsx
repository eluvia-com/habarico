import React from 'react';
import {CATEGORIES_RESOURCE, productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {ItemFieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaReferenceArrayField} from './SchemaReferenceArrayField';

const RELATION_ITEMS = productField('related_category_ids').items as ItemFieldSchema;

const TREE_ITEMS: ItemFieldSchema = {...RELATION_ITEMS, format: 'tree-relation'};

/**
 * Renders an **array of relations** — the field an `array` schema whose `items.reference` is set
 * resolves to. Where `SchemaReferenceField` shows one referenced record, this one shows many.
 *
 * The default rendering is a `SingleFieldList` of `SchemaRecordRepresentationChip`s — one chip per
 * referenced record, each linking the same way a single relation would.
 *
 * `items.format` splits it in two:
 *
 * - **`relation`** → the chip list, everywhere.
 * - **`tree-relation`** → `SchemaTreeReferenceArrayField`, **but only outside a collection**. The
 *   tree field reads its checked ids off the ambient record and takes its choices from
 *   `useTreeChoices`, so it needs no list context — and inside a datagrid cell a tree has nowhere
 *   to unfold, so the chip list is used there instead.
 *
 * Like the single-relation field it **degrades to a `TextField`** when the referenced resource is
 * missing from the service schema, rather than failing.
 */
const meta = {
  title: 'schema/fields/SchemaReferenceArrayField',
  component: SchemaReferenceArrayField,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The chip list — one chip per referenced record. */
export const ChipList: Story = {
  render: () => (
    <SchemaReferenceArrayField
      source={'related_category_ids'}
      label={'Related categories'}
      items={RELATION_ITEMS}
    />
  ),
};

/** `items.format: 'tree-relation'` in a detail view — the tree rendering rather than chips. */
export const TreeRelation: Story = {
  render: () => (
    <SchemaReferenceArrayField
      source={'related_category_ids'}
      label={'Related categories'}
      items={TREE_ITEMS}
    />
  ),
};

/** An empty array, and a record with the field missing altogether. */
export const EmptyValues: Story = {
  parameters: {schemaStory: {record: {id: 3, related_category_ids: []}}},
  render: () => (
    <ShowcaseStack title={'SchemaReferenceArrayField — nothing referenced'}>
      <Showcase caption={'related_category_ids: []'}>
        <SchemaReferenceArrayField
          source={'related_category_ids'}
          label={'Related categories'}
          items={RELATION_ITEMS}
          emptyText={'--'}
        />
      </Showcase>
      <Showcase caption={'field absent from the record'}>
        <SchemaReferenceArrayField
          source={'missing_ids'}
          label={'Missing'}
          items={RELATION_ITEMS}
          emptyText={'--'}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** An unknown reference — the plain `TextField` fallback. */
export const UnknownReference: Story = {
  render: () => (
    <SchemaReferenceArrayField
      source={'related_category_ids'}
      label={'Related categories'}
      items={{...RELATION_ITEMS, reference: `${CATEGORIES_RESOURCE}_missing`}}
    />
  ),
};
