import React from 'react';
import {box, fd} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxItem, BoxSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaTabBox} from './SchemaTabBox';

const tab = (name: string, label: string, boxes: BoxItem[]): BoxSchema =>
  box({name, type: 'tab-item', label, boxes});

const TABS: BoxSchema[] = [
  tab('general', 'General', [fd('name'), fd('sku'), fd('status')]),
  tab('pricing', 'Pricing', [fd('price'), fd('stock')]),
  tab('contact', 'Contact', [fd('support_email'), fd('phone'), fd('website')]),
];

const tabBox = (boxes: BoxItem[], overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({name: 'tabs', type: 'tab', boxes, ...overrides});

/**
 * The **tab container** — one pane per `tab-item` child, only the selected one mounted.
 *
 * Only box children count: `SchemaTabBoxContent` filters its `boxes` to box schemas, so a bare field
 * descriptor dropped among the tabs is ignored rather than rendered as a nameless tab. Each
 * `tab-item` is itself an ordinary box (a `simple` box, as far as `defaultBoxProvider` is concerned),
 * so it takes the usual `label` / `card` / nested-box rules — which is why a tab can hold a grid, a
 * list box or another tab box.
 *
 * `tab.showToolbarNavigation` moves the tab strip out of the box header and into the view toolbar —
 * the layout a full-page detail view uses, where the tabs belong to the page rather than to a card
 * inside it.
 */
const meta = {
  title: 'schema/boxes/SchemaTabBox',
  component: SchemaTabBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Three tabs, the first one selected. Switching mounts the next pane. */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={tabBox(TABS)} />,
};

/** A single tab item still renders its strip — the box does not collapse to a plain panel. */
export const SingleTab: Story = {
  render: () => <SchemaBox isRoot schema={tabBox([TABS[0]], {name: 'single'})} />,
};

/**
 * A tab holding a **nested layout** rather than a flat field list: the first pane is a two-cell
 * grid, the second a plain field list. A `tab-item` is an ordinary box, so anything that can be a
 * box can be a tab's content.
 */
export const NestedLayout: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={tabBox(
        [
          box({
            name: 'overview',
            type: 'tab-item',
            label: 'Overview',
            boxes: [
              box({
                name: 'overview_grid',
                type: 'grid',
                boxes: [
                  box({
                    name: 'identity',
                    type: 'simple',
                    label: 'Identity',
                    boxes: [fd('name'), fd('sku')],
                  }),
                  box({
                    name: 'stock',
                    type: 'simple',
                    label: 'Availability',
                    boxes: [fd('price'), fd('stock')],
                  }),
                ],
              }),
            ],
          }),
          TABS[2],
        ],
        {name: 'nested'}
      )}
    />
  ),
};

/** Read-only vs. writable — the same tabs rendered as fields, then as inputs. */
export const ReadOnlyAndWritable: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaTabBox — readOnly'}>
      <SchemaBox isRoot schema={tabBox(TABS, {name: 'ro', readOnly: true})} />
      <SchemaBox isRoot schema={tabBox(TABS, {name: 'rw'})} />
    </ShowcaseStack>
  ),
};
