import React from 'react';
import {
  CATEGORIES_RESOURCE,
  CATEGORY_METHOD,
  CATEGORY_RECORD,
  CATEGORY_RESOURCE_SCHEMA,
  PRODUCTS_RESOURCE,
  box,
  fd,
} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import type {BoxSchema, BoxType} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaBox} from './SchemaBox';

// One box schema per type, all rendered through the dispatcher. The two collection types need a
// parent record with a one-to-many, so they are shown in the category context further down.
const BOXES: {type: BoxType; caption: string; schema: BoxSchema}[] = [
  {
    type: 'simple',
    caption: "type: 'simple' → SchemaSimpleBox (also the fallback for any unknown type)",
    schema: box({
      name: 'b_simple',
      type: 'simple',
      label: 'Simple',
      boxes: [fd('name'), fd('sku')],
    }),
  },
  {
    type: 'grid',
    caption: "type: 'grid' → SchemaGridBox",
    schema: box({
      name: 'b_grid',
      type: 'grid',
      label: 'Grid',
      boxes: [
        box({name: 'b_grid_a', type: 'simple', label: 'Left', boxes: [fd('name')]}),
        box({name: 'b_grid_b', type: 'simple', label: 'Right', boxes: [fd('price')]}),
      ],
    }),
  },
  {
    type: 'tab',
    caption: "type: 'tab' → SchemaTabBox",
    schema: box({
      name: 'b_tab',
      type: 'tab',
      boxes: [
        box({name: 'b_tab_a', type: 'tab-item', label: 'Identity', boxes: [fd('name'), fd('sku')]}),
        box({name: 'b_tab_b', type: 'tab-item', label: 'Pricing', boxes: [fd('price')]}),
      ],
    }),
  },
  {
    type: 'wizard',
    caption: "type: 'wizard' → SchemaWizardBox",
    schema: box({
      name: 'b_wizard',
      type: 'wizard',
      wizard: {showToolbarNavigation: false},
      boxes: [
        box({name: 'b_wiz_a', type: 'tab-item', label: 'Step 1', boxes: [fd('name')]}),
        box({name: 'b_wiz_b', type: 'tab-item', label: 'Step 2', boxes: [fd('price')]}),
      ],
    }),
  },
  {
    type: 'object',
    caption: "type: 'object' → SchemaObjectBox (target must carry `properties`)",
    schema: box({
      name: 'b_object',
      type: 'object',
      label: 'Dimensions',
      object: {target: 'dimensions'},
      boxes: [fd('width'), fd('height'), fd('depth')],
    }),
  },
  {
    type: 'array',
    caption: "type: 'array' → SchemaArrayBox (target must carry `items.properties`)",
    schema: box({
      name: 'b_array',
      type: 'array',
      label: 'Variants',
      array: {target: 'variants', inline: true},
      boxes: [fd('sku'), fd('size'), fd('stock')],
    }),
  },
];

const CATEGORY_CONTEXT = {
  resource: CATEGORIES_RESOURCE,
  record: CATEGORY_RECORD,
  schema: CATEGORY_RESOURCE_SCHEMA,
  methodSchema: CATEGORY_METHOD,
};

/**
 * The **box dispatcher** — the single entry point every box in a view goes through. It does three
 * things and delegates everything else:
 *
 * 1. Resolves the box component for `schema.type` via `useGetBox` — the consumer's `boxProvider`
 *    first, then `defaultBoxProvider`. This is the extension point: a project can replace any box
 *    type, or add rendering for a type the free package does not handle.
 * 2. Wraps the result in `DynamicRenderWrapper`, so `options.dynamicRender.showQuery` can hide the
 *    whole box based on the current record.
 * 3. Renders **nothing** when the provider returns no element.
 *
 * The default mapping is exactly:
 *
 * | `schema.type` | Component |
 * | --- | --- |
 * | `list` | `SchemaListBox` |
 * | `gallery` | `SchemaGalleryBox` |
 * | `object` | `SchemaObjectBox` |
 * | `array` | `SchemaArrayBox` — or `SchemaChoicesArrayBox` when `array.listed` is set |
 * | `grid` | `SchemaGridBox` |
 * | `tab` | `SchemaTabBox` |
 * | `wizard` | `SchemaWizardBox` |
 * | *anything else* | `SchemaSimpleBox` |
 *
 * Note the last row: `simple` is not a case in the switch but its **default**, so `tab-item` and
 * any unrecognised type render as a simple box. That is what makes a tab item an ordinary box able
 * to hold any other box.
 */
const meta = {
  title: 'schema/boxes/SchemaBox',
  component: SchemaBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * **The dispatch matrix** — one box schema per `BoxType`, all rendered through `SchemaBox`, so the
 * table above is visible rather than described. The two collection types need a parent record and
 * are in the next story.
 */
export const BoxTypes: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaBox — one schema per BoxType'}>
      {BOXES.map(({type, caption, schema}) => (
        <Showcase key={type} caption={caption}>
          <SchemaBox isRoot schema={schema} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/**
 * The collection types, which resolve a *referenced* resource rather than the record's own fields —
 * so they are mounted on a category, whose products are the collection.
 */
export const CollectionTypes: Story = {
  parameters: {schemaStory: CATEGORY_CONTEXT},
  render: () => (
    <ShowcaseStack title={'SchemaBox — collection box types'}>
      <Showcase caption={"type: 'list' → SchemaListBox"}>
        <SchemaBox
          isRoot
          schema={box({
            name: 'b_list',
            type: 'list',
            label: 'Products',
            readOnly: true,
            list: {reference: PRODUCTS_RESOURCE, target: 'category_id'},
            boxes: [fd('name'), fd('price')],
          })}
        />
      </Showcase>
      <Showcase caption={"type: 'gallery' → SchemaGalleryBox"}>
        <SchemaBox
          isRoot
          schema={box({
            name: 'b_gallery',
            type: 'gallery',
            label: 'Photos',
            readOnly: true,
            gallery: {
              reference: PRODUCTS_RESOURCE,
              target: 'category_id',
              imageField: 'photo',
            },
            boxes: [fd('name')],
          })}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `array.listed` routes the **same** `array` type to a different component — `SchemaChoicesArrayBox`,
 * the enum checklist — instead of `SchemaArrayBox`. The only box type whose target parameters, not
 * its type, decide the component.
 */
export const ListedArraySplit: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaBox — array.listed picks a different component'}>
      <Showcase caption={"array: {target: 'variants'} → SchemaArrayBox"}>
        <SchemaBox
          isRoot
          schema={box({
            name: 'split_plain',
            type: 'array',
            label: 'Variants',
            array: {target: 'variants', inline: true},
            boxes: [fd('sku'), fd('size')],
          })}
        />
      </Showcase>
      <Showcase caption={"array: {target: 'tags', listed: …} → SchemaChoicesArrayBox"}>
        <SchemaBox
          isRoot
          schema={box({
            name: 'split_listed',
            type: 'array',
            label: 'Tags',
            array: {target: 'tags', listed: {fieldName: 'tags'}},
            boxes: [fd('tags')],
          })}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * An unrecognised type falls through to `SchemaSimpleBox` — the dispatcher's default branch. A
 * schema naming a box type the free package does not implement degrades to a plain field list
 * rather than rendering nothing.
 */
export const UnknownTypeFallsBack: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={box({
        name: 'unknown',
        type: 'not-a-box-type' as BoxType,
        label: "type: 'not-a-box-type' → SchemaSimpleBox",
        boxes: [fd('name'), fd('sku')],
      })}
    />
  ),
};
