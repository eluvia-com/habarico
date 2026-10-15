import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {NumberField, NumberFieldProps} from './NumberField';

/**
 * Read-only display for `number` values — locale-formats the number (via `toLocaleString`) and can
 * wrap it with a currency/unit derived from `numberFormat`, or an explicit
 * `prefix` / `postfix`. The affixes render in the muted secondary text color.
 */
const meta = {
  title: 'admin/fields/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {price: 1234.5},
    controls: {include: ['label', 'locales']},
  },
  argTypes: {
    label: {control: 'text'},
    locales: {control: 'select', options: ['en-US', 'cs-CZ', 'de-DE']},
  },
  args: {
    source: 'price',
    label: 'Price',
  },
  decorators: [withFieldShell],
} satisfies Meta<NumberFieldProps>;

export default meta;
type Story = StoryObj<NumberFieldProps>;

export const Playground: Story = {};

/** `numberFormat` with a currency style prints the currency symbol as a prefix/postfix. */
export const Currency: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    numberFormat: {style: 'currency', currency: 'EUR'},
  },
};

/** Explicit `prefix` / `postfix` affixes, rendered in the muted secondary color. */
export const WithAffixes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    prefix: '~',
    postfix: 'kg',
  },
};

/**
 * A search match — `record.meta.highlights` reports the matched span as raw-value `offsets`
 * (`[0, 4]` marks the raw `"1234"` in `"1234.5"`). The field maps those offsets onto its own
 * locale-formatted output, so only the matched digits (`1,234`) are marked, not the fraction or
 * the whole value.
 */
export const Highlighted: Story = {
  parameters: {
    record: {
      price: 1234.5,
      meta: {
        highlights: [{name: 'price', value: '1234', label: 'Price', offsets: [[0, 4]]}],
      },
    },
    docs: {canvas: {sourceState: 'none'}},
  },
  args: {locales: 'en-US'},
};
