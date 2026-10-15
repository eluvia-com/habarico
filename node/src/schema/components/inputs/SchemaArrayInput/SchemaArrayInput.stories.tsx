import React from 'react';
import {CATEGORIES_RESOURCE, PRODUCT_TAGS, productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaInputShell} from '@schema/components/_storyKit';
import {FieldSchemaProvider} from '@schema/contexts/FieldSchemaContext';
import type {FieldSchema, ItemFieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaArrayInput} from './SchemaArrayInput';

const TAGS = productField('tags');
const RELATED = productField('related_category_ids');

// The item schemas the dispatcher branches on. `items` is what decides the editor — the array field
// itself is always just `type: 'array'`.
const CHOICES_ITEMS: ItemFieldSchema = {type: 'string', format: 'choices', enum: PRODUCT_TAGS};
const RELATION_ITEMS: ItemFieldSchema = {
  type: 'integer',
  format: 'relation',
  reference: CATEGORIES_RESOURCE,
};
const TREE_ITEMS: ItemFieldSchema = {
  type: 'integer',
  format: 'tree-relation',
  reference: CATEGORIES_RESOURCE,
};
const PLAIN_ITEMS: ItemFieldSchema = {type: 'string'};

/**
 * `SchemaArrayInput` reads `useFieldSchemaContext` for the item's icon registry, so it has to be
 * mounted under a `FieldSchemaProvider` — in the real form `SchemaInput` supplies one. A story that
 * mounts the dispatcher directly brings its own.
 */
const ArrayInput = ({
  schema,
  items,
  ...props
}: {schema: FieldSchema; items: ItemFieldSchema} & Record<string, unknown>) => (
  <FieldSchemaProvider schema={schema}>
    <SchemaArrayInput source={schema.name} label={schema.label} items={items} {...props} />
  </FieldSchemaProvider>
);

/**
 * The **multi-value editor dispatcher** — what a schema's `type: 'array'` resolves to in write mode,
 * and the input counterpart of `SchemaReferenceArrayField` / the chip array field.
 *
 * It decides nothing by itself: it reads the **item** schema (`items`, not the field) and delegates,
 * in this order:
 *
 * 1. **`items.reference` set** → `SchemaReferenceArrayInput`, a fetched multi-select. Within that
 *    branch, `items.format: 'tree-relation'` splits off again into `SchemaTreeReferenceArrayInput` —
 *    a checkbox tree resolved in one go through `useTreeChoices`, deliberately *outside* React
 *    Admin's `ReferenceArrayInput`, since the tree takes flat `choices` and needs no reference
 *    context. Everything else in the branch is an `AutocompleteArrayInput` that filters server-side.
 * 2. **`items.format: 'choices'` with an `enum`** → `ChoicesArrayInput`, the presentational enum
 *    multi-select. The whole rendering lives in the admin layer; the schema layer only passes the
 *    enum through, plus `items.options.choices.iconsKey` for the icon registry.
 * 3. **anything else** → a plain `TextInput` that parses a comma-separated string into an array.
 *    Not a fallback to *nothing*: an array of bare strings stays editable.
 *
 * `options.relation.showCreateButton` on the reference branch puts a `SchemaCreateButton` next to
 * the picker, gated — like the single-value picker — by the referenced resource's own schema.
 */
const meta = {
  title: 'schema/inputs/SchemaArrayInput',
  component: SchemaArrayInput,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The three branches side by side, each driven only by its item schema. */
export const InputTypes: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaArrayInput — dispatch by item schema'}>
      <Showcase caption={"items.format: 'choices' + enum → ChoicesArrayInput"}>
        <ArrayInput schema={TAGS} items={CHOICES_ITEMS} />
      </Showcase>
      <Showcase caption={'items.reference → SchemaReferenceArrayInput (autocomplete, fetched)'}>
        <ArrayInput schema={RELATED} items={RELATION_ITEMS} />
      </Showcase>
      <Showcase caption={'neither → TextInput parsing a comma-separated list'}>
        <ArrayInput schema={{...TAGS, label: 'Keywords'}} items={PLAIN_ITEMS} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** The enum branch on its own — the record's tags preselected as removable chips. */
export const Choices: Story = {
  render: () => <ArrayInput schema={TAGS} items={CHOICES_ITEMS} />,
};

/**
 * The reference branch. Choices come from the referenced resource, not from the schema, so typing
 * filters server-side; the record's related categories start selected.
 */
export const Reference: Story = {
  render: () => <ArrayInput schema={RELATED} items={RELATION_ITEMS} />,
};

/**
 * `items.format: 'tree-relation'` inside the reference branch — a checkbox tree instead of an
 * autocomplete, built from the whole reference list at once. The fixture's categories are a real
 * hierarchy (`parent_id`), so the nesting is the schema's, not the story's.
 */
export const TreeReference: Story = {
  render: () => <ArrayInput schema={RELATED} items={TREE_ITEMS} />,
};

/**
 * The create shortcut on the reference branch. `categories` has no `create` view in the fixture
 * schema, so the button stays hidden even with the option on — the referenced resource's schema has
 * the last word, exactly as on the single-value `SchemaReferenceInput`.
 */
export const CreateShortcut: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaArrayInput — options.relation.showCreateButton'}>
      <Showcase caption={'showCreateButton: false'}>
        <ArrayInput schema={RELATED} items={RELATION_ITEMS} />
      </Showcase>
      <Showcase caption={'showCreateButton: true — gated by the target schema'}>
        <ArrayInput
          schema={RELATED}
          items={{...RELATION_ITEMS, options: {relation: {showCreateButton: true}}}}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** An empty form — nothing selected in any branch yet. */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 1}}},
  render: () => (
    <ShowcaseStack title={'SchemaArrayInput — no value'}>
      <Showcase caption={'choices'}>
        <ArrayInput schema={TAGS} items={CHOICES_ITEMS} />
      </Showcase>
      <Showcase caption={'reference'}>
        <ArrayInput schema={RELATED} items={RELATION_ITEMS} />
      </Showcase>
    </ShowcaseStack>
  ),
};
