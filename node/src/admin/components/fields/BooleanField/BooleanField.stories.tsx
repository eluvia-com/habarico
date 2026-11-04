import React from 'react';
import {RecordContextProvider} from 'react-admin';
import {VariantGrid} from '@design/_storyKit';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import type {Decorator, Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {BooleanField, BooleanFieldProps, BooleanFieldVariant} from './BooleanField';

// `variant: 'icon'` draws its glyph inside a collection only — in a detail view it resolves to the
// word. Applied to the Playground, so its `icon` option is not a dead control showing the same text
// `'text'` already does, leaving the one shape the value exists for invisible.
const inCollection: Decorator = (Story) => (
  <ValueLocationContextProvider value={{isInCollection: true}}>
    <Story />
  </ValueLocationContextProvider>
);

/**
 * Read-only display for `boolean` values — React Admin's `BooleanField` restyled. `variant` picks the
 * shape: a small `Chip` ("Yes" / "No", translated via `ra.message.*`, the default), the plain `text`
 * of the same word, or an `icon` — a tick / cross glyph, which is a list affordance and falls back to
 * `text` outside a collection. `color` tints the chip and the glyph green/red for true/false
 * (otherwise neutral `default`), and `chipVariant` picks the MUI chip style (`soft` by default).
 *
 * The Playground renders inside a collection, as a list cell does — that is what makes all three
 * `variant` values visible there. `Variants` below shows the detail-view fallback beside it.
 */
const meta = {
  title: 'admin/fields/BooleanField',
  component: BooleanField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {active: true},
    controls: {include: ['label', 'color', 'variant', 'chipVariant']},
  },
  argTypes: {
    label: {control: 'text'},
    color: {control: 'boolean'},
    variant: {control: 'select', options: ['chip', 'text', 'icon']},
    chipVariant: {control: 'select', options: ['text', 'filled', 'outlined', 'soft']},
  },
  args: {
    source: 'active',
    label: 'Active',
  },
  decorators: [withFieldShell],
} satisfies Meta<BooleanFieldProps>;

export default meta;
type Story = StoryObj<BooleanFieldProps>;

// A story-level decorator is *added* to the meta's, not substituted for it, so the collection context
// has to sit here rather than on `meta` — otherwise the showcases below could never render the
// detail-view fallback.
export const Playground: Story = {decorators: [inCollection]};

// One showcase cell: a shape, the caption above it, and whether it has to be rendered inside a
// collection for that shape to be what it is.
type Shape = {variant: BooleanFieldVariant; label: string; inList?: boolean};

const CHIP: Shape = {variant: 'chip', label: 'chip'};
const TEXT: Shape = {variant: 'text', label: 'text'};
const ICON_IN_LIST: Shape = {variant: 'icon', label: 'icon · in a list', inList: true};
const ICON_IN_DETAIL: Shape = {variant: 'icon', label: 'icon · in a detail'};

const shapeCell = ({variant, inList}: Shape, value: boolean) => {
  const field = (
    <RecordContextProvider value={{active: value}}>
      <BooleanField source={'active'} label={false} color variant={variant} />
    </RecordContextProvider>
  );

  return inList ? (
    <ValueLocationContextProvider value={{isInCollection: true}}>
      {field}
    </ValueLocationContextProvider>
  ) : (
    field
  );
};

/**
 * The three shapes, and the one place a shape depends on where the field sits: `icon` draws a glyph in
 * a collection, where a column has no width to spare, and resolves to `text` in a detail view, where a
 * tick beside a label reads worse than the word it stands for.
 */
export const Variants: Story = {
  parameters: {controls: {include: []}, docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={[CHIP, TEXT, ICON_IN_LIST, ICON_IN_DETAIL]}
      keyOf={(shape) => shape.label}
      label={(shape) => shape.label}
      render={(shape) => shapeCell(shape, true)}
      align={'flex-start'}
    />
  ),
};

/**
 * `color` on, across both values: green for true, red for false. The two shapes that can carry a color
 * are shown together — `text` deliberately stays in the surrounding text color, where a tinted word
 * would read as a link rather than as a status.
 */
export const Colored: Story = {
  parameters: {controls: {include: []}, docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={[CHIP, ICON_IN_LIST]}
      keyOf={(shape) => shape.label}
      label={(shape) => shape.label}
      secondary={{
        items: [true, false],
        keyOf: (value) => String(value),
        label: (value) => (value ? 'true' : 'false'),
      }}
      render={shapeCell}
    />
  ),
};
