import React from 'react';
import {box, fd} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxItem, BoxSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaGridBox} from './SchemaGridBox';

const cell = (name: string, label: string, boxes: BoxItem[], spans?: BoxSchema['gridItem']) =>
  box({
    name,
    type: 'simple',
    label,
    boxes,
    ...(spans ? {gridItem: spans} : {}),
  });

const gridBox = (boxes: BoxItem[], overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({name: 'layout', type: 'grid', boxes, ...overrides});

/**
 * The **grid layout container** — lays its children out side by side instead of stacking them.
 *
 * Two ways to divide the row:
 *
 * - **Automatic.** With no child carrying `gridItem` the grid splits the row evenly between its
 *   cells, scaling down responsively (`computeAutoSpans`).
 * - **Explicit.** A child carries `gridItem: {xs, sm, md, lg, xl}` — the MUI breakpoint spans out
 *   of 12 — and the grid stops computing and uses them. The two modes do not mix: one child with
 *   `gridItem` switches the whole grid to explicit spans.
 *
 * A bare grid (no `label`, no `toolbarActions`, not `collapsible`) draws **no card** — it is a pure
 * layout container, and the cards you see belong to its cells. As the view's root box it keeps the
 * card default only while it holds fields of its own; otherwise it hands that default down.
 */
const meta = {
  title: 'schema/boxes/SchemaGridBox',
  component: SchemaGridBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Two cells, divided automatically. */
export const Default: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={gridBox([
        cell('left', 'Identity', [fd('name'), fd('sku')]),
        cell('right', 'Pricing', [fd('price'), fd('stock')]),
      ])}
    />
  ),
};

/** With no child carrying `gridItem` the grid divides the row evenly — two, three, then four cells. */
export const AutomaticSpans: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaGridBox — automatic spans'}>
      {[2, 3, 4].map((columns) => (
        <SchemaBox
          key={columns}
          isRoot
          schema={gridBox(
            Array.from({length: columns}, (_, index) =>
              cell(`auto_${columns}_${index}`, `${columns} cells`, [fd('name')])
            ),
            {name: `auto_${columns}`}
          )}
        />
      ))}
    </ShowcaseStack>
  ),
};

/**
 * Explicit spans: an 8/4 split, then 6/6, then 9/3 — the `gridItem` breakpoint values out of 12.
 * One child with `gridItem` is enough to switch the whole grid off automatic spans.
 */
export const ExplicitSpans: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaGridBox — explicit gridItem spans'}>
      {[
        [8, 4],
        [6, 6],
        [9, 3],
      ].map(([left, right]) => (
        <SchemaBox
          key={`${left}_${right}`}
          isRoot
          schema={gridBox(
            [
              cell(`g_${left}`, `md: ${left}`, [fd('name'), fd('sku')], {md: left}),
              cell(`g_${right}`, `md: ${right}`, [fd('price')], {md: right}),
            ],
            {name: `explicit_${left}_${right}`}
          )}
        />
      ))}
    </ShowcaseStack>
  ),
};

/** A labelled grid draws its own card around the cells; a bare one stays transparent. */
export const CardChrome: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaGridBox — card chrome'}>
      <SchemaBox
        isRoot
        schema={gridBox(
          [cell('lab_a', 'Left', [fd('name')]), cell('lab_b', 'Right', [fd('price')])],
          {
            name: 'labelled',
            label: 'Labelled grid → card',
          }
        )}
      />
      <SchemaBox
        isRoot
        schema={gridBox([
          cell('bare_a', 'Left', [fd('name')]),
          cell('bare_b', 'Right', [fd('price')]),
        ])}
      />
    </ShowcaseStack>
  ),
};

/** A grid of fields with no cell boxes — the grid lays the fields out directly. */
export const FieldCells: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={gridBox([fd('name'), fd('sku'), fd('price'), fd('stock')], {
        name: 'fields',
        label: 'Product',
      })}
    />
  ),
};
