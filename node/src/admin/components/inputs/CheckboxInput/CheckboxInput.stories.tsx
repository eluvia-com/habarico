import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {CheckboxInput, CheckboxInputProps} from './CheckboxInput';

type CheckboxInputStoryArgs = CheckboxInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

/**
 * Checkbox input — a `useInput`-bound MUI `Checkbox` with a `FieldTitle` label and helper/error
 * text. A compact alternative to `BooleanInput`'s switch (e.g. an inline "I agree" consent).
 */
const meta = {
  title: 'admin/inputs/CheckboxInput',
  component: CheckboxInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['label', 'helperText', 'size', 'disabled', 'error']},
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    disabled: {control: 'boolean'},
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {source: 'agree', label: 'I agree to the terms', error: false},
  decorators: [withInputShell],
} satisfies Meta<CheckboxInputStoryArgs>;

export default meta;
type Story = StoryObj<CheckboxInputStoryArgs>;

export const Playground: Story = {
  parameters: {record: {agree: true}},
  render: ({error, ...args}) => (
    <CheckboxInput {...args} validate={error ? failingValidate : undefined} />
  ),
};
