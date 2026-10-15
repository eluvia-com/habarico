import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {TextInput, TextInputProps} from './TextInput';

type TextInputStoryArgs = TextInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

/**
 * Text input — a thin restyle of React Admin's `TextInput` that adds optional `prefix` / `postfix`
 * adornments via `prefix` / `postfix`. The schema layer maps it to the `string`, `text` (multiline), `email`,
 * `url` and `password` formats. Stories render inside a fixed-width card so `fullWidth` is visible.
 */
const meta = {
  title: 'admin/inputs/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {
      include: [
        'label',
        'helperText',
        'size',
        'multiline',
        'prefix',
        'postfix',
        'fullWidth',
        'disabled',
        'readOnly',
        'error',
      ],
    },
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    multiline: {control: 'boolean'},
    prefix: {control: 'text'},
    postfix: {control: 'text'},
    fullWidth: {control: 'boolean'},
    disabled: {control: 'boolean'},
    readOnly: {control: 'boolean'},
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {source: 'name', label: 'Name', size: 'small', fullWidth: true, error: false},
  decorators: [withInputShell],
} satisfies Meta<TextInputStoryArgs>;

export default meta;
type Story = StoryObj<TextInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <TextInput {...args} validate={error ? failingValidate : undefined} />
  ),
};

/** `multiline` renders a growing text area — used by the schema `text` format. */
export const Multiline: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'description',
    label: 'Description',
    multiline: true,
    helperText: 'Supports multiple lines',
  },
};

/** `prefix` / `postfix` render start/end adornments (e.g. a currency or unit). */
export const WithAdornments: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {source: 'price', label: 'Price', prefix: '$', postfix: '.00'},
};
