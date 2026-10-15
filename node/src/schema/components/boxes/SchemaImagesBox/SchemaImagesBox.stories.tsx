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
import {withSchemaBoxShell} from '@schema/components/_storyKit';
import type {BoxSchema, ListBoxParameters} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaImagesBox} from './SchemaImagesBox';

// The images box hangs a referenced resource off the record in context, like the list and gallery
// boxes — here `products`, joined on `category_id`.
const imagesBox = (
  overrides: Partial<BoxSchema> = {},
  list: Partial<ListBoxParameters> = {}
): BoxSchema =>
  box({
    name: 'photos_box',
    type: 'list',
    label: 'Product photos',
    card: true,
    readOnly: true,
    list: {reference: PRODUCTS_RESOURCE, target: 'category_id', ...list},
    boxes: [fd('photo'), fd('name'), fd('price')],
    ...overrides,
  });

// Every story mounts on a category — a collection box needs the parent side of the relation.
const CATEGORY_CONTEXT = {
  schemaStory: {
    resource: CATEGORIES_RESOURCE,
    record: CATEGORY_RECORD,
    schema: CATEGORY_RESOURCE_SCHEMA,
    methodSchema: CATEGORY_METHOD,
  },
};

/**
 * The **image-collection box** — a related collection rendered as a grid of picture tiles with a
 * real list toolbar above it. Where `SchemaGalleryBox` is a plain tile grid, this box wraps a
 * full React Admin `List`: filters, pagination and the `SchemaImagesBoxActions` toolbar all belong
 * to it, and `SchemaImages` is only the body it renders.
 *
 * How it assembles itself:
 *
 * - **`list.reference`** names the resource; the box fetches *its* schema through the schema
 *   provider (`useGetLocalResourceSchema`) and provides it downward, which is why the tiles, the
 *   filters and the row actions are the referenced resource's and not the parent's. While that fetch
 *   is in flight the box renders the shared `Loading`; a failed fetch renders `ErrorPage`.
 * - **`list.target`** is the foreign key on the referenced side, filtered to the parent record's id;
 *   with a target set the whole list is additionally wrapped in a `ReferenceManyField`.
 * - **The picture is chosen by format, not by name.** `SchemaImages` takes the first field whose
 *   schema `format` is `base64-image`; the box's other `boxes` become the tile caption.
 * - **`list.sortable`** switches the box into manual-order mode: drag-and-drop on, pagination off
 *   (and `perPage` raised to 50), since a manual order across pages is meaningless.
 *
 * There is **no `images` `BoxType`** — `defaultBoxProvider` never dispatches here, so the component
 * is always mounted explicitly (by a customization provider, or by a story). Its three action slots
 * behave exactly like the list box's and have their own story, `schema/boxes/BoxActions`.
 *
 * The tiles are inline SVG data URIs, so the grid renders with no network.
 */
const meta = {
  title: 'schema/boxes/SchemaImagesBox',
  component: SchemaImagesBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}, ...CATEGORY_CONTEXT},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** One tile per related record, captioned with the box's own fields, under the list toolbar. */
export const Default: Story = {
  render: () => <SchemaImagesBox isRoot schema={imagesBox()} />,
};

/** Only the image descriptor — the picture grid with no caption under the tiles. */
export const ImagesOnly: Story = {
  render: () => <SchemaImagesBox isRoot schema={imagesBox({name: 'bare', boxes: [fd('photo')]})} />,
};

/**
 * `list.sortable` on — the tiles become draggable and the pagination bar disappears, because a
 * manual order that only covers the current page is not an order. `fieldName` names the column that
 * stores the position; the e-shop fixture has no dedicated order column, so `stock` stands in for
 * one here.
 */
export const Sortable: Story = {
  render: () => (
    <SchemaImagesBox
      isRoot
      schema={imagesBox({name: 'sortable'}, {sortable: {fieldName: 'stock', sortForFilters: {}}})}
    />
  ),
};

/**
 * Card-less (`card: false`, no `label`) — the box drops its `Panel` and the grid sits directly on
 * the page, the same `BoxLayout` switch every other box has.
 */
export const CardLess: Story = {
  render: () => (
    <SchemaImagesBox isRoot schema={imagesBox({name: 'flat', label: undefined, card: false})} />
  ),
};

/** A parent with no related records — the list renders its toolbar over an empty grid. */
export const EmptyCollection: Story = {
  parameters: {
    schemaStory: {...CATEGORY_CONTEXT.schemaStory, record: {...CATEGORY_RECORD, id: 999}},
  },
  render: () => <SchemaImagesBox isRoot schema={imagesBox({name: 'empty'})} />,
};
