import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {AutocompleteInput, AutocompleteInputProps} from './AutocompleteInput';

type AutocompleteInputStoryArgs = AutocompleteInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

const countries = [
  {id: 'cz', name: 'Czech Republic'},
  {id: 'sk', name: 'Slovakia'},
  {id: 'de', name: 'Germany'},
  {id: 'at', name: 'Austria'},
  {id: 'pl', name: 'Poland'},
];

/**
 * Autocomplete input — a restyle of React Admin's `AutocompleteInput` that adds the shared
 * "type to search" behaviour: when the surrounding choices context has more results than one page
 * (`total > perPage`, i.e. inside a `ReferenceInput`), it only renders suggestions once at least
 * `minChars` have been typed and swaps the empty text to "start typing…". With a static `choices`
 * list (as in these stories) everything is available immediately — `minChars` never has a visible
 * effect here, so it is not exposed as a Control (see `ReferenceInput`'s own docs for a paginated
 * demo). The schema layer uses it for the single-value `relation` format.
 */
const meta = {
  title: 'admin/inputs/AutocompleteInput',
  component: AutocompleteInput,
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
    source: 'country',
    label: 'Country',
    choices: countries,
    size: 'small',
    fullWidth: true,
    error: false,
  },
  decorators: [withInputShell],
} satisfies Meta<AutocompleteInputStoryArgs>;

export default meta;
type Story = StoryObj<AutocompleteInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <AutocompleteInput
      {...(args as AutocompleteInputProps)}
      validate={error ? failingValidate : undefined}
    />
  ),
};

/** Seeded with a value to show the selected option. */
export const WithValue: Story = {
  parameters: {record: {country: 'cz'}, docs: {canvas: {sourceState: 'none'}}},
};
