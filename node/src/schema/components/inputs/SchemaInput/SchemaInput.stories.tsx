import React from 'react';
import {PRODUCT_FIELDS, productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaInputShell} from '@schema/components/_storyKit';
import type {FieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaInput} from './SchemaInput';

const describe = (schema: FieldSchema) =>
  [
    `type: '${schema.type}'`,
    schema.format ? `format: '${schema.format}'` : undefined,
    schema.enum ? 'enum' : undefined,
    schema.reference ? `reference: '${schema.reference}'` : undefined,
    schema.properties ? 'properties' : undefined,
    schema.items ? 'items' : undefined,
  ]
    .filter(Boolean)
    .join(', ');

const MATRIX = PRODUCT_FIELDS.filter((schema) => schema.name !== 'id');

/**
 * The **write-side dispatcher** — the input counterpart of `SchemaField`, and the component every
 * generated form field goes through.
 *
 * Its first decision is not which input to render but **whether to render one at all**:
 *
 * - **`readOnly`** → `SchemaReadonlyInputContent`, which resolves the *field* renderer through
 *   `useGetField` and shows the value. This is not the same as `disabled`: a disabled input is
 *   still an input (greyed, focusable, part of the form), a read-only one is a rendered value.
 * - **otherwise** → `SchemaWriteonlyInputContent`, which resolves the input through `useGetInput`
 *   (per-resource provider → consumer `inputProvider` → `defaultInputProvider`) and wires the
 *   schema's validators.
 *
 * The stock mapping, as `defaultInputProvider` implements it:
 *
 * | `type` | `format` | Component |
 * | --- | --- | --- |
 * | `boolean` | — | `BooleanInput` (`TriStateBooleanInput` as a filter) |
 * | `number` | — | `NumberInput` |
 * | `integer` | — | `NumberInput` (no fraction digits) |
 * | `integer` / `string` | `relation`, `tree-relation` | `SchemaReferenceInput` |
 * | `integer` / `string` | `choices` + `enum` | `ChoicesInput` |
 * | `string` | `decimal` | `NumberInput` |
 * | `string` | `date` / `time` / `email` / `url` / `phone` / `rich-text` / … | the matching admin input |
 * | `string` | — | `TextInput` |
 * | `object` | `base64-image` / `base64-file` | `UploadInput` |
 * | `object` | `range` + all-`date` properties | `DateRangeInput` |
 * | `object` | `range` + `properties` | `SchemaRangeInput` |
 * | `object` | — + `properties` | `SchemaObjectInput` |
 * | `array` | `items.type === 'object'` + image/file format | `UploadInput` (multiple) |
 * | `array` | `items.type === 'object'` | `SchemaObjectArrayInput` |
 * | `array` | otherwise | `SchemaArrayInput` |
 *
 * Note the `range` row: a range whose properties are **all** `format: 'date'` never reaches
 * `SchemaRangeInput` — it collapses to a single `DateRangeInput` instead, because two date pickers
 * side by side is a worse calendar than one range picker.
 */
const meta = {
  title: 'schema/inputs/SchemaInput',
  component: SchemaInput,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * **The dispatch matrix** — every `type` / `format` pair the fixtures cover, rendered as an input,
 * captioned with the schema that produced it.
 */
export const InputTypes: Story = {
  parameters: {schemaStory: {width: 620}},
  render: () => (
    <ShowcaseStack title={'SchemaInput — one schema per row'}>
      {MATRIX.map((schema) => (
        <Showcase key={schema.name} caption={`${schema.name} — ${describe(schema)}`}>
          <SchemaInput schema={schema} source={schema.name} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * The split that matters: **`readOnly` is not `disabled`.** The read-only row is the field renderer
 * showing a value; the disabled row is still an input. A schema-driven form uses the first for a
 * value the user may see but not change, and the second for one that is temporarily unavailable.
 */
export const ReadOnlyVsDisabled: Story = {
  parameters: {schemaStory: {width: 620}},
  render: () => (
    <ShowcaseStack title={'SchemaInput — readOnly vs. disabled'}>
      {['name', 'price', 'status', 'released_on', 'category_id'].map((name) => (
        <Showcase key={name} caption={`${name} — writable / readOnly / disabled`}>
          <SchemaInput schema={productField(name)} source={name} />
          <SchemaInput schema={productField(name)} source={name} readOnly />
          <SchemaInput schema={productField(name)} source={name} disabled />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * `showLabel={false}` renders the input bare — the label reaches it as `label={false}`, suppressing
 * both the React Admin input label and, on the read-only branch, its `Labeled` wrapper. This is the
 * mode a box's `PropertyItem` uses, where the row already carries the label.
 */
export const LabelHandling: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaInput — showLabel'}>
      <Showcase caption={'showLabel: true (default)'}>
        <SchemaInput schema={productField('name')} source={'name'} />
      </Showcase>
      <Showcase caption={'showLabel: false — the surrounding box owns the label'}>
        <SchemaInput schema={productField('name')} source={'name'} showLabel={false} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** A required field's `helpText` and its validation message, on an empty form. */
export const HelpTextAndValidation: Story = {
  parameters: {schemaStory: {record: {id: 1}, width: 620}},
  render: () => (
    <ShowcaseStack title={'SchemaInput — helpText & required'}>
      <Showcase caption={"sku — helpText: 'Stock keeping unit.'"}>
        <SchemaInput schema={productField('sku')} source={'sku'} />
      </Showcase>
      <Showcase caption={'name — required: true'}>
        <SchemaInput schema={productField('name')} source={'name'} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** A schema the input dispatcher has no renderer for — nothing is rendered. */
export const NoRenderer: Story = {
  render: () => (
    <SchemaInput
      schema={{name: 'unknown', type: 'object', label: 'Unrenderable object'}}
      source={'unknown'}
    />
  ),
};
