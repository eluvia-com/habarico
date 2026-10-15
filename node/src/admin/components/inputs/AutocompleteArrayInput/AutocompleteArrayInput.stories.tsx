import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {AutocompleteArrayInput, AutocompleteArrayInputProps} from './AutocompleteArrayInput';

type AutocompleteArrayInputStoryArgs = AutocompleteArrayInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

const tags = [
  {id: 'news', name: 'News'},
  {id: 'sport', name: 'Sport'},
  {id: 'culture', name: 'Culture'},
  {id: 'tech', name: 'Technology'},
  {id: 'travel', name: 'Travel'},
];

/**
 * Autocomplete array input — a restyle of React Admin's `AutocompleteArrayInput` that renders the
 * selected values as soft `Chip`s and adds the shared "type to search" behaviour: when the choices
 * context is paginated (`total > perPage`, e.g. inside a `ReferenceArrayInput`) it waits for
 * `minChars` before showing suggestions. With a static `choices` list (as in these stories) all
 * options are available immediately — `minChars` never has a visible effect here, so it is not
 * exposed as a Control. The schema layer uses it for the multi-value `relation` format.
 */
const meta = {
  title: 'admin/inputs/AutocompleteArrayInput',
  component: AutocompleteArrayInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {
      include: ['label', 'helperText', 'size', 'fullWidth', 'disabled', 'readOnly', 'error'],
    },
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    fullWidth: {control: 'boolean'},
    disabled: {control: 'boolean'},
    readOnly: {control: 'boolean'},
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {
    source: 'tags',
    label: 'Tags',
    choices: tags,
    size: 'small',
    fullWidth: true,
    error: false,
  },
  decorators: [withInputShell],
} satisfies Meta<AutocompleteArrayInputStoryArgs>;

export default meta;
type Story = StoryObj<AutocompleteArrayInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <AutocompleteArrayInput
      {...(args as AutocompleteArrayInputProps)}
      validate={error ? failingValidate : undefined}
    />
  ),
};

/** Seeded with values to show the selected options as soft chips. */
export const WithValues: Story = {
  parameters: {record: {tags: ['news', 'tech']}, docs: {canvas: {sourceState: 'none'}}},
};
