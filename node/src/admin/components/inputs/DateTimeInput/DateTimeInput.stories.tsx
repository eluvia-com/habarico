import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {DateTimeInput, DateTimeInputProps} from './DateTimeInput';

type DateTimeInputStoryArgs = DateTimeInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

/**
 * Date-time input — a design-styled MUI `DateTimePicker` bound to a React Admin field. Stores an ISO
 * datetime string. The schema layer maps it to the `date-time` format.
 */
const meta = {
  title: 'admin/inputs/DateTimeInput',
  component: DateTimeInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['label', 'helperText', 'disabled', 'readOnly', 'error']},
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    disabled: {control: 'boolean'},
    readOnly: {control: 'boolean'},
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {source: 'timestamp', label: 'Timestamp', error: false},
  decorators: [withInputShell],
} satisfies Meta<DateTimeInputStoryArgs>;

export default meta;
type Story = StoryObj<DateTimeInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <DateTimeInput
      {...(args as DateTimeInputProps)}
      validate={error ? failingValidate : undefined}
    />
  ),
};
