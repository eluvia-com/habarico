import React from 'react';
import {ListContextProvider, useList} from 'react-admin';
import {PRODUCTS, PRODUCTS_RESOURCE, fd, habRecord} from '@schema/components/_data';
import {withSchemaFieldShell} from '@schema/components/_storyKit';
import type {HabRecord} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaDatagrid, type SchemaDatagridProps} from './SchemaDatagrid';

const RECORDS: HabRecord[] = PRODUCTS.map((product) => habRecord(PRODUCTS_RESOURCE, product));

// A manual order carried on the records, for the drag-to-reorder story.
const ORDERED_RECORDS: HabRecord[] = RECORDS.map((record, index) => ({...record, position: index}));

// The columns most stories show. With `fields` unset the datagrid renders **every** field of the
// method schema instead, which is the point of the `Default` story below.
const COLUMNS = [fd('name'), fd('sku'), fd('status'), fd('stock'), fd('price')];

// Sort payloads are hoisted, not written inline: `useList` takes `sort` as its *initial* value and
// re-seeds itself when the object's identity changes. A literal rebuilt on every render therefore
// fights the datagrid's own `setSort` effect (which forces the sort onto `indexField`) in an endless
// loop — a crash the story's error boundary swallows while the story test still passes.
const BY_ID = {field: 'id', order: 'ASC'} as const;
const BY_POSITION = {field: 'position', order: 'ASC'} as const;

type GridProps = SchemaDatagridProps & {
  records?: HabRecord[];
  sort?: {field: string; order: 'ASC' | 'DESC'};
};

/**
 * Boots a client-side list context over static rows. In the real admin that context comes from the
 * list view (`SchemaList`) or from the reference box around it (`SchemaListBox`); the datagrid
 * itself never fetches.
 */
const Grid = ({records = RECORDS, sort = BY_ID, ...props}: GridProps) => {
  const listContext = useList<HabRecord>({data: records, sort, resource: PRODUCTS_RESOURCE});
  return (
    <ListContextProvider value={listContext}>
      <SchemaDatagrid {...props} />
    </ListContextProvider>
  );
};

/**
 * The **schema-driven table** — the collection renderer behind every list view and every
 * `SchemaListBox`. It reads the rows from the surrounding list context and turns the *schema* into
 * columns: no column is ever declared as JSX.
 *
 * **Columns.** With `fields` unset it renders one column per field of the method schema, in schema
 * order. Pass `fields` to pick and order them. Three kinds of descriptor are understood:
 *
 * - a plain **field** (`{type: 'field', name}`) → the field component the field provider resolves
 *   for that schema's `type` / `format`, wrapped in `SchemaFieldContent` in compact collection mode;
 * - an **action** descriptor (`field.action`) → a `SchemaActionField` button cell, icon-only inside a
 *   grid, resolved against the row's own action schema;
 * - a **wrapper** (`field.wrapper`) → several fields stacked in one column, optionally separated by
 *   a divider string.
 *
 * A descriptor that resolves to none of those is dropped, so an unknown name costs a column, not an
 * error.
 *
 * **Row actions.** The trailing sticky column is generated, not configured: it appears when the
 * resource declares actions that are both `showInList` and `isDetail` (on the product fixture,
 * Detail and Edit). `rowActionButtons={false}` removes the column entirely.
 *
 * **Row activation** has two independent slots, single click and double click. A slot is live when
 * the schema names an action for it (`singleClickAction` / `doubleClickAction`) or when the
 * `defaultRowAction` of the admin root maps to it. What a row activation *opens* — a redirect, a
 * dialog, a side panel — comes from the resolved view mode, not from the grid. Hovering a live row
 * shows a tooltip naming the action each gesture would run.
 *
 * **Drag to reorder** is opt-in and narrow, exactly like the image gallery's: `indexField` must be
 * set, the list sorted by that field ascending, and the active filters equal to `sortForFilters`.
 * Dropping a row writes the new position through `dataProvider.update` and refetches. While
 * dragging is live the columns stop being sortable — the two orders would contradict each other.
 *
 * Presentation (resizable and configurable columns, the sticky action column, the loading bar) is
 * `AdminDatagrid`'s; this component supplies the schema.
 */
const meta = {
  title: 'schema/collections/SchemaDatagrid',
  component: SchemaDatagrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: {disable: true},
    schemaStory: {list: true, width: false},
  },
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * `fields` unset — one column per field of the method schema, in schema order, each rendered by the
 * component the field provider resolves for it. The trailing sticky column is the generated row
 * actions.
 */
export const Default: Story = {
  render: () => <Grid />,
};

/** `fields` given — the columns picked and ordered by the descriptor list. */
export const Columns: Story = {
  render: () => <Grid fields={COLUMNS} />,
};

/**
 * The two non-field descriptors. A **wrapper** stacks several fields into one column, joined by
 * `divider`; an **action** descriptor renders the row's own action as an icon-only button in a
 * column of its own — distinct from the generated row-actions column at the end.
 */
export const WrapperAndActionColumns: Story = {
  render: () => (
    <Grid
      fields={[
        {
          type: 'field',
          name: 'identity',
          label: 'Product',
          wrapper: {fields: [fd('name'), fd('sku')], divider: ' · '},
        },
        fd('status'),
        fd('price'),
        {type: 'field', name: 'archive_column', label: 'Archive', action: {name: 'archive'}},
      ]}
    />
  ),
};

/**
 * `rowActionButtons={false}` drops the trailing sticky column that `Default` and `Columns` above
 * show. That column is *generated* — it appears when the resource declares actions that are both
 * `showInList` and `isDetail` (on the product fixture, Detail and Edit) — so switching it off is the
 * only thing a caller decides about it.
 *
 * It gets a story of its own rather than a two-grid showcase on purpose: two datagrids mounted side
 * by side under one `preferenceKey` but with **different columns** (here, one extra action column)
 * hand each other a stored column set that does not fit, and resize in a loop until React bails out
 * with "Maximum update depth exceeded" — a crash the story's error boundary swallows while the story
 * test still passes.
 */
export const WithoutRowActions: Story = {
  render: () => <Grid fields={COLUMNS} rowActionButtons={false} />,
};

/**
 * Both click slots named explicitly. Hover a row: the tooltip names what each gesture would run,
 * resolved per record from its own action schema — so a record that overrides an action's label
 * shows its own. Activating actually opens the target view, which in an isolated story means the
 * memory router simply navigates away from the canvas.
 */
export const RowActivation: Story = {
  render: () => (
    <Grid fields={COLUMNS} singleClickAction={{name: 'show'}} doubleClickAction={{name: 'edit'}} />
  ),
};

/**
 * `defaultRowAction` on the schema root is the fallback when the schema names no click action: with
 * `'click'` a single click activates the row's detail, with `'none'` neither gesture is live and no
 * hover tooltip appears. The stories above run on `'none'` unless they name a slot themselves.
 */
export const DefaultRowAction: Story = {
  parameters: {schemaStory: {list: true, width: false, root: {defaultRowAction: 'click'}}},
  render: () => <Grid fields={COLUMNS} />,
};

/**
 * `indexField` set — rows can be dragged into a new order, and the columns lose their sort handles
 * while that is live (a manual order and a column sort would contradict each other). Dropping a row
 * writes its new `position` through the data provider.
 *
 * Note that the box does not *wait* for the right sort: with `indexField` set and the filters
 * matching, it **forces** the list onto that field ascending. The way to have `indexField` and no
 * dragging is the filter precondition below, not a different sort.
 */
export const Draggable: Story = {
  render: () => (
    <Grid fields={COLUMNS} records={ORDERED_RECORDS} indexField={'position'} sort={BY_POSITION} />
  ),
};

/**
 * The same `indexField`, but `sortForFilters` declares the manual order only meaningful under
 * `status: published` — and the list is unfiltered. The precondition fails, so nothing is forced and
 * nothing drags: ordinary sortable columns, no drag handles.
 */
export const DragDisabledByFilters: Story = {
  render: () => (
    <Grid
      fields={COLUMNS}
      records={ORDERED_RECORDS}
      indexField={'position'}
      sortForFilters={{status: 'published'}}
    />
  ),
};

/** No rows — the datagrid's own empty state, with the column headers kept. */
export const EmptyCollection: Story = {
  render: () => <Grid fields={COLUMNS} records={[]} />,
};
