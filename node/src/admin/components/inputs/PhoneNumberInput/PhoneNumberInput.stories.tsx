import type {Meta, StoryObj} from '@storybook/react-vite';
import {withInputShell} from '../_storyKit';
import {PhoneNumberInput} from './PhoneNumberInput';

/**
 * Phone number input — a `TextField` with a country selector (flag + dial code) and live national
 * masking as you type; stores the value with its country code (`+<code><digits>`). The set of
 * countries and the default come from `allowedRegions` / `defaultRegion`. The schema
 * layer maps it to the `phone` format.
 */
const meta = {
  title: 'admin/inputs/PhoneNumberInput',
  component: PhoneNumberInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['label', 'helperText', 'size', 'fullWidth']},
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    fullWidth: {control: 'boolean'},
  },
  args: {source: 'phone', label: 'Phone', size: 'small', fullWidth: true},
  decorators: [withInputShell],
} satisfies Meta<typeof PhoneNumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `allowedRegions` narrows the country selector to a specific set. */
export const AllowedRegions: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {allowedRegions: ['CZ', 'SK', 'DE']},
};
