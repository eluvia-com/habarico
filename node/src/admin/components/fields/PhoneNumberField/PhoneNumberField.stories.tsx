import {FieldProps} from '@admin/components/fields/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {PhoneNumberField} from './PhoneNumberField';

/**
 * Read-only display for `phone` values — formats the stored number and, when the region can be
 * derived, prefixes it with the country `FlagIcon`. Kept on a single line; falls back to `--` when the
 * value is blank.
 */
const meta = {
  title: 'admin/fields/PhoneNumberField',
  component: PhoneNumberField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {phone: '+420777123456'},
    controls: {include: ['label']},
  },
  argTypes: {
    label: {control: 'text'},
  },
  args: {
    source: 'phone',
    label: 'Phone',
  },
  decorators: [withFieldShell],
} satisfies Meta<FieldProps>;

export default meta;
type Story = StoryObj<FieldProps>;

export const Playground: Story = {};

/** A US number — the flag and grouping follow the derived region. */
export const UsNumber: Story = {
  parameters: {record: {phone: '+12025550142'}, docs: {canvas: {sourceState: 'none'}}},
};

/** No value — the field shows `--`. */
export const Empty: Story = {
  parameters: {record: {phone: null}, docs: {canvas: {sourceState: 'none'}}},
};

/**
 * A search match — `record.meta.highlights` reports the matched span as raw-value `offsets`
 * (`[4, 7]` marks the raw digits `777` right after the `+420` country code). The field maps those
 * offsets onto its own formatted, spaced-out number, so only the matched group is marked — never
 * the flag or the rest of the number.
 */
export const Highlighted: Story = {
  parameters: {
    record: {
      phone: '+420777123456',
      meta: {
        highlights: [{name: 'phone', value: '777', label: 'Phone', offsets: [[4, 7]]}],
      },
    },
    docs: {canvas: {sourceState: 'none'}},
  },
};
