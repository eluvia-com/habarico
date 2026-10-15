import React from 'react';
import type {TreeChoice} from '@design/molecules/TreeSelect';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {TreeArrayInput, TreeArrayInputProps} from './TreeArrayInput';

type TreeArrayInputStoryArgs = TreeArrayInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

// Static hierarchy — the input just binds the checked ids; the schema layer supplies these choices
// (from `useTreeChoices`) in the real app, so the stories stand up with no data provider.
const CHOICES: TreeChoice[] = [
  {id: 'electronics', name: 'Electronics'},
  {id: 'computers', name: 'Computers', parentId: 'electronics'},
  {id: 'laptops', name: 'Laptops', parentId: 'computers'},
  {id: 'desktops', name: 'Desktops', parentId: 'computers'},
  {id: 'phones', name: 'Phones', parentId: 'electronics'},
  {id: 'home', name: 'Home & Garden'},
  {id: 'furniture', name: 'Furniture', parentId: 'home'},
  {id: 'lighting', name: 'Lighting', parentId: 'home'},
];

/**
 * Tree multi-select input for hierarchical `tree-relation` references — a thin binding over the design
 * `TreeSelect`. It reads/writes the array of checked node ids via React Admin's `useInput`; the
 * `choices` are passed in (the schema layer resolves them through `useTreeChoices`). Hold
 * <kbd>ctrl</kbd> to select multiple nodes.
 */
const meta = {
  title: 'admin/inputs/TreeArrayInput',
  component: TreeArrayInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {
      include: ['label', 'disabled', 'fullWidth', 'error'],
    },
  },
  argTypes: {
    label: {control: 'text'},
    disabled: {control: 'boolean'},
    fullWidth: {control: 'boolean'},
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {
    source: 'categories',
    label: 'Categories',
    choices: CHOICES,
    fullWidth: true,
    error: false,
  },
  decorators: [withInputShell],
} satisfies Meta<TreeArrayInputStoryArgs>;

export default meta;
type Story = StoryObj<TreeArrayInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <TreeArrayInput
      {...(args as TreeArrayInputProps)}
      validate={error ? failingValidate : undefined}
    />
  ),
};

/** Seeded with checked nodes to show the selected state. */
export const WithSelection: Story = {
  parameters: {record: {categories: ['laptops', 'phones']}, docs: {canvas: {sourceState: 'none'}}},
};

/** Non-interactive, greyed out. */
export const Disabled: Story = {
  args: {disabled: true},
  parameters: {record: {categories: ['laptops']}, docs: {canvas: {sourceState: 'none'}}},
};
