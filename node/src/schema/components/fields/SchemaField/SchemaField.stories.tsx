import React from 'react';
import {PRODUCT_FIELDS, productField} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {FieldSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaField} from './SchemaField';

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

// Every fixture field except the id, which is only interesting as a key.
const MATRIX = PRODUCT_FIELDS.filter((schema) => schema.name !== 'id');

/**
 * The **read-side dispatcher** — given one `FieldSchema` it picks the component that renders it, and
 * it is the single place a schema's `type` + `format` turn into a widget.
 *
 * It resolves through `useGetField`, which consults three providers in order: a per-resource
 * `ResourceFieldProvider`, the consumer's `fieldProvider`, then `defaultFieldProvider` — so a
 * project can override the rendering of one field type without touching the schema. Around the
 * resolved element it adds `SchemaFieldContent` (label, spacing, search-highlight) and
 * `DynamicRenderWrapper` (conditional display via `options.dynamicRender`).
 *
 * The stock mapping, as `defaultFieldProvider` implements it:
 *
 * | `type` | `format` | Component |
 * | --- | --- | --- |
 * | `boolean` | *(not read)* | `BooleanField` |
 * | `number` | *(not read)* | `NumberField` (2–5 fraction digits) |
 * | `integer` / `string` | `relation`, `tree-relation` | `SchemaReferenceField` |
 * | `integer` / `string` | `choices` + `enum` | `SchemaChoicesField` |
 * | `string` | `email` / `url` / `phone` | `EmailField` / `UrlField` / `PhoneNumberField` |
 * | `string` | `date` / `date-time` / `time` | `DateField` / `DateField showTime` / `TimeField` |
 * | `string` | `rich-text` | `RichTextField` |
 * | `string` | `decimal` | `NumberField` (2–5 fraction digits) |
 * | `string` | `text` | `TextField` (multiline) |
 * | `integer` | anything else | `NumberField` (no fraction digits) |
 * | `string` | anything else | `TextField` |
 * | `object` | `base64-image` / `base64-file` | `ImageField` / `FileField` |
 * | `object` | `range` + `properties` | `SchemaRangeField` |
 * | `object` | — + `properties` | `SchemaObjectField` (detail only) |
 * | `array` | `items.type === 'object'` | `SchemaObjectArrayField` (detail only) |
 * | `array` | `items.reference` | `SchemaReferenceArrayField` |
 * | `array` | otherwise | `ChipArrayField` |
 *
 * The table is a flat projection of a **two-level** dispatch: `type` is a `switch`, and only inside
 * the `integer` / `string` / `object` / `array` cases is `format` consulted, by a run of `if`s ending
 * in a fallback — hence the *anything else* rows, which are reached by every format the rows above
 * them do not name. `boolean` and `number` have no second level at all: they never read `format`, so
 * a `number` with `format: 'relation'` is still a `NumberField`. That asymmetry with `integer` —
 * which *does* branch on `relation` and `choices` — is deliberate, not an oversight.
 *
 * Two entries are **list-aware**: the object and object-array branches return nothing inside a
 * collection, because a nested structure has no sensible single-cell rendering — which is why a
 * detail shows them and a datagrid column does not.
 */
const meta = {
  title: 'schema/fields/SchemaField',
  component: SchemaField,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * **The dispatch matrix** — every `type` / `format` pair the fixtures cover, rendered through
 * `SchemaField` against one product record. The caption above each value is the schema that
 * produced it, so the table in the description is visible rather than described.
 */
export const FieldTypes: Story = {
  parameters: {schemaStory: {width: 560}},
  render: () => (
    <ShowcaseStack title={'SchemaField — one schema per row'}>
      {MATRIX.map((schema) => (
        <Showcase key={schema.name} caption={`${schema.name} — ${describe(schema)}`}>
          <SchemaField schema={schema} source={schema.name} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * `showLabel={false}` hands the label to whatever renders the field — a box's `PropertyItem`, say.
 * It reaches the underlying field as `label={false}`, not just as a skipped wrapper, so a field
 * that labels itself (the `targetSource` branch of `SchemaReferenceField`) does not duplicate it.
 */
export const LabelHandling: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaField — showLabel'}>
      <Showcase caption={'showLabel: true (default)'}>
        <SchemaField schema={productField('name')} source={'name'} />
      </Showcase>
      <Showcase caption={'showLabel: false — the surrounding box owns the label'}>
        <SchemaField schema={productField('name')} source={'name'} showLabel={false} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * A record with nothing in it: each field falls back to `emptyText` rather than rendering blank, so
 * a detail keeps its shape when data is missing.
 */
export const EmptyValues: Story = {
  parameters: {schemaStory: {record: {id: 1}, width: 560}},
  render: () => (
    <ShowcaseStack title={'SchemaField — empty record'}>
      {['name', 'price', 'released_on', 'support_email', 'status'].map((name) => (
        <Showcase key={name} caption={name}>
          <SchemaField schema={productField(name)} source={name} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * A field the dispatcher has **no** renderer for — an `object` with no `properties` and no
 * recognised format. `SchemaField` renders nothing at all rather than an error or an empty label.
 */
export const NoRenderer: Story = {
  render: () => (
    <SchemaField
      schema={{name: 'unknown', type: 'object', label: 'Unrenderable object'}}
      source={'unknown'}
    />
  ),
};
