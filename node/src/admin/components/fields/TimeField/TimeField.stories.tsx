import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {TimeField, TimeFieldProps} from './TimeField';

/**
 * Read-only display for `time` values — parses a `HH:mm[:ss]` string and formats it as a short time in
 * the ambient locale (or the `locales` override). Kept on a single line; blank values render nothing.
 */
const meta = {
  title: 'admin/fields/TimeField',
  component: TimeField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {opensAt: '09:30:00'},
    controls: {include: ['label', 'locales']},
  },
  argTypes: {
    label: {control: 'text'},
    locales: {control: 'select', options: ['en-US', 'cs-CZ', 'de-DE']},
  },
  args: {
    source: 'opensAt',
    label: 'Opens at',
  },
  decorators: [withFieldShell],
} satisfies Meta<TimeFieldProps>;

export default meta;
type Story = StoryObj<TimeFieldProps>;

export const Playground: Story = {};

/** A fixed `locales` overrides the ambient locale — US formatting renders a 12-hour clock. */
export const UsLocale: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {locales: 'en-US'},
};
