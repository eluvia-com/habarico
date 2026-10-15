import React from 'react';
import {ChipArrayField} from '@admin/components/fields/ChipArrayField';
import {TextField} from '@admin/components/fields/TextField';
import {PRODUCT_RECORD, PRODUCT_TAGS, productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaFieldContent} from './SchemaFieldContent';

// The two sides of the highlight rule, picked off the shared product fixture: `name` renders
// through `TextField` (self-highlighting), `tags` through `ChipArrayField` (not).
const NAME = productField('name');
const TAGS = productField('tags');

// The `meta.highlights` sidecar a *searched* list record carries. `value` is the backend's own
// marked-up copy of the value — what a self-highlighting field renders instead of the raw one.
const HIGHLIGHTED_RECORD = {
  ...PRODUCT_RECORD,
  meta: {
    ...PRODUCT_RECORD.meta,
    highlights: [
      {name: 'name', value: 'Mechanical <mark>Keyboard</mark> K2', label: 'Name'},
      {name: 'tags', value: 'Bestseller, <mark>New</mark> arrival', label: 'Tags'},
    ],
  },
};

/**
 * The schema layer's wrapper around **every rendered field** — `SchemaField` resolves which field
 * component to mount, this is the chrome it mounts it in. Three things happen here and nowhere
 * else:
 *
 * - **The label.** With `showLabel` (the default) the value is wrapped in React Admin's `Labeled`,
 *   using the label the *field component* carries, not the schema's. A field whose schema has a
 *   `targetSource` (a value pulled out of a related record) is never labelled — the box around it
 *   already says what it is.
 * - **Detail chrome vs. compact.** On a detail view the wrapper adds block padding and a 78px
 *   min-height, so a read value lines up with the inputs of the matching edit form. Inside a
 *   collection or a nested value (`ValueLocationContext`), or with `showLabel={false}`, that chrome
 *   is dropped and the value sits compactly next to its label.
 * - **The search-highlight fallback.** When the record carries a `meta.highlights` entry for this
 *   field, the whole rendered value is wrapped in one inline `<mark>` — *unless* the field
 *   component is tagged `selfHighlightingField`, in which case it is left alone to render its own
 *   offset-accurate mark. `TextField`, `NumberField`, `EmailField`, `UrlField`, `PhoneNumberField`
 *   and their `Schema*` adapters are tagged; everything else is not.
 *
 * It also provides the `FieldSchemaContext` the rendered field reads its own schema from.
 */
const meta = {
  title: 'schema/fields/SchemaFieldContent',
  component: SchemaFieldContent,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * The plain detail case — label above the value, the block padding and min-height that keep a read
 * view aligned with its edit form.
 */
export const Default: Story = {
  render: () => (
    <SchemaFieldContent schema={NAME} source={'name'}>
      <TextField source={'name'} label={'Name'} />
    </SchemaFieldContent>
  ),
};

/**
 * `showLabel={false}` drops both the label and the detail chrome — the compact form used wherever
 * the label lives outside the value (a `PropertyItem` value slot, a datagrid cell, a nested box).
 */
export const WithoutLabel: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaFieldContent — chrome'}>
      <Showcase caption={'showLabel (default) — labelled, 78px min-height, block padding'}>
        <SchemaFieldContent schema={NAME} source={'name'}>
          <TextField source={'name'} label={'Name'} />
        </SchemaFieldContent>
      </Showcase>
      <Showcase caption={'showLabel={false} — bare value, no reserved height'}>
        <SchemaFieldContent schema={NAME} source={'name'} showLabel={false}>
          <TextField source={'name'} label={'Name'} />
        </SchemaFieldContent>
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * The highlight rule, both branches side by side on the **same** record. `name` renders through
 * `TextField`, which is tagged `selfHighlightingField` — it draws the backend's `<mark>` inline, so
 * only the matched word is marked. `tags` renders through `ChipArrayField`, which is not tagged: an
 * array of discrete chips has no single substring to mark, so the fallback here wraps the *entire*
 * chip row in one mark.
 */
export const SearchHighlight: Story = {
  parameters: {schemaStory: {record: HIGHLIGHTED_RECORD}},
  render: () => (
    <ShowcaseStack title={'SchemaFieldContent — search highlight'}>
      <Showcase caption={'TextField — selfHighlightingField, marks the matched word only'}>
        <SchemaFieldContent schema={NAME} source={'name'}>
          <TextField source={'name'} label={'Name'} />
        </SchemaFieldContent>
      </Showcase>
      <Showcase caption={'ChipArrayField — not tagged, the whole rendered value is marked'}>
        <SchemaFieldContent schema={TAGS} source={'tags'}>
          <ChipArrayField source={'tags'} choices={PRODUCT_TAGS} label={'Tags'} />
        </SchemaFieldContent>
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * No `meta.highlights` entry for the field — nothing is marked, whichever component renders the
 * value. The same two fields as above, on the unsearched record.
 */
export const NoHighlight: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaFieldContent — unsearched record'}>
      <Showcase caption={'TextField'}>
        <SchemaFieldContent schema={NAME} source={'name'}>
          <TextField source={'name'} label={'Name'} />
        </SchemaFieldContent>
      </Showcase>
      <Showcase caption={'ChipArrayField'}>
        <SchemaFieldContent schema={TAGS} source={'tags'}>
          <ChipArrayField source={'tags'} choices={PRODUCT_TAGS} label={'Tags'} />
        </SchemaFieldContent>
      </Showcase>
    </ShowcaseStack>
  ),
};
