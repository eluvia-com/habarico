import React from 'react';
import {ListContextProvider, useList} from 'react-admin';
import {PRODUCTS, PRODUCTS_RESOURCE, fd, habRecord} from '@schema/components/_data';
import {withSchemaFieldShell} from '@schema/components/_storyKit';
import type {HabRecord} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaImages, type SchemaImagesProps} from './SchemaImages';

// The gallery picks its picture out of the method schema by `format: 'base64-image'` — on the
// product fixture that is `photo`. The rest of the descriptors become the tile caption, so they are
// listed explicitly: with `fields` unset the caption would be every remaining product field.
const GALLERY_FIELDS = [fd('photo'), fd('name'), fd('price')];

const RECORDS: HabRecord[] = PRODUCTS.map((product) => habRecord(PRODUCTS_RESOURCE, product));

// A manual order carried on the records themselves — `indexField` names it, and dropping a tile
// writes the new position back through the data provider.
const ORDERED_RECORDS: HabRecord[] = RECORDS.map((record, index) => ({...record, position: index}));

// Hoisted, not written inline: `useList` takes `sort` as its *initial* value and re-seeds itself
// when the object's identity changes, so a literal rebuilt on every render fights the gallery's own
// `setSort` effect in an endless loop.
const BY_ID = {field: 'id', order: 'ASC'} as const;
const BY_POSITION = {field: 'position', order: 'ASC'} as const;

const BROKEN_RECORDS: HabRecord[] = [
  {...RECORDS[0], photo: {url: 'https://example.invalid/missing.png', filename: 'missing.png'}},
  ...RECORDS.slice(1),
];

/**
 * Renders the list in context as a **grid of image tiles** instead of a datagrid — the collection
 * renderer behind `SchemaGalleryBox` and the images box.
 *
 * It finds its picture by **format, not by name**: the first field whose schema `format` is
 * `base64-image` becomes the tile image, and every *other* field resolved from `fields` is rendered
 * under it as a caption (through `SchemaFieldContent`, in compact collection mode). With no
 * `base64-image` field in the schema at all the component renders **nothing** — not an empty grid.
 *
 * Clicking a tile opens the picture full-size in a dialog. A URL that fails to load falls back to a
 * broken-image icon, in the tile and in the dialog alike, instead of the browser's broken-image
 * glyph.
 *
 * Each tile carries the resource's own detail actions (`SchemaButtons`, `scope: 'detail'`), which is
 * why a tile has buttons without the story wiring any.
 *
 * **Drag to reorder** is opt-in and deliberately narrow: it turns on only when `indexField` is set,
 * the list is sorted by that field ascending, and the active filters match `sortForFilters` — a
 * manual order is meaningless under a different sort or a partial filter. Dropping a tile writes the
 * new position with `dataProvider.update` and refetches.
 *
 * The tiles here are inline SVG data URIs, so the gallery renders with no network.
 */
const meta = {
  title: 'schema/collections/SchemaImages',
  component: SchemaImages,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}, schemaStory: {width: 720}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * Boots a client-side list context over static rows — the gallery reads `useListContext`, which in
 * the real admin comes from the list view or the box around it.
 */
const Gallery = ({
  records,
  sort = BY_ID,
  ...props
}: SchemaImagesProps & {records: HabRecord[]; sort?: {field: string; order: 'ASC' | 'DESC'}}) => {
  const listContext = useList<HabRecord>({data: records, sort, resource: PRODUCTS_RESOURCE});
  return (
    <ListContextProvider value={listContext}>
      <SchemaImages {...props} />
    </ListContextProvider>
  );
};

/** One tile per record: the `base64-image` field as the picture, the rest as its caption. */
export const Default: Story = {
  render: () => <Gallery records={RECORDS} fields={GALLERY_FIELDS} />,
};

/** Only the image descriptor — the picture grid on its own, with no caption under the tiles. */
export const ImagesOnly: Story = {
  render: () => <Gallery records={RECORDS} fields={[fd('photo')]} />,
};

/**
 * `indexField` set — the tiles become draggable. Drag one onto another to reorder; the drop writes
 * the new `position` through the data provider.
 *
 * The gallery does not *wait* for the right sort: with `indexField` set and the filters matching, it
 * **forces** the list onto that field ascending. Switching dragging off is the filter precondition
 * below, not a different sort.
 */
export const Draggable: Story = {
  render: () => (
    <Gallery
      records={ORDERED_RECORDS}
      fields={GALLERY_FIELDS}
      indexField={'position'}
      sort={BY_POSITION}
    />
  ),
};

/**
 * The same `indexField`, but `sortForFilters` says the manual order is only meaningful under
 * `status: published` — and the list is unfiltered. The precondition fails, so nothing is forced and
 * the tiles do not drag.
 */
export const DragDisabledByFilters: Story = {
  render: () => (
    <Gallery
      records={ORDERED_RECORDS}
      fields={GALLERY_FIELDS}
      indexField={'position'}
      sortForFilters={{status: 'published'}}
    />
  ),
};

/**
 * The first record's image URL cannot be loaded — its tile falls back to a broken-image icon beside
 * the tiles that render normally. Open it to see the dialog fall back the same way.
 */
export const BrokenImage: Story = {
  render: () => <Gallery records={BROKEN_RECORDS} fields={GALLERY_FIELDS} />,
};
