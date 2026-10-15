import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {DateInput, DateInputProps} from './DateInput';

type DateInputStoryArgs = DateInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

/**
 * Date input — a design-styled MUI `DatePicker` bound to a React Admin field. Stores an ISO date
 * string (`yyyy-MM-dd`). The schema layer maps it to the `date` format. Supports
 * `minDate` / `maxDate` / `disablePast` / `disableFuture` / `shouldDisableDate` constraints.
 */
const meta = {
  title: 'admin/inputs/DateInput',
  component: DateInput,
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
  args: {source: 'date', label: 'Date', error: false},
  decorators: [withInputShell],
} satisfies Meta<DateInputStoryArgs>;

export default meta;
type Story = StoryObj<DateInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <DateInput {...(args as DateInputProps)} validate={error ? failingValidate : undefined} />
  ),
};

/** `disablePast` blocks earlier dates — one of the `min/max/disable*` constraints. */
export const NoPastDates: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {source: 'start_date', label: 'Start date', disablePast: true},
};
