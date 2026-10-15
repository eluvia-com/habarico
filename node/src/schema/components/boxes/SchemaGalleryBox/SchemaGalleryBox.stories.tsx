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
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxSchema, GalleryBoxParameters} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaGalleryBox} from './SchemaGalleryBox';

// Like the list box, a gallery hangs a referenced resource off the record in context — but renders
// it as image tiles instead of a datagrid, keyed by `gallery.imageField`.
const galleryBox = (
  overrides: Partial<BoxSchema> = {},
  gallery: Partial<GalleryBoxParameters> = {}
): BoxSchema =>
  box({
    name: 'gallery_box',
    type: 'gallery',
    label: 'Product photos',
    readOnly: true,
    gallery: {reference: PRODUCTS_RESOURCE, target: 'category_id', imageField: 'photo', ...gallery},
    boxes: [fd('name'), fd('price')],
    ...overrides,
  });

const CATEGORY_CONTEXT = {
  schemaStory: {
    resource: CATEGORIES_RESOURCE,
    record: CATEGORY_RECORD,
    schema: CATEGORY_RESOURCE_SCHEMA,
    methodSchema: CATEGORY_METHOD,
  },
};

/**
 * The **image-grid collection** — the same related-collection idea as `SchemaListBox`, rendered as
 * tiles instead of rows.
 *
 * `gallery.imageField` is what separates it from the list box: it names the field on the
 * *referenced* resource that holds the picture (`products.photo`, a `base64-image`). The box's
 * `boxes` are then the caption shown under each tile, not columns.
 *
 * The rest is the list box's contract: `gallery.reference` names the resource and the box fetches
 * its schema through the schema provider, `gallery.target` is the foreign key it filters on, and
 * the record in context supplies the id. `SchemaGalleryBox` **throws** without a `gallery` block —
 * unlike the object / array boxes, which render nothing when their target does not resolve.
 *
 * The tiles here are inline SVG data URIs, so the gallery renders with no network.
 */
const meta = {
  title: 'schema/boxes/SchemaGalleryBox',
  component: SchemaGalleryBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}, ...CATEGORY_CONTEXT},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** One tile per related record, captioned with the box's own fields. */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={galleryBox()} />,
};

/** A tile with no caption fields at all — the image grid on its own. */
export const ImagesOnly: Story = {
  render: () => <SchemaBox isRoot schema={galleryBox({name: 'bare', boxes: []})} />,
};

/** A parent with no related records — the gallery's empty state. */
export const EmptyCollection: Story = {
  parameters: {
    schemaStory: {...CATEGORY_CONTEXT.schemaStory, record: {...CATEGORY_RECORD, id: 999}},
  },
  render: () => <SchemaBox isRoot schema={galleryBox({name: 'empty'})} />,
};

/**
 * `imageField` naming a field that is not an image. The tile has no picture to draw — the caption
 * fields still render, so a mis-typed `imageField` shows up as a gallery of blanks rather than an
 * error.
 */
export const WrongImageField: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaGalleryBox — imageField'}>
      <SchemaBox isRoot schema={galleryBox({name: 'ok', label: "imageField: 'photo'"})} />
      <SchemaBox
        isRoot
        schema={galleryBox({name: 'wrong', label: "imageField: 'name'"}, {imageField: 'name'})}
      />
    </ShowcaseStack>
  ),
};
