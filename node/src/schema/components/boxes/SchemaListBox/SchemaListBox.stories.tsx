import React from 'react';
import {
  CATEGORIES_RESOURCE,
  CATEGORY_METHOD,
  CATEGORY_RECORD,
  CATEGORY_RESOURCE_SCHEMA,
  INLINE_ACTION,
  PRODUCTS_RESOURCE,
  box,
  fd,
} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxSchema, ListBoxParameters} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaListBox} from './SchemaListBox';

// A list box hangs a *referenced* resource off the record in context. Here the record is a category
// and the reference is `products`, joined on `category_id` — the fixture's one-to-many.
const listBox = (
  overrides: Partial<BoxSchema> = {},
  list: Partial<ListBoxParameters> = {}
): BoxSchema =>
  box({
    name: 'products_box',
    type: 'list',
    label: 'Products',
    readOnly: true,
    list: {reference: PRODUCTS_RESOURCE, target: 'category_id', ...list},
    boxes: [fd('name'), fd('sku'), fd('price')],
    ...overrides,
  });

// Every story here mounts on a *category*, not the default product — a collection box needs the
// parent side of the relation.
const CATEGORY_CONTEXT = {
  schemaStory: {
    resource: CATEGORIES_RESOURCE,
    record: CATEGORY_RECORD,
    schema: CATEGORY_RESOURCE_SCHEMA,
    methodSchema: CATEGORY_METHOD,
  },
};

/**
 * The **related-collection container** — a datagrid of another resource, filtered to the record in
 * context. This is the box that turns "a category has products" into a table on the category's
 * detail.
 *
 * What it does on its own, before any configuration:
 *
 * - **Fetches the referenced resource's schema.** `list.reference` names it; the box resolves its
 *   fields, actions and views through the schema provider, which is why its columns and row buttons
 *   are the *referenced* resource's, not the parent's.
 * - **Joins on `list.target`.** The target is the foreign key on the referenced side
 *   (`products.category_id`), filtered to the parent record's id.
 * - **Falls back for its toolbar.** With `list.listActions` unset the datagrid toolbar reuses the
 *   referenced resource's `showInList` actions — the same set the per-row buttons come from, so the
 *   row buttons appear a second time above the grid. Setting `listActions` explicitly replaces that
 *   fallback.
 *
 * The three action slots (`box.toolbarActions`, `list.toolbarActions`, `list.listActions`) resolve
 * against **different** resources, and the rules are subtle enough to look like a bug — they have
 * their own dedicated story, `schema/boxes/BoxActions`.
 */
const meta = {
  title: 'schema/boxes/SchemaListBox',
  component: SchemaListBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}, ...CATEGORY_CONTEXT},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * The plain case: no action slots set at all, so everything visible is the library's own behaviour —
 * the `showInList` row buttons, and the toolbar fallback that mirrors them.
 */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={listBox()} />,
};

/** More columns, including a choice and a number — the column renderers are the schema's. */
export const Columns: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={listBox({
        name: 'wide',
        label: 'Products — more columns',
        boxes: [fd('name'), fd('sku'), fd('status'), fd('stock'), fd('price')],
      })}
    />
  ),
};

/**
 * `list.listActions` set explicitly replaces the `showInList` fallback in the datagrid toolbar —
 * here with a single inline action, which always resolves because it carries its own `action`.
 */
export const ExplicitListActions: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaListBox — datagrid toolbar'}>
      <SchemaBox
        isRoot
        schema={listBox({name: 'fallback', label: 'listActions unset → showInList fallback'})}
      />
      <SchemaBox
        isRoot
        schema={listBox(
          {name: 'explicit', label: 'listActions: [inline] → replaces the fallback'},
          {listActions: [INLINE_ACTION]}
        )}
      />
    </ShowcaseStack>
  ),
};

/** A parent with no related rows — the datagrid's own empty state, not a blank box. */
export const EmptyCollection: Story = {
  parameters: {
    schemaStory: {...CATEGORY_CONTEXT.schemaStory, record: {...CATEGORY_RECORD, id: 999}},
  },
  render: () => <SchemaBox isRoot schema={listBox({name: 'empty'})} />,
};
