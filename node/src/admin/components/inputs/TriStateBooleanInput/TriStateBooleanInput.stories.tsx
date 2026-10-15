import React from 'react';
import {Stack} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withInputShell} from '../_storyKit';
import {TriStateBooleanInput, TriStateBooleanInputProps} from './TriStateBooleanInput';

/**
 * Tri-state boolean input — a `Yes / No / any` toggle used for **filtering** on boolean fields,
 * where "unset" (any) must be distinguishable from `false`. Selecting *any* clears the filter
 * (stores an empty string); *Yes* / *No* store `true` / `false`.
 */
const meta = {
  title: 'admin/inputs/TriStateBooleanInput',
  component: TriStateBooleanInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['label']},
  },
  argTypes: {
    label: {control: 'text'},
  },
  args: {source: 'active', label: 'Active'},
  decorators: [withInputShell],
} satisfies Meta<TriStateBooleanInputProps>;

export default meta;
type Story = StoryObj<TriStateBooleanInputProps>;

export const Playground: Story = {};

/** The three resolved states side by side: unset (any), `true` and `false`. */
export const States: Story = {
  parameters: {record: {yes: true, no: false}, docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <Stack spacing={2}>
      <TriStateBooleanInput source="unset" label="Unset (any)" />
      <TriStateBooleanInput source="yes" label="Yes" />
      <TriStateBooleanInput source="no" label="No" />
    </Stack>
  ),
};
