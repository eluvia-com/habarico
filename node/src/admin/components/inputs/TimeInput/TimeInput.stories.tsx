import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {TimeInput, TimeInputProps} from './TimeInput';

type TimeInputStoryArgs = TimeInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

/**
 * Time input — a design-styled MUI `TimePicker` bound to a React Admin field. Stores a `HH:mm:ss`
 * string. The schema layer maps it to the `time` format.
 */
const meta = {
  title: 'admin/inputs/TimeInput',
  component: TimeInput,
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
  args: {source: 'time', label: 'Time', error: false},
  decorators: [withInputShell],
} satisfies Meta<TimeInputStoryArgs>;

export default meta;
type Story = StoryObj<TimeInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <TimeInput {...(args as TimeInputProps)} validate={error ? failingValidate : undefined} />
  ),
};
