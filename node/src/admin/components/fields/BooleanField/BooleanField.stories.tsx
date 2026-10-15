import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {BooleanField, BooleanFieldProps} from './BooleanField';

/**
 * Read-only display for `boolean` values — React Admin's `BooleanField` restyled to render the value
 * as a small `Chip` ("Yes" / "No", translated via `ra.message.*`). `color` tints the chip green/red
 * for true/false (otherwise neutral `default`), and `chipVariant` picks the chip style
 * (`soft` by default).
 */
const meta = {
  title: 'admin/fields/BooleanField',
  component: BooleanField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {active: true},
    controls: {include: ['label', 'color', 'chipVariant']},
  },
  argTypes: {
    label: {control: 'text'},
    color: {control: 'boolean'},
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

export const Playground: Story = {};

/** `color` on — the chip turns green for a true value (and red for a false one). */
export const Colored: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {color: true},
};

/** A false value, colored — renders the red "No" chip. */
export const Negative: Story = {
  parameters: {record: {active: false}, docs: {canvas: {sourceState: 'none'}}},
  args: {color: true},
};
