import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {DateField, DateFieldProps} from './DateField';

/**
 * Read-only display for `date` values — React Admin's `DateField` locale-formatted (it falls back to
 * the ambient locale from `useLocaleState`) and kept on a single line. Set `showTime` to include the
 * time part, or `locales` to override the formatting locale.
 */
const meta = {
  title: 'admin/fields/DateField',
  component: DateField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {createdAt: '2026-01-15T09:30:00Z'},
    controls: {include: ['label', 'showTime', 'locales']},
  },
  argTypes: {
    label: {control: 'text'},
    showTime: {control: 'boolean'},
    locales: {control: 'select', options: ['en-US', 'cs-CZ', 'de-DE']},
  },
  args: {
    source: 'createdAt',
    label: 'Created at',
  },
  decorators: [withFieldShell],
} satisfies Meta<DateFieldProps>;

export default meta;
type Story = StoryObj<DateFieldProps>;

export const Playground: Story = {};

/** `showTime` adds the time part to the formatted output. */
export const WithTime: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {showTime: true},
};

/** A fixed `locales` overrides the ambient locale — here the Czech `d. M. yyyy` order. */
export const CzechLocale: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {locales: 'cs-CZ'},
};
